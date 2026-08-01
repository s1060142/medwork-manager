const AUDIT_STORAGE_KEY = 'medwork.audit.events'

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function readAuditEvents() {
  const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
  const list = safeParse(raw, [])
  return Array.isArray(list) ? list : []
}

export function appendAuditEvent(event) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...event,
  }

  const next = [entry, ...readAuditEvents()].slice(0, 400)
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(next))
  return entry
}

export function clearAuditEvents() {
  localStorage.removeItem(AUDIT_STORAGE_KEY)
}
