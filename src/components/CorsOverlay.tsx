import { Trans, useTranslation } from "react-i18next"
import { AlertTriangle, X } from "lucide-react"
import type { ApiErrorKind } from "@/api/client"

type Props = {
  kind: ApiErrorKind
  message: string
  onDismiss?: () => void
}

export function CorsOverlay({ kind, message, onDismiss }: Props) {
  const { t } = useTranslation()

  if (kind !== "network") return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="jutge-panel max-w-lg">
        <div className="jutge-panel-heading flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-jutge-orange">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{t("cors.title")}</span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-jutge-muted hover:text-jutge-text"
              aria-label={t("common.dismiss")}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="jutge-panel-body space-y-3 text-sm text-jutge-text">
          <p>{message}</p>
          <ul className="list-inside list-disc text-jutge-muted">
            <li>{t("cors.hintCredentials")}</li>
            <li>
              <Trans
                i18nKey="cors.hintCors"
                components={[<code key="0" className="text-jutge-blue" />]}
              />
            </li>
            <li>{t("cors.hintExtensions")}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
