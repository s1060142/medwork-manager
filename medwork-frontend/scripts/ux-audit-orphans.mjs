/**
 * MedWork — orphan component inventory
 * Builds the import graph from src/main.jsx, computes reachability, and extracts
 * purpose/signature/endpoints for every component.
 * Run: node scripts/ux-audit-orphans.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'c:/github/medwork-manager/medwork-frontend/src'
const OUT = 'c:/github/medwork-manager/screenshots/ux-audit/orphans.json'
const EXT = ['.jsx', '.tsx', '.js', '.ts']

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return EXT.includes(path.extname(e.name)) ? [p] : []
  })

const files = walk(SRC)
const norm = (p) => p.replace(/\\/g, '/')

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null
  let base = path.resolve(path.dirname(fromFile), spec)
  // the codebase mixes .jsx specifiers with .tsx/.ts files (e.g. './App.jsx' -> App.tsx)
  const specExt = path.extname(base)
  if (specExt) {
    const stem = base.slice(0, -specExt.length)
    for (const ext of EXT) if (fs.existsSync(stem + ext)) return norm(stem + ext)
    base = stem
  }
  for (const ext of EXT) if (fs.existsSync(base + ext)) return norm(base + ext)
  for (const ext of EXT) {
    const idx = path.join(base, `index${ext}`)
    if (fs.existsSync(idx)) return norm(idx)
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return norm(base)
  return null
}

const contents = {}
for (const f of files) contents[norm(f)] = fs.readFileSync(f, 'utf8')

const importsOf = {}
const importedBy = {}
for (const [file, text] of Object.entries(contents)) {
  const specs = [
    ...text.matchAll(/import\s+(?:[\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g),
    ...text.matchAll(/import\s*['"]([^'"]+)['"]/g),
    ...text.matchAll(/React\.lazy\(\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g),
  ].map((m) => m[1])
  importsOf[file] = specs.map((s) => resolveImport(file, s)).filter(Boolean)
  for (const dep of importsOf[file]) {
    importedBy[dep] = importedBy[dep] || []
    importedBy[dep].push(file)
  }
}

// reachability from the real entry point
const entry = norm(path.join(SRC, 'main.jsx'))
const reachable = new Set()
const queue = [entry]
while (queue.length) {
  const cur = queue.pop()
  if (reachable.has(cur)) continue
  reachable.add(cur)
  for (const dep of importsOf[cur] || []) if (!reachable.has(dep)) queue.push(dep)
}

const rel = (p) => p.replace(norm(SRC) + '/', '')

const inventory = files.map((f) => {
  const key = norm(f)
  const text = contents[key]
  const sig =
    text.match(/export\s+default\s+function\s+(\w+)\s*\(([^)]*)\)/) ||
    text.match(/export\s+default\s+(\w+)/)
  const headings = [
    ...text.matchAll(/<Typography[^>]*variant="(h[1-6]|overline|subtitle1)"[^>]*>\s*([^<{\n]{3,80})/g),
  ].map((m) => m[2].trim())
  const endpoints = [
    ...new Set([...text.matchAll(/(?:apiGet|apiSend|fetch)\(\s*(?:'[A-Z]+'\s*,\s*)?['"]([^'"]+)['"]/g)].map((m) => m[1])),
  ]
  const isReachable = reachable.has(key)
  const importers = [...new Set((importedBy[key] || []).map(rel))]
  const reachableImporters = importers.filter((i) => reachable.has(norm(path.join(SRC, i))))
  return {
    file: rel(key),
    component: sig ? sig[1] : '(none)',
    props: sig && sig[2] !== undefined ? sig[2].replace(/\s+/g, ' ').trim() : '',
    lines: text.split('\n').length,
    reachableFromEntry: isReachable,
    importedBy: importers,
    reachableImporters,
    transitivelyHidden: !isReachable && importers.length > 0,
    neverImported: !isReachable && importers.length === 0,
    headings: [...new Set(headings)].slice(0, 4),
    endpoints: endpoints.slice(0, 6),
  }
})

const components = inventory.filter((i) => i.file.startsWith('components/'))
const orphans = components.filter((c) => !c.reachableFromEntry)

fs.writeFileSync(OUT, JSON.stringify({ entry: rel(entry), reachableCount: reachable.size, inventory, orphans }, null, 2))

console.log(`ENTRY: ${rel(entry)} | reachable files: ${reachable.size}/${files.length}`)
console.log(`\nCOMPONENTS: ${components.length} | REACHABLE: ${components.length - orphans.length} | ORPHAN: ${orphans.length}`)
console.log('\n=== REACHABLE (wired to the app) ===')
for (const c of components.filter((x) => x.reachableFromEntry).sort((a, b) => a.file.localeCompare(b.file))) {
  console.log(`  ${c.file} :: ${c.component}(${c.props})`)
}
console.log('\n=== ORPHAN: never imported anywhere (dead code) ===')
for (const c of orphans.filter((x) => x.neverImported).sort((a, b) => a.file.localeCompare(b.file))) {
  console.log(`  ${c.file} :: ${c.component} :: ${c.lines}L :: ${c.headings.join(' / ') || '-'}`)
}
console.log('\n=== ORPHAN: imported but transitively unreachable (hidden features) ===')
for (const c of orphans.filter((x) => x.transitivelyHidden).sort((a, b) => a.file.localeCompare(b.file))) {
  console.log(`  ${c.file} :: ${c.component} :: ${c.lines}L :: used only by [${c.importedBy.join(', ')}]`)
}
console.log('\nJSON:', OUT)
