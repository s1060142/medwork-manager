export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5279'

export function getApiBaseUrl() {
  return API_BASE_URL
}

async function fetchWithRefresh(url: string, config: RequestInit) {
  let response = await fetch(url, config)
  
  if (response.status === 401) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (refreshResponse.ok) {
        const text = await refreshResponse.text()
        if (text) {
          const data = JSON.parse(text)
          if (data && data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken)
            if (config.headers && (config.headers as Record<string, string>)['Authorization']) {
              (config.headers as Record<string, string>)['Authorization'] = `Bearer ${data.accessToken}`
            }
            response = await fetch(url, config)
          }
        }
      }
    } catch (e) {
      console.error('Auto-refresh failed', e)
    }
  }
  return response
}

export function getHeaders(tenantId?: string | null) {
  const token = localStorage.getItem('accessToken')

  if (!token) {
    return {}
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId
  }

  return headers
}

export async function hrExportCsv() {
  const response = await fetchWithRefresh(`${API_BASE_URL}/api/integrations/export-employee-csv`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Errore durante l\'esportazione CSV.')
  }

  return response.blob()
}

export async function hrImportCsv(file: File, fileName: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', fileName)

  const headers = getHeaders()
  delete headers['Content-Type']

  const response = await fetchWithRefresh(`${API_BASE_URL}/api/integrations/import-employee`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Errore durante l\'importazione CSV.')
  }

  return response.json()
}

export async function hrExportExcel() {
  const response = await fetchWithRefresh(`${API_BASE_URL}/api/integrations/export-employee-excel`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Errore durante l\'esportazione Excel.')
  }

  return response.blob()
}

export async function apiGet(endpoint, options?: { tenantId?: string; forceLogin?: boolean }) {
  const headers = options?.tenantId ? getHeaders(options.tenantId) : getHeaders()

  const config = {
    method: 'GET',
    headers: headers,
    credentials: 'include' as RequestCredentials,
  }

  const response = await fetchWithRefresh(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  return readJsonResponse(response)
}

export async function authLogin(username, password, tenantSlug = 'default', rememberMe = false) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password, tenantSlug, rememberMe }),
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message || 'Credenziali non valide.', response.status)
  }

  return readJsonResponse(response)
}

export async function authLogout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    })
  } catch (e) {
    console.error('Logout API error:', e)
  }
}

export async function authLoginWithExternalProvider(provider: 'spid' | 'cie' | 'keycloak', token: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/external/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message || 'Autenticazione esterna fallita.', response.status)
  }

  return readJsonResponse(response)
}

export async function apiDownload(endpoint, options = {}) {
  const headers = options.tenantId ? getHeaders(options.tenantId) : getHeaders()
  const response = await fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  return response.blob()
}

export async function apiSend(method, endpoint, payload) {
  const headers = getHeaders()
  const response = await fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    credentials: 'include',
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
        if (parsed?.errors && typeof parsed.errors === 'object') {
          const details = Object.entries(parsed.errors)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join(' | ')
          if (details) {
            return `${parsed.title ? `${parsed.title}: ` : ''}${details}`
          }
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

export function buildApiError(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}

export { readJsonResponse, safeReadError }

export function getToken() {
  return localStorage.getItem('accessToken')
}

export function getRole() {
  return localStorage.getItem('role')
}

export function getTenantId() {
  const settings = JSON.parse(localStorage.getItem('medwork.runtime.settings') || '{}')
  return settings.tenantId || null
}

export function getTenantSlug() {
  const settings = JSON.parse(localStorage.getItem('medwork.runtime.settings') || '{}')
  return settings.tenantSlug || 'default'
}

export function setTenantId(tenantId: string) {
  const settings = JSON.parse(localStorage.getItem('medwork.runtime.settings') || '{}')
  settings.tenantId = tenantId
  localStorage.setItem('medwork.runtime.settings', JSON.stringify(settings))
}

export function getActiveCompanyId() {
  const settings = JSON.parse(localStorage.getItem('medwork.runtime.settings') || '{}')
  return settings.activeCompanyId || null
}

export function setActiveCompanyId(companyId: string) {
  const settings = JSON.parse(localStorage.getItem('medwork.runtime.settings') || '{}')
  settings.activeCompanyId = companyId
  localStorage.setItem('medwork.runtime.settings', JSON.stringify(settings))
}