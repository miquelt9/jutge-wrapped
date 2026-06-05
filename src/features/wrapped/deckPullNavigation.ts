/** Pull distance required to advance to the next slide. */
export const PULL_THRESHOLD_PX = 80

/** Minimum pull before showing the bottom indicator. */
export const PULL_INDICATOR_MIN_PX = 16

/** Scroll tolerance when detecting whether the slide is at the bottom. */
export const SCROLL_BOTTOM_TOLERANCE_PX = 4

/** Maximum visual height of the pull indicator overlay. */
export const PULL_MAX_DISPLAY_PX = 150

/** Minimum upward pull before calling preventDefault on touchmove. */
export const PULL_ARM_THRESHOLD_PX = 12

/** dy must exceed dx by this factor to count as a vertical gesture. */
export const VERTICAL_GESTURE_RATIO = 1.2

export function isScrollAtBottom(
  container: HTMLElement,
  tolerance = SCROLL_BOTTOM_TOLERANCE_PX,
): boolean {
  return (
    container.scrollHeight - container.scrollTop <=
    container.clientHeight + tolerance
  )
}

export function computePullDisplayDistance(
  dy: number,
  threshold = PULL_THRESHOLD_PX,
): number {
  if (dy <= 0) return 0
  let displayDistance = dy
  if (dy > threshold) {
    displayDistance = threshold + (dy - threshold) * 0.4
  }
  return Math.min(displayDistance, PULL_MAX_DISPLAY_PX)
}

export function shouldAdvanceSlide(
  pullDistance: number,
  threshold = PULL_THRESHOLD_PX,
): boolean {
  return pullDistance >= threshold
}

export function isPrimarilyVerticalGesture(
  dx: number,
  dy: number,
  ratio = VERTICAL_GESTURE_RATIO,
): boolean {
  return Math.abs(dy) > Math.abs(dx) * ratio
}

export function prefersCoarsePointer(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  )
}
