const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000'

export function getApiBaseUrl() {
  return API_BASE_URL
}

// ===== Refresh token proattivo =====
// Rinnova il JWT quando mancano meno di 15 minuti alla scadenza.
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000
let refreshInFlight = null

function getTokenExpiryMs(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

async function maybeRefreshToken() {
  const token = localStorage.getItem('accessToken')
  if (!token) return

  const expiry = getTokenExpiryMs(token)
  if (!expiry) return

  const remaining = expiry - Date.now()
  if (remaining > REFRESH_THRESHOLD_MS || remaining <= 0) return

  // Evita refresh concorrenti
    if (!refreshInFlight) {
      refreshInFlight = fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          if (data?.accessToken) {
            localStorage.setItem('accessToken', data.accessToken)
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        refreshInFlight = null
      })
  }

  await refreshInFlight
}

function getContextHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const companyId = localStorage.getItem('activeCompanyId')
  const siteId = localStorage.getItem('activeBranchId')
  if (companyId) headers['X-Company-Id'] = companyId
  if (siteId) headers['X-Site-Id'] = siteId
  return headers
}

function getHeaders() {
  const token = localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...getContextHeaders(),
  }
}

export async function apiGet(endpoint) {
  await maybeRefreshToken()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  const data = await readJsonResponse(response)
  // Molti endpoint master-data restituiscono un wrapper paginato { total, items: [...] }
  // (es. /api/master-data/employees). Per retrocompatibilità con i componenti che
  // si aspettano un array grezzo, estraiamo .items quando presente.
  if (data && !Array.isArray(data) && Array.isArray(data.items)) {
    return data.items
  }
  return data
}

export async function authLogin(username, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message || 'Credenziali non valide.', response.status)
  }

  return readJsonResponse(response)
}

export async function apiSend(method, endpoint, payload) {
  await maybeRefreshToken()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: getHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  if (response.status === 204) {
    return null
  }

  return readJsonResponse(response)
}

async function readJsonResponse(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Risposta API non valida (atteso JSON). Verifica VITE_API_BASE_URL e backend attivo.')
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Impossibile leggere la risposta JSON dal backend.')
  }
}

async function safeReadError(response) {
  if (response.status === 401) {
    return 'Sessione non valida o scaduta: esegui nuovamente il login.'
  }

  if (response.status === 403) {
    const role = localStorage.getItem('role') || 'N/D'
    return `Accesso negato per il ruolo corrente (${role}).`
  }

  try {
    const text = await response.text()
    if (!text) {
      return 'Errore durante l\'operazione.'
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.toLowerCase().includes('application/json')) {
      try {
        const parsed = JSON.parse(text)
        if (typeof parsed === 'string') {
          return parsed
        }
        if (parsed?.message) {
          return parsed.message
        }
        if (parsed?.title) {
          return parsed.title
        }
      } catch {
        // Fallback to plain text handling below.
      }
    }

    if (response.status >= 500) {
      return 'Errore interno del backend. Riprova tra pochi secondi.'
    }

    return text
  } catch {
    return 'Errore durante l\'operazione.'
  }
}

function buildApiError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}