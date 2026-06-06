import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
} from "react"
import {
  computeSwipeProgress,
  getAdjacentOffsetVw,
  getSwipeDirection,
  isSwipeAllowed,
  isTouchNavigationTarget,
  resolveGestureLock,
  shouldChangeSlideWithVelocity,
  type MotionQuality,
  type GestureLock,
  type SwipeDirection,
} from "./deckSwipeNavigation"

export const DECK_SWIPE_TRANSITION =
  "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)"

const SNAP_BACK_MS_NORMAL = 280
const SNAP_BACK_MS_REDUCED = 200
const COMMIT_ANIMATION_MS_NORMAL = 280
const COMMIT_ANIMATION_MS_REDUCED = 220

export type SwipeUI = {
  translateX: number
  isAnimating: boolean
  gestureLock: GestureLock | null
}

const IDLE_SWIPE_UI: SwipeUI = {
  translateX: 0,
  isAnimating: false,
  gestureLock: null,
}

type Options = {
  index: number
  slideCount: number
  onNext: () => void
  onPrev: () => void
  motionQuality?: MotionQuality
}

export function useDeckSwipeNavigation({
  index,
  slideCount,
  onNext,
  onPrev,
  motionQuality = "normal",
}: Options) {
  const [swipeUI, setSwipeUI] = useState<SwipeUI>(IDLE_SWIPE_UI)

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchStartAtRef = useRef<number | null>(null)
  const gestureLockRef = useRef<GestureLock | null>(null)
  const signedDxRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const pendingUIRef = useRef<SwipeUI>(IDLE_SWIPE_UI)
  const isTouchActiveRef = useRef(false)
  const onNextRef = useRef(onNext)
  const onPrevRef = useRef(onPrev)
  const indexRef = useRef(index)
  const slideCountRef = useRef(slideCount)
  const snapTimerRef = useRef<number | null>(null)
  const commitTimerRef = useRef<number | null>(null)
  const listenerCleanupRef = useRef<(() => void) | null>(null)
  const [isInteractionActive, setIsInteractionActive] = useState(false)
  const [lastCommittedDirection, setLastCommittedDirection] =
    useState<SwipeDirection | null>(null)

  const commitAnimationMs =
    motionQuality === "reduced"
      ? COMMIT_ANIMATION_MS_REDUCED
      : COMMIT_ANIMATION_MS_NORMAL
  const snapBackMs =
    motionQuality === "reduced" ? SNAP_BACK_MS_REDUCED : SNAP_BACK_MS_NORMAL

  useEffect(() => {
    onNextRef.current = onNext
    onPrevRef.current = onPrev
  }, [onNext, onPrev])

  useEffect(() => {
    indexRef.current = index
    slideCountRef.current = slideCount
  }, [index, slideCount])

  const flushUI = useCallback(() => {
    rafRef.current = null
    setSwipeUI(pendingUIRef.current)
  }, [])

  const scheduleUIUpdate = useCallback(
    (partial: Partial<SwipeUI>) => {
      pendingUIRef.current = { ...pendingUIRef.current, ...partial }
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushUI)
      }
    },
    [flushUI],
  )

  const clearSnapTimer = useCallback(() => {
    if (snapTimerRef.current !== null) {
      window.clearTimeout(snapTimerRef.current)
      snapTimerRef.current = null
    }
  }, [])

  const clearCommitTimer = useCallback(() => {
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current)
      commitTimerRef.current = null
    }
  }, [])

  const resetSwipe = useCallback(() => {
    clearSnapTimer()
    clearCommitTimer()
    gestureLockRef.current = null
    signedDxRef.current = 0
    touchStartAtRef.current = null
    pendingUIRef.current = IDLE_SWIPE_UI
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setSwipeUI(IDLE_SWIPE_UI)
  }, [clearCommitTimer, clearSnapTimer])

  const snapBack = useCallback(() => {
    scheduleUIUpdate({
      translateX: 0,
      isAnimating: true,
      gestureLock: "horizontal",
    })
    clearSnapTimer()
    snapTimerRef.current = window.setTimeout(() => {
      snapTimerRef.current = null
      resetSwipe()
    }, snapBackMs)
  }, [clearSnapTimer, resetSwipe, scheduleUIUpdate, snapBackMs])

  const commitSwipe = useCallback(
    (direction: SwipeDirection) => {
      const viewportWidth = window.innerWidth
      const targetOffset = direction === "next" ? -viewportWidth : viewportWidth
      scheduleUIUpdate({
        translateX: targetOffset,
        isAnimating: true,
        gestureLock: "horizontal",
      })

      clearCommitTimer()
      commitTimerRef.current = window.setTimeout(() => {
        commitTimerRef.current = null
        setLastCommittedDirection(direction)
        if (direction === "next") onNextRef.current()
        else onPrevRef.current()
        resetSwipe()
        isTouchActiveRef.current = false
        setIsInteractionActive(false)
      }, commitAnimationMs)
    },
    [clearCommitTimer, commitAnimationMs, resetSwipe, scheduleUIUpdate],
  )

  const attachListeners = useCallback(
    (container: HTMLDivElement) => {
      const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0]
        if (!touch) return

        clearSnapTimer()
        isTouchActiveRef.current = true
        setIsInteractionActive(true)
        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        touchStartAtRef.current = performance.now()
        gestureLockRef.current = null
        signedDxRef.current = 0
        pendingUIRef.current = IDLE_SWIPE_UI
        setSwipeUI(IDLE_SWIPE_UI)
      }

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        const start = touchStartRef.current
        if (!touch || !start) return

        const diffX = Math.abs(touch.clientX - start.x)
        const diffY = Math.abs(touch.clientY - start.y)

        if (gestureLockRef.current === null) {
          const lock = resolveGestureLock(diffX, diffY)
          if (lock === null) return
          gestureLockRef.current = lock
          if (lock === "vertical") return
        }

        if (gestureLockRef.current === "vertical") return

        if (e.cancelable) e.preventDefault()

        const signedDx = touch.clientX - start.x
        const direction = getSwipeDirection(signedDx)
        const allowed = isSwipeAllowed(
          direction,
          indexRef.current,
          slideCountRef.current,
        )

        const clampedDx = allowed ? signedDx : signedDx * 0.25
        signedDxRef.current = clampedDx

        scheduleUIUpdate({
          translateX: clampedDx,
          isAnimating: false,
          gestureLock: "horizontal",
        })
      }

      const handleTouchEnd = () => {
        touchStartRef.current = null

        if (gestureLockRef.current !== "horizontal") {
          isTouchActiveRef.current = false
          setIsInteractionActive(false)
          resetSwipe()
          return
        }

        const signedDx = signedDxRef.current
        const direction = getSwipeDirection(signedDx)
        const allowed = isSwipeAllowed(
          direction,
          indexRef.current,
          slideCountRef.current,
        )
        const progress = computeSwipeProgress(
          Math.abs(signedDx),
          window.innerWidth,
        )
        const now = performance.now()
        const elapsed = Math.max(1, now - (touchStartAtRef.current ?? now))
        const velocityPxPerMs = signedDx / elapsed

        if (allowed && shouldChangeSlideWithVelocity(progress, velocityPxPerMs)) {
          commitSwipe(direction)
          return
        }

        isTouchActiveRef.current = false
        setIsInteractionActive(false)
        snapBack()
      }

      const handleTouchCancel = () => {
        isTouchActiveRef.current = false
        setIsInteractionActive(false)
        touchStartRef.current = null

        if (gestureLockRef.current === "horizontal" && signedDxRef.current !== 0) {
          snapBack()
          return
        }

        resetSwipe()
      }

      container.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      })
      container.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      })
      container.addEventListener("touchend", handleTouchEnd, { passive: true })
      container.addEventListener("touchcancel", handleTouchCancel, {
        passive: true,
      })

      return () => {
        container.removeEventListener("touchstart", handleTouchStart)
        container.removeEventListener("touchmove", handleTouchMove)
        container.removeEventListener("touchend", handleTouchEnd)
        container.removeEventListener("touchcancel", handleTouchCancel)
      }
    },
    [clearSnapTimer, commitSwipe, resetSwipe, scheduleUIUpdate, snapBack],
  )

  const setTrackRef: RefCallback<HTMLDivElement> = useCallback(
    (node) => {
      listenerCleanupRef.current?.()
      listenerCleanupRef.current = null

      if (!node || !isTouchNavigationTarget()) return

      listenerCleanupRef.current = attachListeners(node)
    },
    [attachListeners],
  )

  useEffect(() => {
    return () => {
      listenerCleanupRef.current?.()
      clearSnapTimer()
      clearCommitTimer()
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [clearCommitTimer, clearSnapTimer])

  const swipeTarget: SwipeDirection | null = useMemo(() => {
    if (swipeUI.gestureLock !== "horizontal") return null
    return getAdjacentOffsetVw(swipeUI.translateX)
  }, [swipeUI.gestureLock, swipeUI.translateX])

  return {
    setTrackRef,
    swipeUI,
    swipeTarget,
    isTouchActiveRef,
    isInteractionActive,
    lastCommittedDirection,
    swipeTransition: DECK_SWIPE_TRANSITION,
  }
}
