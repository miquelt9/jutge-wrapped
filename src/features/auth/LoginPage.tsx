import { useState, type FormEvent } from "react"
import { Lock, LogIn, Shield } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { CorsOverlay } from "@/components/CorsOverlay"
import { ThemeSelect } from "@/components/ThemeSelect"

export function LoginPage() {
  const { login, error, clearError, status } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    clearError()
    try {
      await login(email, password)
    } catch {
      /* surfaced via context */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="jutge-page relative flex min-h-full flex-col">
      <header className="jutge-nav flex items-center justify-between px-4 py-3">
        <div>
          <span className="font-bold text-white">Jutge.org</span>
          <span className="ml-2 text-sm text-white/70">Wrapped</span>
        </div>
        <ThemeSelect onDark />
      </header>

      {error?.kind === "network" && (
        <CorsOverlay kind={error.kind} message={error.message} onDismiss={clearError} />
      )}

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="jutge-panel w-full max-w-md">
          <div className="jutge-panel-heading">Sign in</div>
          <div className="jutge-panel-body">
            <p className="text-sm text-jutge-muted">
              Use your Jutge credentials. Your token stays in memory only — we never store your
              password.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="font-bold">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="jutge-input mt-1"
                />
              </label>
              <label className="block text-sm">
                <span className="font-bold">Password</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="jutge-input mt-1"
                />
              </label>

              {error && error.kind !== "network" && (
                <p className="jutge-alert-danger">{error.message}</p>
              )}

              <button
                type="submit"
                disabled={submitting || status === "authenticating"}
                className="jutge-btn-primary flex w-full items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {submitting ? "Signing in…" : "Continue"}
              </button>
            </form>

            <div className="mt-6 flex gap-4 text-xs text-jutge-muted">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> In-memory session
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> No credential persistence
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
