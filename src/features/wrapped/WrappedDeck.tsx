import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDeckLoadingUX } from "./useDeckLoadingUX"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { SnapshotDownloadButton } from "@/components/SnapshotDownloadButton"
import { SlideShareButton } from "@/components/SlideShareButton"
import { useAuth } from "@/context/AuthContext"
import { SlideExportModeProvider } from "@/context/SlideExportModeContext"
import { useSnapshot } from "@/context/SnapshotContext"
import { useWrappedPeriod } from "@/context/WrappedContext"
import { ProgressDots } from "@/components/ProgressDots"
import { NavControls } from "@/components/NavControls"
import { TerminalLoadingLine } from "@/components/TerminalLoadingLine"
import { CorsOverlay } from "@/components/CorsOverlay"
import { useWrappedData } from "./useWrappedData"
import {
  canUseNativeImageShare,
  captureSlideImage,
  getActiveSlideIds,
  SLIDE_IDS,
  type SlideId,
} from "./shareExport"
import { slidePanelTransition } from "@/components/motionPresets"
import { IntroSlide } from "./slides/IntroSlide"
import { HeatmapSlide } from "./slides/HeatmapSlide"
import { RhythmSlide } from "./slides/RhythmSlide"
import { CourseArcSlide } from "./slides/CourseArcSlide"
import { VerdictSlide } from "./slides/VerdictSlide"
import { AwardsSlide } from "./slides/AwardsSlide"
import { RankingSlide } from "./slides/RankingSlide"
import { prefersCoarsePointer } from "./deckPullNavigation"
import { useDeckPullNavigation } from "./useDeckPullNavigation"

const MOBILE_PRECOMPUTE_DELAY_MS = 1200
const DESKTOP_PRECOMPUTE_DELAY_MS = 150

export function WrappedDeck() {
  const { t } = useTranslation()
  const { client, logout } = useAuth()
  const { period, clearPeriod } = useWrappedPeriod()
  const { snapshot, isSnapshotMode, clearSnapshot } = useSnapshot()
  const { state } = useWrappedData(client, period, snapshot)
  const [index, setIndex] = useState(0)
  const slideDirectionRef = useRef<1 | -1>(1)
  const reduceMotion = useReducedMotion()
  const slideCaptureRef = useRef<HTMLDivElement>(null)
  const precomputeCaptureRef = useRef<HTMLDivElement>(null)
  const shareImageCacheRef = useRef<Map<SlideId, string>>(new Map())
  const shouldPrecomputeShareImages = useRef(canUseNativeImageShare())
  const [precomputeIndex, setPrecomputeIndex] = useState<number | null>(null)
  const [isPrecomputing, setIsPrecomputing] = useState(false)
  const loadingLine = t("deck.loadingLine")
  const { showLoadingScreen } = useDeckLoadingUX(
    state.status,
    loadingLine.length,
  )

  const activeSlideIds = useMemo(
    () =>
      state.status === "ready"
        ? getActiveSlideIds(state.insights)
        : SLIDE_IDS.filter((id) => id !== "awards"),
    [state],
  )
  const slideCount = activeSlideIds.length

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(slideCount - 1, 0)))
  }, [slideCount])

  const next = useCallback(() => {
    slideDirectionRef.current = 1
    setIndex((i) => Math.min(i + 1, slideCount - 1))
  }, [slideCount])
  const prev = useCallback(() => {
    slideDirectionRef.current = -1
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    pullDistance,
    isPulling,
    isTouchActiveRef,
  } = useDeckPullNavigation({
    index,
    slideCount,
    onAdvance: next,
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault()
        next()
      } else if (e.code === "ArrowLeft") {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev])

  const renderSlide = useCallback(
    (targetIndex: number) => {
      if (state.status !== "ready") return null

      const slideId = activeSlideIds[targetIndex]
      if (!slideId) return null

      const { raw, insights } = state
      switch (slideId) {
        case "intro":
          return <IntroSlide key="intro" raw={raw} insights={insights} />
        case "heatmap":
          return <HeatmapSlide key="heatmap" insights={insights} />
        case "rhythm":
          return <RhythmSlide key="rhythm" insights={insights} />
        case "course":
          return <CourseArcSlide key="course" insights={insights} />
        case "verdict":
          return <VerdictSlide key="verdict" insights={insights} />
        case "awards":
          return <AwardsSlide key="awards" insights={insights} />
        case "ranking":
          return <RankingSlide key="rank" insights={insights} />
        default:
          return null
      }
    },
    [activeSlideIds, state],
  )

  useEffect(() => {
    const currentSlideId = activeSlideIds[index]
    if (!currentSlideId) return
    const currentImage = shareImageCacheRef.current.get(currentSlideId)
    shareImageCacheRef.current.clear()
    if (currentImage) {
      shareImageCacheRef.current.set(currentSlideId, currentImage)
    }
    setPrecomputeIndex(null)
  }, [activeSlideIds, index])

  useEffect(() => {
    if (
      !shouldPrecomputeShareImages.current ||
      state.status !== "ready" ||
      isPrecomputing ||
      precomputeIndex !== null
    ) {
      return
    }

    const currentSlideId = activeSlideIds[index]
    if (!currentSlideId) return
    if (shareImageCacheRef.current.has(currentSlideId)) return

    const delay = prefersCoarsePointer()
      ? MOBILE_PRECOMPUTE_DELAY_MS
      : DESKTOP_PRECOMPUTE_DELAY_MS

    const scheduleTimer = window.setTimeout(() => {
      if (isTouchActiveRef.current) return
      if (shareImageCacheRef.current.has(currentSlideId)) return
      setPrecomputeIndex(index)
    }, delay)

    return () => window.clearTimeout(scheduleTimer)
  }, [
    activeSlideIds,
    index,
    isPrecomputing,
    isTouchActiveRef,
    precomputeIndex,
    state.status,
  ])

  useEffect(() => {
    if (state.status !== "ready" || precomputeIndex === null) return

    let cancelled = false
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number
      cancelIdleCallback?: (handle: number) => void
    }

    const runCapture = async () => {
      if (isTouchActiveRef.current) {
        if (!cancelled) setPrecomputeIndex(null)
        return
      }

      const node = precomputeCaptureRef.current
      const slideId = activeSlideIds[precomputeIndex]
      if (!node || !slideId) {
        if (!cancelled) setPrecomputeIndex(null)
        return
      }

      setIsPrecomputing(true)
      try {
        const dataUrl = await captureSlideImage(node)
        if (!cancelled) {
          shareImageCacheRef.current.set(slideId, dataUrl)
        }
      } catch (err) {
        console.error(`Failed to precompute share image for ${slideId}:`, err)
      } finally {
        if (!cancelled) {
          setIsPrecomputing(false)
          setPrecomputeIndex(null)
        }
      }
    }

    let idleId: number | null = null
    let timeoutId: number | null = null

    if (showLoadingScreen && idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(() => void runCapture(), {
        timeout: 100,
      })
    } else {
      const delay = prefersCoarsePointer()
        ? MOBILE_PRECOMPUTE_DELAY_MS
        : showLoadingScreen
          ? 0
          : DESKTOP_PRECOMPUTE_DELAY_MS
      timeoutId = window.setTimeout(() => void runCapture(), delay)
    }

    return () => {
      cancelled = true
      if (idleId !== null && idleWindow.cancelIdleCallback)
        idleWindow.cancelIdleCallback(idleId)
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [
    activeSlideIds,
    isTouchActiveRef,
    precomputeIndex,
    showLoadingScreen,
    state.status,
  ])

  if (state.status === "error") {
    return (
      <div className="jutge-page flex h-full flex-col">
        {state.kind === "network" && (
          <CorsOverlay kind={state.kind} message={state.message} />
        )}
        <header className="jutge-nav">
          <div className="jutge-nav-inner">
            <span className="truncate font-bold text-white">
              {t("common.brand")}
            </span>
            <div className="jutge-nav-end">
              <NavControls onDark compact />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="jutge-alert-danger inline-block">{state.message}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {!isSnapshotMode && (
              <>
                <button
                  type="button"
                  onClick={clearPeriod}
                  className="jutge-btn-default"
                >
                  {t("deck.changeDates")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearPeriod()
                    logout()
                  }}
                  className="jutge-btn-primary"
                >
                  {t("deck.backToLogin")}
                </button>
              </>
            )}
            {isSnapshotMode && (
              <button
                type="button"
                onClick={clearSnapshot}
                className="jutge-btn-primary"
              >
                {t("deck.exit")}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (showLoadingScreen) {
    return (
      <div className="jutge-page flex h-full flex-col">
        <header className="jutge-nav">
          <div className="jutge-nav-inner">
            <div className="jutge-nav-start min-w-0">
              <span className="truncate font-bold text-white">
                {t("common.brand")}
              </span>
              <span className="hidden text-sm text-white/70 sm:inline">
                {t("common.wrapped")}
              </span>
            </div>
            <div className="jutge-nav-end">
              <NavControls onDark compact />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <TerminalLoadingLine />
        </div>
        {state.status === "ready" && precomputeIndex !== null && (
          <SlideExportModeProvider deckExportMode>
            <div
              aria-hidden
              className="bg-jutge-bg pointer-events-none fixed top-0 -left-[200vw] w-screen"
            >
              <div
                ref={precomputeCaptureRef}
                className="bg-jutge-bg min-h-screen"
              >
                {renderSlide(precomputeIndex)}
              </div>
            </div>
          </SlideExportModeProvider>
        )}
      </div>
    )
  }

  if (state.status !== "ready") return null

  const { raw, insights } = state
  const exportRaw = raw
  const username =
    raw.profile.username ?? raw.profile.email.split("@")[0] ?? "user"
  const slideId = activeSlideIds[index]!

  return (
    <SlideExportModeProvider>
      <div className="jutge-page relative flex h-full flex-col">
        <header className="jutge-nav">
          <div className="jutge-nav-inner">
            <div className="jutge-nav-start">
              <span className="truncate font-bold text-white">
                {t("common.brand")}
              </span>
              <span className="hidden text-sm text-white/70 sm:inline">
                {t("common.wrapped")}
              </span>
              {isSnapshotMode && (
                <span className="hidden rounded border border-white/30 px-2 py-0.5 text-xs text-white/90 sm:inline">
                  {t("common.snapshot")}
                </span>
              )}
              <div className="hidden sm:block">
                <ProgressDots total={slideCount} current={index} onDark />
              </div>
            </div>
            <div className="jutge-nav-end">
              <NavControls onDark compact />
              <SlideShareButton
                slideId={slideId}
                insights={insights}
                captureRef={slideCaptureRef}
                imageCacheRef={shareImageCacheRef}
                username={username}
                className="sm:hidden"
                variant="onDark"
                compact
              />
              <SnapshotDownloadButton
                raw={exportRaw}
                variant="onDark"
                compact
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  clearPeriod()
                }}
                aria-label={t("deck.dates")}
                title={t("deck.dates")}
                className="jutge-btn-default flex shrink-0 items-center gap-1 border-white/30 bg-transparent px-2 text-white hover:bg-white/10 sm:px-3"
              >
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="sr-only sm:not-sr-only sm:inline">
                  {t("deck.dates")}
                </span>
              </button>
              {isSnapshotMode ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearSnapshot()
                  }}
                  aria-label={t("deck.exit")}
                  title={t("deck.exit")}
                  className="jutge-btn-default flex shrink-0 items-center gap-1 border-white/30 bg-transparent px-2 text-white hover:bg-white/10 sm:px-3"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="sr-only sm:not-sr-only sm:inline">
                    {t("deck.exit")}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearPeriod()
                    logout()
                  }}
                  aria-label={t("deck.exit")}
                  title={t("deck.exit")}
                  className="jutge-btn-default flex shrink-0 items-center gap-1 border-white/30 bg-transparent px-2 text-white hover:bg-white/10 sm:px-3"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="sr-only sm:not-sr-only sm:inline">
                    {t("deck.exit")}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="bg-jutge-bg relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              {...slidePanelTransition(reduceMotion, slideDirectionRef.current)}
              className="jutge-deck-scroller absolute inset-0 overflow-x-hidden overflow-y-auto"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
            >
              <div
                ref={slideCaptureRef}
                data-slide-export={slideId}
                className="bg-jutge-bg flex min-h-full flex-col"
              >
                {renderSlide(index)}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Pull-up indicator */}
          <AnimatePresence>
            {isPulling && pullDistance > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none absolute right-0 bottom-0 left-0 z-50 flex flex-col items-center justify-end pb-6"
                style={{
                  height: `${pullDistance}px`,
                  background:
                    "linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.8) 50%, rgba(15, 23, 42, 0) 100%)",
                }}
              >
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                  {/* Arrow that grows and animates */}
                  <motion.div
                    animate={{
                      y: pullDistance >= 80 ? [0, -6, 0] : 0,
                      scale:
                        pullDistance >= 80
                          ? 1.2
                          : Math.min(0.8 + (pullDistance / 80) * 0.4, 1.2),
                    }}
                    transition={{
                      y: {
                        repeat: Infinity,
                        duration: 0.6,
                        ease: "easeInOut",
                      },
                      scale: { duration: 0.1 },
                    }}
                    className={`rounded-full p-2 ${
                      pullDistance >= 80
                        ? "bg-jutge-blue text-white"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </motion.div>

                  {/* Text feedback */}
                  <motion.span
                    className={`text-xs font-semibold tracking-wide uppercase transition-colors duration-200 ${
                      pullDistance >= 80
                        ? "text-jutge-blue font-bold"
                        : "text-white/60"
                    }`}
                  >
                    {pullDistance >= 80
                      ? t("deck.releaseToNext")
                      : t("deck.pullToNext")}
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {precomputeIndex !== null && (
          <SlideExportModeProvider deckExportMode>
            <div
              aria-hidden
              className="bg-jutge-bg pointer-events-none fixed top-0 -left-[200vw] w-screen"
            >
              <div
                ref={precomputeCaptureRef}
                className="bg-jutge-bg min-h-screen"
              >
                {renderSlide(precomputeIndex)}
              </div>
            </div>
          </SlideExportModeProvider>
        )}

        <footer className="border-jutge-border bg-jutge-panel text-jutge-muted flex min-w-0 items-center justify-between gap-2 border-t px-3 py-3 text-sm sm:px-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            disabled={index === 0}
            aria-label={t("common.prev")}
            className="jutge-btn-default flex shrink-0 items-center gap-1 px-2 disabled:opacity-40 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="sr-only sm:not-sr-only sm:inline">
              {t("common.prev")}
            </span>
          </button>
          <span className="sm:hidden">
            <ProgressDots total={slideCount} current={index} />
          </span>
          <span className="hidden sm:inline">
            {index + 1} / {slideCount}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            disabled={index === slideCount - 1}
            aria-label={t("common.next")}
            className="jutge-btn-default flex shrink-0 items-center gap-1 px-2 disabled:opacity-40 sm:px-3"
          >
            <span className="sr-only sm:not-sr-only sm:inline">
              {t("common.next")}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        </footer>
      </div>
    </SlideExportModeProvider>
  )
}
