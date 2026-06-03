import { useCallback, useEffect, useState } from "react"
import { useDeckLoadingUX } from "./useDeckLoadingUX"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import { Calendar, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { SnapshotDownloadButton } from "@/components/SnapshotDownloadButton"
import { useAuth } from "@/context/AuthContext"
import { useSnapshot } from "@/context/SnapshotContext"
import { useWrappedPeriod } from "@/context/WrappedContext"
import { ProgressDots } from "@/components/ProgressDots"
import { NavControls } from "@/components/NavControls"
import { TerminalLoadingLine } from "@/components/TerminalLoadingLine"
import { CorsOverlay } from "@/components/CorsOverlay"
import { useWrappedData } from "./useWrappedData"
import { IntroSlide } from "./slides/IntroSlide"
import { HeatmapSlide } from "./slides/HeatmapSlide"
import { WeekdaySlide } from "./slides/WeekdaySlide"
import { ChronoSlide } from "./slides/ChronoSlide"
import { CourseArcSlide } from "./slides/CourseArcSlide"
import { VerdictSlide } from "./slides/VerdictSlide"
import { RankingSlide } from "./slides/RankingSlide"

const SLIDE_COUNT = 7

export function WrappedDeck() {
  const { t } = useTranslation()
  const { client, logout } = useAuth()
  const { period, clearPeriod } = useWrappedPeriod()
  const { snapshot, isSnapshotMode, clearSnapshot } = useSnapshot()
  const { state } = useWrappedData(client, period, snapshot)
  const [index, setIndex] = useState(0)
  const loadingLine = t("deck.loadingLine")
  const { showLoadingScreen } = useDeckLoadingUX(state.status, loadingLine.length)

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, SLIDE_COUNT - 1)), [])
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])

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

  let touchStartX = 0
  function onTouchStart(e: React.TouchEvent) {
    touchStartX = e.touches[0]?.clientX ?? 0
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX
    if (dx < -50) next()
    else if (dx > 50) prev()
  }

  if (state.status === "error") {
    return (
      <div className="jutge-page flex h-full flex-col">
        {state.kind === "network" && (
          <CorsOverlay kind={state.kind} message={state.message} />
        )}
        <header className="jutge-nav flex items-center justify-between px-4 py-3">
          <span className="font-bold text-white">{t("common.brand")}</span>
          <NavControls onDark />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="jutge-alert-danger inline-block">{state.message}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {!isSnapshotMode && (
              <>
                <button type="button" onClick={clearPeriod} className="jutge-btn-default">
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
              <button type="button" onClick={clearSnapshot} className="jutge-btn-primary">
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
        <header className="jutge-nav flex items-center justify-between px-4 py-3">
          <div>
            <span className="font-bold text-white">{t("common.brand")}</span>
            <span className="ml-2 text-sm text-white/70">{t("common.wrapped")}</span>
          </div>
          <NavControls onDark />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <TerminalLoadingLine />
        </div>
      </div>
    )
  }

  if (state.status !== "ready") return null

  const { raw, insights } = state
  const exportRaw =
    isSnapshotMode && snapshot ? { ...snapshot, period: raw.period } : raw

  const slides = [
    <IntroSlide key="intro" raw={raw} insights={insights} />,
    <HeatmapSlide key="heatmap" insights={insights} />,
    <WeekdaySlide key="weekday" insights={insights} />,
    <ChronoSlide key="chrono" insights={insights} />,
    <CourseArcSlide key="course" insights={insights} />,
    <VerdictSlide key="verdict" insights={insights} />,
    <RankingSlide key="rank" insights={insights} homepageStats={raw.homepageStats} />,
  ]

  return (
    <div
      className="jutge-page relative flex h-full flex-col"
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("header, footer, button, a, input, select")) return
        const mid = window.innerWidth / 2
        if (e.clientX > mid) next()
        else prev()
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="jutge-nav flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="font-bold text-white">{t("common.brand")}</span>
          <span className="hidden text-sm text-white/70 sm:inline">{t("common.wrapped")}</span>
          {isSnapshotMode && (
            <span className="hidden rounded border border-white/30 px-2 py-0.5 text-xs text-white/90 sm:inline">
              {t("common.snapshot")}
            </span>
          )}
          <div className="hidden sm:block">
            <ProgressDots total={SLIDE_COUNT} current={index} onDark />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NavControls onDark />
          <SnapshotDownloadButton raw={exportRaw} variant="onDark" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearPeriod()
            }}
            className="jutge-btn-default flex items-center gap-1 border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <Calendar className="h-4 w-4" /> {t("deck.dates")}
          </button>
          {isSnapshotMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearSnapshot()
              }}
              className="jutge-btn-default flex items-center gap-1 border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> {t("deck.exit")}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearPeriod()
                logout()
              }}
              className="jutge-btn-default flex items-center gap-1 border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> {t("deck.exit")}
            </button>
          )}
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden overflow-y-auto bg-jutge-bg">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {slides[index]}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex items-center justify-between border-t border-jutge-border bg-jutge-panel px-4 py-3 text-sm text-jutge-muted">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            prev()
          }}
          disabled={index === 0}
          className="jutge-btn-default flex items-center gap-1 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> {t("common.prev")}
        </button>
        <span className="sm:hidden">
          <ProgressDots total={SLIDE_COUNT} current={index} />
        </span>
        <span className="hidden sm:inline">
          {index + 1} / {SLIDE_COUNT}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            next()
          }}
          disabled={index === SLIDE_COUNT - 1}
          className="jutge-btn-default flex items-center gap-1 disabled:opacity-40"
        >
          {t("common.next")} <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  )
}
