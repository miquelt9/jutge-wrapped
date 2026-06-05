import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Github, Info, Lock, LogIn, Shield } from "lucide-react"

const GITHUB_REPO_URL = "https://github.com/miquelt9/jutge-wrapped"
import { useAuth } from "@/context/AuthContext"
import { AppVersionBadge } from "@/components/AppVersionBadge"
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
      <header className="jutge-nav">
        <div className="jutge-nav-inner">
          <div className="jutge-nav-start min-w-0">
            <span className="truncate font-bold text-white">
              {t("common.brand")}
            </span>
            <span className="hidden text-sm text-white/70 sm:inline">
              {t("common.wrapped")}
            </span>
            <AppVersionBadge className="hidden text-xs text-white/45 sm:inline" />
          </div>
          <div className="jutge-nav-end">
            <NavControls onDark compact />
          </div>
        </div>
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
            <h1 className="text-jutge-text text-center text-lg font-black sm:text-xl">
              {t("login.underDevelopmentTitle")}
            </h1>
            <p className="text-jutge-muted text-sm">{t("login.intro")}</p>

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

            <div className="text-jutge-muted mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> {t("login.sessionMemory")}
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />{" "}
                {t("login.noCredentialPersistence")}
              </span>
            </div>

            <div className="text-jutge-muted mt-4 flex items-center gap-1 text-left text-xs">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <p>{t("common.disclaimer")}</p>
            </div>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="border-jutge-border w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs tracking-wide uppercase">
                <span className="bg-jutge-panel text-jutge-muted px-2">
                  {t("login.or")}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-jutge-muted text-xs">
                {t("login.loadSnapshotHint")}
              </p>
              <SnapshotLoadButton className="mt-3" />
            </div>

            <div className="mt-5 text-center sm:hidden">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-jutge-muted hover:text-jutge-text inline-flex items-center gap-1.5 text-xs transition-colors"
              >
                <Github className="h-3.5 w-3.5" aria-hidden />
                {t("login.viewOnGitHub")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer className="hidden shrink-0 px-4 py-4 text-center sm:block">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-jutge-muted hover:text-jutge-text inline-flex items-center gap-1.5 text-xs transition-colors"
        >
          <Github className="h-3.5 w-3.5" aria-hidden />
          {t("login.viewOnGitHub")}
        </a>
      </footer>
    </div>
  )
}
