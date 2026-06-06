/** Minimum movement before locking gesture intent. */
export const GESTURE_DEAD_ZONE_PX = 10

/** Fraction of viewport width required to commit a slide change. */
export const SWIPE_THRESHOLD_RATIO = 0.25
export const SWIPE_VELOCITY_COMMIT_PX_PER_MS = 0.6

export type GestureLock = "vertical" | "horizontal"
export type SwipeDirection = "next" | "prev"
export type MotionQuality = "normal" | "reduced"

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

export function shouldChangeSlideWithVelocity(
  progress: number,
  velocityPxPerMs: number,
  velocityThreshold = SWIPE_VELOCITY_COMMIT_PX_PER_MS,
): boolean {
  return shouldChangeSlide(progress) || Math.abs(velocityPxPerMs) >= velocityThreshold
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

export function getTouchMotionQuality(): MotionQuality {
  if (typeof navigator === "undefined") return "normal"
  const coreCount = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (coreCount <= 4 || memory <= 4) return "reduced"
  return "normal"
}
