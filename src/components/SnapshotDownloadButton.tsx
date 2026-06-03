import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { downloadSnapshotJson } from "@/features/wrapped/snapshot"
import type { WrappedRawData } from "@/features/wrapped/types"

type Props = {
  raw: WrappedRawData
  className?: string
  variant?: "default" | "onDark"
  /** Icon-only on small screens (label visible from `sm` up). */
  compact?: boolean
}

export function SnapshotDownloadButton({
  raw,
  className = "",
  variant = "default",
  compact = false,
}: Props) {
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadSnapshotJson(raw)
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  const btnClass =
    variant === "onDark"
      ? "jutge-btn-default border-white/30 bg-transparent text-white hover:bg-white/10"
      : "jutge-btn-default"

  const label = downloading ? t("snapshot.downloading") : t("snapshot.downloadButton")

  return (
    <button
      type="button"
      disabled={downloading}
      onClick={(e) => {
        e.stopPropagation()
        void handleDownload()
      }}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={`${btnClass} ${className} flex shrink-0 items-center gap-1 disabled:opacity-40`}
    >
      <Download className="h-4 w-4 shrink-0" />
      <span className={compact ? "sr-only sm:not-sr-only sm:inline" : undefined}>{label}</span>
    </button>
  )
}
