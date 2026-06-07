import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDeckLoadingUX } from "./useDeckLoadingUX"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { Calendar, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { SnapshotDownloadButton } from "@/components/SnapshotDownloadButton"
import { SlideShareButton } from "@/components/SlideShareButton"
import { DeckNavOverflowMenu } from "@/components/DeckNavOverflowMenu"
import { useAuth } from "@/context/AuthContext"
import { SlideExportModeProvider } from "@/context/SlideExportModeContext"
import { useSnapshot } from "@/context/SnapshotContext"
import { useTheme } from "@/context/ThemeContext"
import { useWrappedPeriod } from "@/context/WrappedContext"
import { ProgressDots } from "@/components/ProgressDots"
import { NavControls } from "@/components/NavControls"
import { TerminalLoadingLine } from "@/components/TerminalLoadingLine"
import { CorsOverlay } from "@/components/CorsOverlay"
import { useWrappedData } from "./useWrappedData"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import {
  canShareFiles,
  captureSlideImage,
  getActiveSlideIds,
  getAwardsPerPage,
  getShareCacheKey,
  isCaptureAbortError,
  SLIDE_IDS,
  type ShareCacheKey,
} from "./shareExport"
import { slidePanelTransition } from "@/components/motionPresets"
import { IntroSlide } from "./slides/IntroSlide"
import { HeatmapStatsSlide } from "./slides/HeatmapStatsSlide"
import { HeatmapCalendarSlide } from "./slides/HeatmapCalendarSlide"
import { RhythmSlide } from "./slides/RhythmSlide"
import { CourseArcSlide } from "./slides/CourseArcSlide"
import { VerdictSlide } from "./slides/VerdictSlide"
import { AwardsSlide } from "./slides/AwardsSlide"
import { PerformanceSlide } from "./slides/PerformanceSlide"
import { RankingSlide } from "./slides/RankingSlide"
import { ShareRecapSlide } from "./slides/ShareRecapSlide"
import {
  getTouchMotionQuality,
  isTouchNavigationTarget,
  prefersCoarsePointer,
} from "./deckSwipeNavigation"
import { DeckSlidePanel } from "./slides/DeckSlidePanel"
import { useDeckSwipeNavigation } from "./useDeckSwipeNavigation"

const MOBILE_PRECOMPUTE_DELAY_MS = 1200
const DESKTOP_PRECOMPUTE_DELAY_MS = 150
const ENABLE_TOUCH_WARMUP = true
const MAX_WARMUP_QUEUE = 4
const TOUCH_WARMUP_SLIDES = [
  "intro",
  "heatmap_stats",
  "heatmap_calendar",
  "rhythm",
] as const

export function WrappedDeck() {
  const { t } = useTranslation()
  const { client, logout } = useAuth()
  const { theme } = useTheme()
  const { period, clearPeriod } = useWrappedPeriod()
  const { snapshot, isSnapshotMode, clearSnapshot } = useSnapshot()
  const { state } = useWrappedData(client, period, snapshot)
  const [index, setIndex] = useState(0)
  const [awardsPageIndex, setAwardsPageIndex] = useState(0)
  const slideDirectionRef = useRef<1 | -1>(1)
  const reduceMotion = useReducedMotion()
  const layoutVariant = useLayoutVariant()
  const slideCaptureRef = useRef<HTMLDivElement>(null)
  const precomputeCaptureRef = useRef<HTMLDivElement>(null)
  const shareImageCacheRef = useRef<Map<ShareCacheKey, string>>(new Map())
  const shouldPrecomputeShareImages = useRef(canShareFiles())
  const precomputeAbortRef = useRef<AbortController | null>(null)
  const warmedSlideKeysRef = useRef<Set<string>>(new Set())
  const [precomputeIndex, setPrecomputeIndex] = useState<number | null>(null)
  const [isPrecomputing, setIsPrecomputing] = useState(false)
  const [warmupQueue, setWarmupQueue] = useState<number[]>([])
  const [warmupIndex, setWarmupIndex] = useState<number | null>(null)
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

  const touchNavigation = isTouchNavigationTarget()
  const motionQuality = useMemo(() => getTouchMotionQuality(), [])
  const isReducedQuality = motionQuality === "reduced"
  const {
    setTrackRef,
    swipeUI,
    isTouchActiveRef,
    isInteractionActive,
    lastCommittedDirection,
    swipeTransition,
  } =
    useDeckSwipeNavigation({
      index,
      slideCount,
      onNext: next,
      onPrev: prev,
      motionQuality,
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
    (targetIndex: number, awardsPage: number) => {
      if (state.status !== "ready") return null

      const slideId = activeSlideIds[targetIndex]
      if (!slideId) return null

      const { raw, insights } = state
      switch (slideId) {
        case "intro":
          return <IntroSlide key="intro" raw={raw} insights={insights} />
        case "heatmap_stats":
          return <HeatmapStatsSlide key="heatmap_stats" insights={insights} />
        case "heatmap_calendar":
          return (
            <HeatmapCalendarSlide key="heatmap_calendar" insights={insights} />
          )
        case "rhythm":
          return <RhythmSlide key="rhythm" insights={insights} />
        case "course":
          return <CourseArcSlide key="course" insights={insights} />
        case "verdict":
          return <VerdictSlide key="verdict" insights={insights} />
        case "awards":
          return (
            <AwardsSlide
              key={`awards-${awardsPage}`}
              insights={insights}
              pageIndex={awardsPage}
              onPageIndexChange={setAwardsPageIndex}
            />
          )
        case "ranking":
          return <RankingSlide key="rank" insights={insights} />
        case "performance":
          return <PerformanceSlide key="performance" insights={insights} />
        case "recap":
          return <ShareRecapSlide key="recap" raw={raw} insights={insights} />
        default:
          return null
      }
    },
    [activeSlideIds, state],
  )

  useEffect(() => {
    const currentSlideId = activeSlideIds[index]
    if (currentSlideId !== "awards") {
      setAwardsPageIndex(0)
    }
  }, [activeSlideIds, index])

  const getTouchPanelKey = useCallback(
    (targetIndex: number) => {
      const targetSlideId = activeSlideIds[targetIndex]
      if (!targetSlideId) return null
      if (targetSlideId === "awards") return `awards-${awardsPageIndex}`
      return targetSlideId
    },
    [activeSlideIds, awardsPageIndex],
  )
  const touchPanels = useMemo(() => {
    if (!touchNavigation) return []
    const candidateIndexes = [index - 1, index, index + 1].filter(
      (targetIndex) => targetIndex >= 0 && targetIndex < slideCount,
    )
    return candidateIndexes
      .map((targetIndex) => {
        const key = getTouchPanelKey(targetIndex)
        if (!key) return null
        const offset = (targetIndex - index) as -1 | 0 | 1
        return {
          key,
          offset,
          isCurrent: targetIndex === index,
          slideId: activeSlideIds[targetIndex]!,
          content: renderSlide(targetIndex, awardsPageIndex),
        }
      })
      .filter((panel): panel is NonNullable<typeof panel> => panel !== null)
  }, [
    activeSlideIds,
    awardsPageIndex,
    getTouchPanelKey,
    index,
    renderSlide,
    slideCount,
    touchNavigation,
  ])

  useEffect(() => {
    if (
      !ENABLE_TOUCH_WARMUP ||
      !touchNavigation ||
      !showLoadingScreen ||
      isInteractionActive ||
      state.status !== "ready"
    ) {
      return
    }

    const firstSlides = [0, 1, 2].filter((targetIndex) => targetIndex < slideCount)
    const heavyCandidates = isReducedQuality
      ? TOUCH_WARMUP_SLIDES.slice(0, 3)
      : TOUCH_WARMUP_SLIDES
    const heavySlides = heavyCandidates.map((name) =>
      activeSlideIds.indexOf(name),
    ).filter((targetIndex) => targetIndex >= 0)
    const directionCandidates =
      lastCommittedDirection === "prev"
        ? [index - 1, index - 2]
        : [index + 1, index + 2]
    const directionalSlides = directionCandidates.filter(
      (targetIndex) => targetIndex >= 0 && targetIndex < slideCount,
    )
    const nextQueue = Array.from(
      new Set([...directionalSlides, ...firstSlides, ...heavySlides]),
    )
      .filter((targetIndex) => {
        const key = getTouchPanelKey(targetIndex)
        if (!key) return false
        return !warmedSlideKeysRef.current.has(key)
      })
      .slice(0, MAX_WARMUP_QUEUE)
    setWarmupQueue(nextQueue)
  }, [
    activeSlideIds,
    getTouchPanelKey,
    index,
    isInteractionActive,
    isReducedQuality,
    lastCommittedDirection,
    showLoadingScreen,
    slideCount,
    state.status,
    touchNavigation,
  ])

  useEffect(() => {
    if (
      !ENABLE_TOUCH_WARMUP ||
      !touchNavigation ||
      !showLoadingScreen ||
      isInteractionActive ||
      state.status !== "ready" ||
      warmupIndex !== null ||
      warmupQueue.length === 0
    ) {
      return
    }
    setWarmupIndex(warmupQueue[0]!)
  }, [
    showLoadingScreen,
    isInteractionActive,
    state.status,
    touchNavigation,
    warmupIndex,
    warmupQueue,
  ])

  useEffect(() => {
    if (
      !ENABLE_TOUCH_WARMUP ||
      !touchNavigation ||
      !showLoadingScreen ||
      isInteractionActive ||
      state.status !== "ready" ||
      warmupIndex === null
    ) {
      return
    }

    let cancelled = false
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number
      cancelIdleCallback?: (handle: number) => void
    }

    const finalizeWarmup = () => {
      if (cancelled) return
      const key = getTouchPanelKey(warmupIndex)
      if (key) warmedSlideKeysRef.current.add(key)
      setWarmupQueue((queue) => queue.filter((entry) => entry !== warmupIndex))
      setWarmupIndex(null)
    }

    let idleId: number | null = null
    let timeoutId: number | null = null
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(finalizeWarmup, { timeout: 120 })
    } else {
      timeoutId = window.setTimeout(finalizeWarmup, 32)
    }

    return () => {
      cancelled = true
      if (idleId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId)
      }
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [
    getTouchPanelKey,
    showLoadingScreen,
    isInteractionActive,
    state.status,
    touchNavigation,
    warmupIndex,
  ])

  useEffect(() => {
    precomputeAbortRef.current?.abort()
    precomputeAbortRef.current = null
    shareImageCacheRef.current.clear()
    setPrecomputeIndex(null)
    setIsPrecomputing(false)
  }, [theme])

  useEffect(() => {
    const currentSlideId = activeSlideIds[index]
    if (!currentSlideId) return
    precomputeAbortRef.current?.abort()
    precomputeAbortRef.current = null
    const cacheKey = getShareCacheKey(
      currentSlideId,
      theme,
      currentSlideId === "awards" ? awardsPageIndex : undefined,
    )
    const currentImage = shareImageCacheRef.current.get(cacheKey)
    shareImageCacheRef.current.clear()
    if (currentImage) {
      shareImageCacheRef.current.set(cacheKey, currentImage)
    }
    setPrecomputeIndex(null)
    setIsPrecomputing(false)
  }, [activeSlideIds, awardsPageIndex, index, theme])

  useEffect(() => {
    if (
      !shouldPrecomputeShareImages.current ||
      state.status !== "ready" ||
      isInteractionActive ||
      isPrecomputing ||
      precomputeIndex !== null
    ) {
      return
    }

    const currentSlideId = activeSlideIds[index]
    if (!currentSlideId) return
    const cacheKey = getShareCacheKey(
      currentSlideId,
      theme,
      currentSlideId === "awards" ? awardsPageIndex : undefined,
    )
    if (shareImageCacheRef.current.has(cacheKey)) return

    const delay = prefersCoarsePointer()
      ? MOBILE_PRECOMPUTE_DELAY_MS
      : DESKTOP_PRECOMPUTE_DELAY_MS

    const scheduleTimer = window.setTimeout(() => {
      if (isTouchActiveRef.current || isInteractionActive) return
      if (shareImageCacheRef.current.has(cacheKey)) return
      setPrecomputeIndex(index)
    }, delay)

    return () => window.clearTimeout(scheduleTimer)
  }, [
    activeSlideIds,
    awardsPageIndex,
    index,
    isInteractionActive,
    isPrecomputing,
    isTouchActiveRef,
    precomputeIndex,
    state.status,
    theme,
  ])

  useEffect(() => {
    if (state.status !== "ready" || precomputeIndex === null) return

    let cancelled = false
    const captureIndex = precomputeIndex
    const captureAwardsPage = awardsPageIndex
    const abortController = new AbortController()
    precomputeAbortRef.current?.abort()
    precomputeAbortRef.current = abortController
    const { signal } = abortController
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number
      cancelIdleCallback?: (handle: number) => void
    }

    const runCapture = async () => {
      if (signal.aborted || cancelled) return

      if (isTouchActiveRef.current || isInteractionActive) {
        if (!signal.aborted && !cancelled) setPrecomputeIndex(null)
        return
      }

      const node = precomputeCaptureRef.current
      const slideId = activeSlideIds[captureIndex]
      if (!node || !slideId) {
        if (!signal.aborted && !cancelled) setPrecomputeIndex(null)
        return
      }

      if (captureIndex !== index) {
        setPrecomputeIndex(null)
        return
      }

      if (slideId === "awards" && captureAwardsPage !== awardsPageIndex) {
        setPrecomputeIndex(null)
        return
      }

      const cacheKey = getShareCacheKey(
        slideId,
        theme,
        slideId === "awards" ? captureAwardsPage : undefined,
      )

      setIsPrecomputing(true)
      try {
        const dataUrl = await captureSlideImage(node, { signal })
        if (!signal.aborted && !cancelled) {
          shareImageCacheRef.current.set(cacheKey, dataUrl)
        }
      } catch (err) {
        if (!isCaptureAbortError(err)) {
          console.error(`Failed to precompute share image for ${slideId}:`, err)
        }
      } finally {
        if (precomputeAbortRef.current === abortController) {
          precomputeAbortRef.current = null
        }
        setIsPrecomputing(false)
        if (!signal.aborted && !cancelled) {
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
      abortController.abort()
      if (idleId !== null && idleWindow.cancelIdleCallback)
        idleWindow.cancelIdleCallback(idleId)
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [
    activeSlideIds,
    awardsPageIndex,
    index,
    isInteractionActive,
    isTouchActiveRef,
    precomputeIndex,
    showLoadingScreen,
    state.status,
    theme,
  ])

  if (state.status === "error") {
    return (
      <div className="jutge-page flex h-full flex-col">
        {state.kind === "network" && (
          <CorsOverlay kind={state.kind} message={state.message} />
        )}
        <header className="jutge-nav">
          <div className="jutge-nav-inner">
            <div className="jutge-nav-start min-w-0">
              <span className="truncate font-bold text-white">
                {t("common.brand")}
              </span>
              <span className="text-sm text-white/70">
                {t("common.wrapped")}
              </span>
            </div>
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
              <span className="text-sm text-white/70">
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
                {renderSlide(precomputeIndex, awardsPageIndex)}
              </div>
            </div>
          </SlideExportModeProvider>
        )}
        {state.status === "ready" && warmupIndex !== null && (
          <div
            aria-hidden
            className="bg-jutge-bg pointer-events-none fixed top-0 -left-[200vw] w-screen"
          >
            <div className="bg-jutge-bg min-h-screen">
              {renderSlide(warmupIndex, awardsPageIndex)}
            </div>
          </div>
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
  const shareCacheKey = getShareCacheKey(
    slideId,
    theme,
    slideId === "awards" ? awardsPageIndex : undefined,
  )
  const awardsPerPage = getAwardsPerPage(layoutVariant === "wide")
  const shareTextOptions =
    slideId === "awards"
      ? { awardsPage: awardsPageIndex, awardsPerPage }
      : undefined
  const panelTransition = slidePanelTransition(
    reduceMotion,
    slideDirectionRef.current,
  )

  return (
    <SlideExportModeProvider>
      <div className="jutge-page relative flex h-full flex-col">
        <header className="jutge-nav">
          <div className="jutge-nav-inner">
            <div className="jutge-nav-start">
              <span className="truncate font-bold text-white">
                {t("common.brand")}
              </span>
              <span className="text-sm text-white/70">
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
              <div className="flex items-center gap-1 sm:hidden">
                <SlideShareButton
                  slideId={slideId}
                  cacheKey={shareCacheKey}
                  insights={insights}
                  captureRef={slideCaptureRef}
                  imageCacheRef={shareImageCacheRef}
                  username={username}
                  shareTextOptions={shareTextOptions}
                  awardsPage={
                    slideId === "awards" ? awardsPageIndex : undefined
                  }
                  variant="onDark"
                  compact
                />
                <DeckNavOverflowMenu
                  raw={exportRaw}
                  onChangeDates={clearPeriod}
                  onExit={
                    isSnapshotMode
                      ? clearSnapshot
                      : () => {
                          clearPeriod()
                          logout()
                        }
                  }
                />
              </div>
              <div className="hidden sm:contents">
                <NavControls onDark compact />
                <SlideShareButton
                  slideId={slideId}
                  cacheKey={shareCacheKey}
                  insights={insights}
                  captureRef={slideCaptureRef}
                  imageCacheRef={shareImageCacheRef}
                  username={username}
                  shareTextOptions={shareTextOptions}
                  awardsPage={
                    slideId === "awards" ? awardsPageIndex : undefined
                  }
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
                  aria-label={t("deck.changeDates")}
                  title={t("deck.changeDates")}
                  className="jutge-btn-default flex shrink-0 items-center gap-1 border-white/30 bg-transparent px-2 text-white hover:bg-white/10 sm:px-3"
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="sr-only sm:not-sr-only sm:inline">
                    {t("deck.changeDates")}
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
          </div>
        </header>

        <main className="bg-jutge-bg relative flex-1 overflow-hidden">
          {touchNavigation ? (
            <div
              ref={setTrackRef}
              className="relative h-full w-full overflow-hidden"
              style={{
                touchAction:
                  swipeUI.gestureLock === "horizontal" ? "none" : undefined,
              }}
            >
              {touchPanels.map((panel) => (
                <DeckSlidePanel
                  key={panel.key}
                  offsetVw={panel.offset}
                  translateX={swipeUI.translateX}
                  isAnimating={swipeUI.isAnimating}
                  swipeTransition={swipeTransition}
                  gestureLock={swipeUI.gestureLock}
                  isCurrent={panel.isCurrent}
                  slideExportId={panel.isCurrent ? panel.slideId : undefined}
                  captureRef={panel.isCurrent ? slideCaptureRef : undefined}
                >
                  {panel.content}
                </DeckSlidePanel>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={panelTransition.initial}
                animate={panelTransition.animate}
                exit={panelTransition.exit}
                transition={panelTransition.transition}
                className="absolute inset-0 overflow-hidden"
              >
                <div className="jutge-deck-scroller h-full overflow-x-hidden overflow-y-auto">
                  <div
                    ref={slideCaptureRef}
                    data-slide-export={slideId}
                    className="bg-jutge-bg flex min-h-full flex-col"
                  >
                    {renderSlide(index, awardsPageIndex)}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
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
                {renderSlide(precomputeIndex, awardsPageIndex)}
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
