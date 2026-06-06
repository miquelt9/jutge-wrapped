import { useEffect, useRef, useState, type MutableRefObject } from "react"
import { useTranslation } from "react-i18next"
import { Share2, Loader2 } from "lucide-react"
import { useCaptureExportLayout } from "@/context/SlideExportModeContext"
import { useWebImageShare } from "@/hooks/useWebImageShare"
import {
  captureSlideImage,
  getSlideShareText,
  exportFilename,
  isCaptureAbortError,
  type ShareCacheKey,
  type SlideId,
  type SlideShareTextOptions,
} from "@/features/wrapped/shareExport"
import type { WrappedInsights } from "@/features/wrapped/types"

type Props = {
  slideId: SlideId
  cacheKey: ShareCacheKey
  insights: WrappedInsights
  captureRef: React.RefObject<HTMLElement | null>
  imageCacheRef: MutableRefObject<Map<ShareCacheKey, string>>
  username: string
  shareTextOptions?: SlideShareTextOptions
  awardsPage?: number
  className?: string
  variant?: "default" | "onDark"
  compact?: boolean
}

export function SlideShareButton({
  slideId,
  cacheKey,
  insights,
  captureRef,
  imageCacheRef,
  username,
  shareTextOptions,
  awardsPage,
  className = "",
  variant = "default",
  compact = false,
}: Props) {
  const { t } = useTranslation()
  const { shareImage, isSharing, canShare } = useWebImageShare()
  const withExportLayout = useCaptureExportLayout()
  const captureAbortRef = useRef<AbortController | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [imageReady, setImageReady] = useState(() =>
    imageCacheRef.current.has(cacheKey),
  )

  useEffect(() => {
    if (imageCacheRef.current.has(cacheKey)) {
      setImageReady(true)
      return
    }
    setImageReady(false)
    const id = window.setInterval(() => {
      if (imageCacheRef.current.has(cacheKey)) {
        setImageReady(true)
        window.clearInterval(id)
      }
    }, 250)
    return () => {
      window.clearInterval(id)
      captureAbortRef.current?.abort()
      captureAbortRef.current = null
      setIsBusy(false)
    }
  }, [cacheKey, imageCacheRef])

  function triggerDownload(imageUrl: string) {
    const link = document.createElement("a")
    link.download = exportFilename(username, slideId, awardsPage)
    link.href = imageUrl
    link.click()
  }

  async function captureForDownload() {
    const cached = imageCacheRef.current.get(cacheKey)
    if (cached) return cached
    const node = captureRef.current
    if (!node) return null

    captureAbortRef.current?.abort()
    const controller = new AbortController()
    captureAbortRef.current = controller

    try {
      const dataUrl = await withExportLayout(() =>
        captureSlideImage(node, { signal: controller.signal }),
      )
      if (controller.signal.aborted) return null
      imageCacheRef.current.set(cacheKey, dataUrl)
      setImageReady(true)
      return dataUrl
    } catch (err) {
      if (isCaptureAbortError(err)) return null
      throw err
    } finally {
      if (captureAbortRef.current === controller) {
        captureAbortRef.current = null
      }
    }
  }

  async function shareCapturedImage() {
    setIsBusy(true)
    try {
      const imageUrl = await captureForDownload()
      if (!imageUrl) return

      const title = t("common.brand") + " Wrapped"
      const text = getSlideShareText(slideId, insights, t, shareTextOptions)
      await shareImage(imageUrl, title, text, {
        clickTimestamp: Date.now(),
        fileName: exportFilename(username, slideId, awardsPage),
      })
    } finally {
      setIsBusy(false)
    }
  }

  function handleClick() {
    if (isBusy || isSharing) return

    if (canShare) {
      void shareCapturedImage()
      return
    }

    setIsBusy(true)
    void captureForDownload()
      .then((imageUrl) => {
        if (imageUrl) triggerDownload(imageUrl)
      })
      .catch((err) => {
        if (!isCaptureAbortError(err)) {
          console.error("Share/export failed:", err)
        }
      })
      .finally(() => setIsBusy(false))
  }

  const btnClass =
    variant === "onDark"
      ? "jutge-btn-default border-white/30 bg-transparent text-white hover:bg-white/10"
      : "jutge-btn-default"

  const preparing = canShare && !imageReady
  const disabled = isBusy || isSharing
  const showSpinner = disabled || preparing
  const icon = showSpinner ? (
    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
  ) : (
    <Share2 className="h-4 w-4 shrink-0" />
  )
  const label = showSpinner ? t("share.preparing") : t("share.shareSlide")

  return (
    <button
      type="button"
      disabled={disabled}
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
        className={compact ? "inline" : undefined}
      >
        {label}
      </span>
    </button>
  )
}
