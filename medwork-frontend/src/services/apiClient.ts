export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5279'

export function getApiBaseUrl() {
  return API_BASE_URL
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
  const response = await fetch(`${API_BASE_URL}/api/integrations/export-employee-csv`, {
    method: 'GET',
    headers: getHeaders(),
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

  const response = await fetch(`${API_BASE_URL}/api/integrations/import-employee`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Errore durante l\'importazione CSV.')
  }

  return response.json()
}

export async function hrExportExcel() {
  const response = await fetch(`${API_BASE_URL}/api/integrations/export-employee-excel`, {
    method: 'GET',
    headers: getHeaders(),
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
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  return readJsonResponse(response)
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

export async function apiSend(method, endpoint, payload) {
  const headers = getHeaders()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
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