import { useState, type FormEvent } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Info, Lock, LogIn, Shield } from "lucide-react"
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

            <div className="mt-4 flex items-start gap-2 text-left text-xs text-jutge-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <p>{t("common.disclaimer")}</p>
            </div>

            {import.meta.env.DEV && (
              <div className="mt-8 border-t border-jutge-border pt-6">
                <p className="jutge-eyebrow">{t("login.localTesting")}</p>
                <p className="mt-1 text-xs text-jutge-muted">
                  <Trans
                    i18nKey="login.localTestingHint"
                    components={[<code key="0" className="font-mono" />]}
                  />
                </p>
                <SnapshotLoadButton className="mt-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
