import { AlertTriangle, X } from "lucide-react"
import type { ApiErrorKind } from "@/api/client"

type Props = {
  kind: ApiErrorKind
  message: string
  onDismiss?: () => void
}

export function CorsOverlay({ kind, message, onDismiss }: Props) {
  if (kind !== "network") return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="jutge-panel max-w-lg">
        <div className="jutge-panel-heading flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-jutge-orange">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Connection blocked?</span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-jutge-muted hover:text-jutge-text"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="jutge-panel-body space-y-3 text-sm text-jutge-text">
          <p>{message}</p>
          <ul className="list-inside list-disc text-jutge-muted">
            <li>Confirm your email and password are correct.</li>
            <li>
              If login works on jutge.org but not here, your browser may be blocking cross-origin
              requests to <code className="text-jutge-blue">api.jutge.org</code>.
            </li>
            <li>Try disabling strict privacy extensions for this site.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
