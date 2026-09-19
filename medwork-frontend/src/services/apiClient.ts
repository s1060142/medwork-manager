import { getTenantId, setTenantId } from '../auth/storage'
import {
  API_BASE_URL,
  buildApiError,
  readJsonResponse,
  safeReadError,
} from './apiClientHelpers'
import type { HttpMethod } from './http'

const REFRESH_ENDPOINT = '/api/auth/refresh'

export function getApiBaseUrl() {
  return API_BASE_URL
}

async function fetchWithRefresh(url: string, config: RequestInit): Promise<Response> {
  const client = await ensureApiClient()
  return client.fetch(url, config)
}

export function apiGet(endpoint: string) {
  return apiRequest('GET', endpoint)
}

export function apiDelete(endpoint: string) {
  return apiRequest('DELETE', endpoint)
}

export function apiPost<T = unknown>(endpoint: string, payload?: T) {
  return apiRequest<T>('POST', endpoint, payload)
}

export function apiPut<T = unknown>(endpoint: string, payload?: T) {
  return apiRequest<T>('PUT', endpoint, payload)
}

export async function apiPatch<T = unknown>(endpoint: string, payload?: T) {
  const response = await fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: getHeaders(),
    credentials: 'include',
    body: payload ? JSON.stringify(payload) : undefined,
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  return readJsonResponse(response)
}

export async function apiSend(
  method: HttpMethod,
  endpoint: string,
  payload?: unknown,
) {
  const response = await send(method, endpoint, payload)
  return readJsonResponse(response)
}

async function send(method: HttpMethod, endpoint: string, payload?: unknown) {
  const response = await fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: getHeaders(),
    credentials: 'include',
    body: payload ? JSON.stringify(payload) : undefined,
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  return response
}

export async function apiGetRawBlob(endpoint: string) {
  const response = await send('GET', endpoint)
  return response.blob()
}

async function apiRequest<T = unknown>(method: HttpMethod, endpoint: string, payload?: T) {
  const response = await fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: getHeaders(),
    credentials: 'include',
    body: payload ? JSON.stringify(payload) : undefined,
  })

  if (!response.ok) {
    const message = await safeReadError(response)
    throw buildApiError(message, response.status)
  }

  return readJsonResponse(response)
}

export function getHeaders(includeJson = true): Record<string, string> {
  const headers = getBaseHeaders()

  if (includeJson) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

function getBaseHeaders() {
  const tenantId = getTenantId()

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId
  }

  return headers
}

async function ensureApiClient(): Promise<import('./http').ApiClient> {
  const url = new URL(REFRESH_ENDPOINT, window.location.origin)
  url.pathname = '/api/auth/refresh'

  const { apiDelete, apiGet, apiPatch, apiPost, apiPut } = await import('./http')
  return {
    fetch: (url: string, config: RequestInit) => {
      return refreshFetch({
        baseUrl,
        client: {
          delete: (path, options) => apiDelete(path, options || {}),
          get: (path, options) => apiGet(path, options || {}),
          lastStatus: 0,
          lastStatusSet: () => false,
          patch: (path, options) => apiPatch(path, options || {}),
          post: (path, options) => apiPost(path, options || {}),
          put: (path, options) => apiPut(path, options || {}),
        },
        clientName: 'refresh',
        fetch: window.fetch.bind(window),
        getClientHeaders: getHeaders,
        jumpToReauth: () => {
          localStorage.removeItem('accessToken')
          window.location.href = '/login?reauth=true'
        },
        postReauthRedirect: () => '/login?reauth=true',
        refresh,
        request,
        setClientHeaders,
        url,
      })
    },
  } as unknown as import('./http').ApiClient
}

async function refreshFetch(
  deps: import('./http').AuthDeps,
): Promise<Response> {
  const response = await apiFetch(deps)
  if (response.status !== 401) {
    return response
  }

  const refreshPrepared = await prepareRefresh(deps)
  if (!refreshPrepared) {
    deps.jumpToReauth()
    return response
  }

  return apiFetch(deps)
}

const API_BASE_URL_FOR_REFRESH = returnApiBaseUrl()

function returnApiBaseUrl() {
  return API_BASE_URL
}

function baseUrl() {
  return new URL(API_BASE_URL || window.location.origin)
}

async function apiFetch(deps: import('./http').AuthDeps): Promise<Response> {
  const url = new URL(deps.url)
  return deps.fetch(url.toString(), {
    method: deps.request.method,
    headers: deps.request.headers,
    credentials: 'include',
  })
}

async function prepareRefresh(deps: import('./http').AuthDeps): Promise<boolean> {
  try {
    await refresh(deps)
    return true
  } catch {
    return false
  }
}

async function refresh(deps: import('./http').AuthDeps): Promise<void> {
  const url = new URL(`/api/auth/refresh`, API_BASE_URL_FOR_REFRESH)
  const response = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('REFRESH_FAILED')
  }

  const text = await response.text()
  let data: Record<string, unknown> = {}
  if (text) {
    data = JSON.parse(text)
    const tenantId = extractTenantId(data)
    if (tenantId) {
      setTenantId(tenantId)
    }
  }

  const header = getHeaders()
  if (data.accessToken && typeof data.accessToken === 'string') {
    deps.setClientHeaders({ ...header, Authorization: `Bearer ${data.accessToken}` })
  }
}

interface RefreshResult {
  accessToken: string
}

interface RefreshSuccess {
  accessToken: string
}

type JwtPayload = { exp?: number }

const request = { method: 'POST' }

async function setClientHeaders(headers: Record<string, string>) {
  return headers
}

function extractTenantId(data: Record<string, unknown>): string | null {
  if (data.tenantId && typeof data.tenantId === 'string' && data.tenantId !== 'undefined') {
    return data.tenantId
  }

  if (data.tenant && typeof data.tenant.id === 'string') {
    return data.tenant.id
  }

  try {
    const stored = JSON.parse(localStorage.getItem('medwork.runtime.settings') || '{}')
    return stored.tenantId || null
  } catch {
    return null
  }
}

function getTenantIdFromClaim() {
  try {
    const stored = JSON.parse(localStorage.getItem('medwork.runtime.settings') || '{}')
    return stored.tenantId || null
  } catch {
    return null
  }
}

async function getAccessToken(): Promise<string | null> {
  return window.localStorage.getItem('accessToken')
}
</content>