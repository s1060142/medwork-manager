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
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5279'
    const targetUrl = typeof window !== 'undefined' && window.location?.origin ? '/api/audit/events' : `${apiBase}/api/audit/events`
    fetch(targetUrl, {
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
      // Non-blocking background log
    })
  }

  return entry
}

export function clearAuditEvents() {
  localStorage.removeItem(AUDIT_STORAGE_KEY)
}
