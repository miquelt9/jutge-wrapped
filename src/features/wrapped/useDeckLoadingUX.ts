import { useEffect, useRef, useState } from "react"
import { deckLoadingAnimationBudgetMs } from "./deckLoadingAnimation"
import type { WrappedLoadState } from "./useWrappedData"

/** Interval for cycling `.` → `..` → `...` after the line is typed. */
export const DECK_LOADING_DOT_INTERVAL_MS = 300
/** How many full dot cycles (each cycle is `.`, `..`, `...`). */
export const DECK_LOADING_DOT_CYCLES = 3
/** Minimum time on the loading screen before the deck appears (fast loads). */
export const DECK_LOADING_MIN_MS = 2400

export function deckLoadingSequenceMs(textLength: number): number {
  const animationMs = deckLoadingAnimationBudgetMs(textLength)
  const dotsMs = DECK_LOADING_DOT_CYCLES * 3 * DECK_LOADING_DOT_INTERVAL_MS
  return Math.max(DECK_LOADING_MIN_MS, animationMs + dotsMs)
}

type LoadingPhase = "loading" | "revealed"

export function useDeckLoadingUX(
  status: WrappedLoadState["status"],
  loadingTextLength: number,
) {
  const [phase, setPhase] = useState<LoadingPhase>("loading")
  const sequenceStartRef = useRef(Date.now())

  useEffect(() => {
    if (status !== "loading" && status !== "idle") return

    sequenceStartRef.current = Date.now()
    setPhase("loading")
  }, [status])

  useEffect(() => {
    if (status !== "ready") return

    const elapsed = Date.now() - sequenceStartRef.current
    const sequenceMs = deckLoadingSequenceMs(loadingTextLength)
    const waitMore = Math.max(0, sequenceMs - elapsed)

    const revealTimer = window.setTimeout(() => setPhase("revealed"), waitMore)

    return () => window.clearTimeout(revealTimer)
  }, [status, loadingTextLength])

  const showLoadingScreen = status !== "error" && phase !== "revealed"

  return { showLoadingScreen }
}
