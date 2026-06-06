/** Minimum movement before locking gesture intent. */
export const GESTURE_DEAD_ZONE_PX = 10

/** Fraction of viewport width required to commit a slide change. */
export const SWIPE_THRESHOLD_RATIO = 0.25

export type GestureLock = "vertical" | "horizontal"
export type SwipeDirection = "next" | "prev"

export function prefersCoarsePointer(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  )
}

export function isTouchNavigationTarget(): boolean {
  if (typeof window === "undefined") return false
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    prefersCoarsePointer()
  )
}

export function resolveGestureLock(
  diffX: number,
  diffY: number,
): GestureLock | null {
  const maxDelta = Math.max(diffX, diffY)
  if (maxDelta <= GESTURE_DEAD_ZONE_PX) return null
  return diffY > diffX ? "vertical" : "horizontal"
}

export function computeSwipeProgress(
  absDx: number,
  viewportWidth: number,
  thresholdRatio = SWIPE_THRESHOLD_RATIO,
): number {
  if (viewportWidth <= 0) return 0
  const threshold = viewportWidth * thresholdRatio
  return Math.min(absDx / threshold, 1)
}

export function shouldChangeSlide(progress: number): boolean {
  return progress >= 1
}

export function getSwipeDirection(signedDx: number): SwipeDirection {
  return signedDx < 0 ? "next" : "prev"
}

export function getAdjacentOffsetVw(signedDx: number): SwipeDirection | null {
  if (signedDx < 0) return "next"
  if (signedDx > 0) return "prev"
  return null
}

export function isSwipeAllowed(
  direction: SwipeDirection,
  index: number,
  slideCount: number,
): boolean {
  if (direction === "prev") return index > 0
  return index < slideCount - 1
}
