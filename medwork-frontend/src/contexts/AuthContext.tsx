import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { getToken, getTenantId, setToken, removeToken, setTenantId, removeTenantId } from '../services/apiClient'

interface AuthContextValue {
  token: string | null
  tenantId: string | null
  login: (tokenValue: string, tenantIdValue: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  tenantId: null,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken() || null)
  const [tenantId, setTenantIdState] = useState<string | null>(() => getTenantId() || null)

  const login = useCallback((tokenValue: string, tenantIdValue: string) => {
    setToken(tokenValue)
    setTenantId(tenantIdValue)
    setTokenState(tokenValue)
    setTenantIdState(tenantIdValue)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    removeTenantId()
    setTokenState(null)
    setTenantIdState(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, tenantId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
