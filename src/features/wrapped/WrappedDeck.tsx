import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Calendar, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useWrappedPeriod } from "@/context/WrappedContext"
import { ProgressDots } from "@/components/ProgressDots"
import { ThemeSelect } from "@/components/ThemeSelect"
import { CorsOverlay } from "@/components/CorsOverlay"
import { useWrappedData } from "./useWrappedData"
import { IntroSlide } from "./slides/IntroSlide"
import { BigNumbersSlide } from "./slides/BigNumbersSlide"
import { HeatmapSlide } from "./slides/HeatmapSlide"
import { PeakDaySlide } from "./slides/PeakDaySlide"
import { WeekdaySlide } from "./slides/WeekdaySlide"
import { ChronoSlide } from "./slides/ChronoSlide"
import { CourseArcSlide } from "./slides/CourseArcSlide"
import { VerdictSlide } from "./slides/VerdictSlide"
import { RankingSlide } from "./slides/RankingSlide"

const SLIDE_COUNT = 9

export function WrappedDeck() {
  const { client, logout } = useAuth()
  const { period, clearPeriod } = useWrappedPeriod()
  const { state } = useWrappedData(client, period)
  const [index, setIndex] = useState(0)

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

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="jutge-page flex h-full flex-col">
        <header className="jutge-nav flex items-center justify-between px-4 py-3">
          <div>
            <span className="font-bold text-white">Jutge.org</span>
            <span className="ml-2 text-sm text-white/70">Wrapped</span>
          </div>
          <ThemeSelect onDark />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            className="h-10 w-10 animate-spin border-4 border-jutge-border border-t-jutge-blue"
            style={{ borderRadius: 0 }}
          />
          <p className="text-sm text-jutge-muted">
            {period && !period.start && !period.end
              ? "Loading your Wrapped…"
              : "Loading submissions for your date range…"}
          </p>
        </div>
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div className="jutge-page flex h-full flex-col">
        {state.kind === "network" && (
          <CorsOverlay kind={state.kind} message={state.message} />
        )}
        <header className="jutge-nav flex items-center justify-between px-4 py-3">
          <span className="font-bold text-white">Jutge.org</span>
          <ThemeSelect onDark />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="jutge-alert-danger inline-block">{state.message}</p>
          <div className="flex gap-3">
            <button type="button" onClick={clearPeriod} className="jutge-btn-default">
              Change dates
            </button>
            <button
              type="button"
              onClick={() => {
                clearPeriod()
                logout()
              }}
              className="jutge-btn-primary"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { raw, insights } = state

  const slides = [
    <IntroSlide key="intro" raw={raw} insights={insights} />,
    <BigNumbersSlide key="numbers" insights={insights} />,
    <HeatmapSlide key="heatmap" insights={insights} />,
    <PeakDaySlide key="peak" insights={insights} />,
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
        if (target.closest("button, a, input")) return
        const mid = window.innerWidth / 2
        if (e.clientX > mid) next()
        else prev()
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="jutge-nav flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="font-bold text-white">Jutge.org</span>
          <span className="hidden text-sm text-white/70 sm:inline">Wrapped</span>
          <div className="hidden sm:block">
            <ProgressDots total={SLIDE_COUNT} current={index} onDark />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelect onDark />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearPeriod()
            }}
            className="jutge-btn-default flex items-center gap-1 border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <Calendar className="h-4 w-4" /> Dates
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearPeriod()
              logout()
            }}
            className="jutge-btn-default flex items-center gap-1 border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Exit
          </button>
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
          <ChevronLeft className="h-4 w-4" /> Prev
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
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  )
}
