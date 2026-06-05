import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react"
import {
  computePullDisplayDistance,
  isPrimarilyVerticalGesture,
  isScrollAtBottom,
  PULL_ARM_THRESHOLD_PX,
  PULL_INDICATOR_MIN_PX,
  shouldAdvanceSlide,
} from "./deckPullNavigation"

type PullUI = {
  distance: number
  visible: boolean
}

type Options = {
  index: number
  slideCount: number
  onAdvance: () => void
}

export function useDeckPullNavigation({ index, slideCount, onAdvance }: Options) {
  const [pullUI, setPullUI] = useState<PullUI>({ distance: 0, visible: false })

  const pullDistanceRef = useRef(0)
  const isPullingRef = useRef(false)
  const reachedBottomYRef = useRef<number | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingUIRef = useRef<PullUI>({ distance: 0, visible: false })
  const isTouchActiveRef = useRef(false)
  const onAdvanceRef = useRef(onAdvance)

  useEffect(() => {
    onAdvanceRef.current = onAdvance
  }, [onAdvance])

  const flushUI = useCallback(() => {
    rafRef.current = null
    const next = pendingUIRef.current
    setPullUI((prev) =>
      prev.distance === next.distance && prev.visible === next.visible
        ? prev
        : next,
    )
  }, [])

  const scheduleUIUpdate = useCallback(
    (distance: number, visible: boolean) => {
      pendingUIRef.current = { distance, visible }
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushUI)
      }
    },
    [flushUI],
  )

  const resetPull = useCallback(() => {
    pullDistanceRef.current = 0
    isPullingRef.current = false
    reachedBottomYRef.current = null
    scheduleUIUpdate(0, false)
  }, [scheduleUIUpdate])

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    isTouchActiveRef.current = true
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    reachedBottomYRef.current = null
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0]
      if (!touch || !touchStartRef.current) return

      const dx = touch.clientX - touchStartRef.current.x
      const dy = touchStartRef.current.y - touch.clientY

      if (!isPrimarilyVerticalGesture(dx, dy)) return

      const container = e.currentTarget
      if (!isScrollAtBottom(container)) {
        if (isPullingRef.current) resetPull()
        return
      }

      if (index >= slideCount - 1) return

      if (reachedBottomYRef.current === null) {
        reachedBottomYRef.current = touch.clientY
      }

      const pullDy = reachedBottomYRef.current - touch.clientY

      if (pullDy > 0) {
        isPullingRef.current = true
        pullDistanceRef.current = pullDy
        const displayDistance = computePullDisplayDistance(pullDy)
        scheduleUIUpdate(
          displayDistance,
          displayDistance >= PULL_INDICATOR_MIN_PX,
        )

        if (pullDy >= PULL_ARM_THRESHOLD_PX && e.cancelable) {
          e.preventDefault()
        }
      } else {
        resetPull()
      }
    },
    [index, resetPull, scheduleUIUpdate, slideCount],
  )

  const finishTouch = useCallback(() => {
    isTouchActiveRef.current = false
    touchStartRef.current = null

    if (isPullingRef.current && shouldAdvanceSlide(pullDistanceRef.current)) {
      onAdvanceRef.current()
    }
    resetPull()
  }, [resetPull])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd: finishTouch,
    handleTouchCancel: finishTouch,
    pullDistance: pullUI.distance,
    isPulling: pullUI.visible,
    isTouchActiveRef,
  }
}
