// Shared CSV export helper used by list/table views.
// `headers` may be an array of strings (field names) or an array of
// { label, value } column descriptors. `rows` is an array of objects.

function escapeCsvCell(value) {
  const text = value == null ? '' : String(value)
  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function downloadCsv(filename, headers, rows) {
  const normalizedHeaders = headers.map((header) =>
    typeof header === 'string' ? { label: header, value: header } : header,
  )

  const lines = [
    normalizedHeaders.map((header) => escapeCsvCell(header.label ?? header.value ?? header)).join(';'),
  ]

  for (const row of rows) {
    const cells = normalizedHeaders.map((header) => {
      if (header.value) return escapeCsvCell(row[header.value])
      return escapeCsvCell(row[header.label ?? header])
    })
    lines.push(cells.join(';'))
  }

  const blob = new Blob(['﻿', lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
