import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { downloadSnapshotJson } from "@/features/wrapped/snapshot"
import type { WrappedRawData } from "@/features/wrapped/types"

type Props = {
  raw: WrappedRawData
  className?: string
  variant?: "default" | "onDark"
}

export function SnapshotDownloadButton({
  raw,
  className = "",
  variant = "default",
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

  return (
    <button
      type="button"
      disabled={downloading}
      onClick={(e) => {
        e.stopPropagation()
        void handleDownload()
      }}
      className={`${btnClass} ${className} flex items-center gap-1 disabled:opacity-40`}
    >
      <Download className="h-4 w-4" />
      {downloading ? t("snapshot.downloading") : t("snapshot.downloadButton")}
    </button>
  )
}
