import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  createJutgeClient,
  mapApiError,
  type JutgeApiClient,
  type MappedApiError,
} from "@/api/client"

type AuthStatus = "anonymous" | "authenticating" | "authenticated"

type AuthContextValue = {
  status: AuthStatus
  client: JutgeApiClient | null
  userUid: string | null
  tokenExpiresAt: string | number | null
  error: MappedApiError | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<JutgeApiClient | null>(null)
  const [status, setStatus] = useState<AuthStatus>("anonymous")
  const [userUid, setUserUid] = useState<string | null>(null)
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | number | null>(
    null,
  )
  const [error, setError] = useState<MappedApiError | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setStatus("authenticating")
    setError(null)
    const nextClient = createJutgeClient()
    try {
      const credentials = await nextClient.login({ email, password })
      setClient(nextClient)
      setUserUid(credentials.user_uid)
      setTokenExpiresAt(credentials.expiration)
      setStatus("authenticated")
    } catch (err) {
      setClient(null)
      setUserUid(null)
      setTokenExpiresAt(null)
      setStatus("anonymous")
      setError(mapApiError(err))
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    setClient(null)
    setUserUid(null)
    setTokenExpiresAt(null)
    setStatus("anonymous")
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({
      status,
      client,
      userUid,
      tokenExpiresAt,
      error,
      login,
      logout,
      clearError,
    }),
    [status, client, userUid, tokenExpiresAt, error, login, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
