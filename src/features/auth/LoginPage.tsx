import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Github, Info, Lock, LogIn, Shield } from "lucide-react"

const GITHUB_REPO_URL = "https://github.com/miquelt9/jutge-wrapped"
import { useAuth } from "@/context/AuthContext"
import { CorsOverlay } from "@/components/CorsOverlay"
import { NavControls } from "@/components/NavControls"
import { SnapshotLoadButton } from "@/components/SnapshotLoadButton"
import { translateApiError } from "@/features/wrapped/errors"

export function LoginPage() {
  const { t } = useTranslation()
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

  const errorMessage = error ? translateApiError(error) : null

  return (
    <div className="jutge-page relative flex min-h-full flex-col">
      <header className="jutge-nav flex items-center justify-between px-4 py-3">
        <div>
          <span className="font-bold text-white">{t("common.brand")}</span>
          <span className="ml-2 text-sm text-white/70">{t("common.wrapped")}</span>
        </div>
        <NavControls onDark />
      </header>

      {error?.kind === "network" && (
        <CorsOverlay
          kind={error.kind}
          message={translateApiError(error)}
          onDismiss={clearError}
        />
      )}

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="jutge-panel w-full max-w-md">
          <div className="jutge-panel-heading">{t("login.signIn")}</div>
          <div className="jutge-panel-body">
            <p className="text-sm text-jutge-muted">{t("login.intro")}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="font-bold">{t("login.email")}</span>
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
                <span className="font-bold">{t("login.password")}</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="jutge-input mt-1"
                />
              </label>

              {errorMessage && error?.kind !== "network" && (
                <p className="jutge-alert-danger">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={submitting || status === "authenticating"}
                className="jutge-btn-primary flex w-full items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {submitting ? t("login.signingIn") : t("login.continue")}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-jutge-muted">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> {t("login.sessionMemory")}
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> {t("login.noCredentialPersistence")}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-1 text-left text-xs text-jutge-muted">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <p>{t("common.disclaimer")}</p>
            </div>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-jutge-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="bg-jutge-panel px-2 text-jutge-muted">{t("login.or")}</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs text-jutge-muted">{t("login.loadSnapshotHint")}</p>
              <SnapshotLoadButton className="mt-3" />
            </div>
          </div>
        </div>
      </div>

      <footer className="shrink-0 px-4 py-4 text-center">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-jutge-muted transition-colors hover:text-jutge-text"
        >
          <Github className="h-3.5 w-3.5" aria-hidden />
          {t("login.viewOnGitHub")}
        </a>
      </footer>
    </div>
  )
}
