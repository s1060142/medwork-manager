import { createContext, useContext, useState, ReactNode } from 'react'
import { getToken, getTenantId } from '../services/apiClient'

interface AuthContextValue {
  token: string | null
  tenantId: string | null
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  tenantId: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token] = useState<string | null>(() => getToken() || null)
  const [tenantId] = useState<string | null>(() => getTenantId() || null)

  return (
    <AuthContext.Provider value={{ token, tenantId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
