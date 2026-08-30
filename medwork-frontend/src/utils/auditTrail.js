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

  // Keep local cache for immediate UI feedback
  const next = [entry, ...readAuditEvents()].slice(0, 400)
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(next))

  // Fire-and-forget to server-side immutable audit log
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (token) {
    fetch('/api/audit/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        module: event.module,
        action: event.action,
        detail: event.detail,
      }),
    }).catch((err) => {
      console.warn('Audit event delivery failed:', err)
    })
  }

  return entry
}

export function clearAuditEvents() {
  localStorage.removeItem(AUDIT_STORAGE_KEY)
}
