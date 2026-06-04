import { useEffect, useState, type MutableRefObject } from "react"
import { useTranslation } from "react-i18next"
import { Share2, Download, Loader2 } from "lucide-react"
import { useWebImageShare } from "@/hooks/useWebImageShare"
import {
  captureSlideImage,
  getSlideShareText,
  exportFilename,
  type SlideId,
} from "@/features/wrapped/shareExport"
import type { WrappedInsights } from "@/features/wrapped/types"

type Props = {
  slideId: SlideId
  insights: WrappedInsights
  captureRef: React.RefObject<HTMLElement | null>
  imageCacheRef: MutableRefObject<Map<SlideId, string>>
  username: string
  className?: string
  variant?: "default" | "onDark"
  compact?: boolean
}

export function SlideShareButton({
  slideId,
  insights,
  captureRef,
  imageCacheRef,
  username,
  className = "",
  variant = "default",
  compact = false,
}: Props) {
  const { t } = useTranslation()
  const { shareImage, isSharing, canShare, isSecureContext } =
    useWebImageShare()
  const [isBusy, setIsBusy] = useState(false)
  const [imageReady, setImageReady] = useState(() =>
    imageCacheRef.current.has(slideId),
  )

  useEffect(() => {
    if (imageCacheRef.current.has(slideId)) {
      setImageReady(true)
      return
    }
    setImageReady(false)
    const id = window.setInterval(() => {
      if (imageCacheRef.current.has(slideId)) {
        setImageReady(true)
        window.clearInterval(id)
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [slideId, imageCacheRef])

  function triggerDownload(imageUrl: string) {
    const link = document.createElement("a")
    link.download = exportFilename(username, slideId)
    link.href = imageUrl
    link.click()
  }

  async function captureForDownload() {
    const cached = imageCacheRef.current.get(slideId)
    if (cached) return cached
    const node = captureRef.current
    if (!node) return null
    const dataUrl = await captureSlideImage(node)
    imageCacheRef.current.set(slideId, dataUrl)
    setImageReady(true)
    return dataUrl
  }

  function handleClick() {
    if (isBusy || isSharing) return

    if (!isSecureContext) {
      window.alert(t("share.httpsRequired"))
      return
    }

    if (canShare) {
      const imageUrl = imageCacheRef.current.get(slideId)
      if (!imageUrl) return

      setIsBusy(true)
      const title = t("common.brand") + " Wrapped"
      const text = getSlideShareText(slideId, insights, t)
      void shareImage(imageUrl, title, text, {
        clickTimestamp: Date.now(),
        fileName: exportFilename(username, slideId),
      }).finally(() => setIsBusy(false))
      return
    }

    setIsBusy(true)
    void captureForDownload()
      .then((imageUrl) => {
        if (imageUrl) triggerDownload(imageUrl)
      })
      .catch((err) => console.error("Share/export failed:", err))
      .finally(() => setIsBusy(false))
  }

  const btnClass =
    variant === "onDark"
      ? "jutge-btn-default border-white/30 bg-transparent text-white hover:bg-white/10"
      : "jutge-btn-default"

  const showShareIcon = !isSecureContext || canShare
  const preparing = canShare && !imageReady
  const busy = isBusy || isSharing || preparing
  const icon = busy ? (
    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
  ) : showShareIcon ? (
    <Share2 className="h-4 w-4 shrink-0" />
  ) : (
    <Download className="h-4 w-4 shrink-0" />
  )
  const label = busy
    ? t("share.preparing")
    : showShareIcon
      ? t("share.shareSlide")
      : t("share.downloadSlide")

  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation()
        handleClick()
      }}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={`${btnClass} ${className} flex shrink-0 items-center gap-1 disabled:opacity-40`}
    >
      {icon}
      <span
        className={compact ? "sr-only sm:not-sr-only sm:inline" : undefined}
      >
        {label}
      </span>
    </button>
  )
}
