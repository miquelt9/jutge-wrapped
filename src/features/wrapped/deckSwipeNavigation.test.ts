import { describe, expect, it } from "vitest"
import {
  computeSwipeProgress,
  GESTURE_DEAD_ZONE_PX,
  getTouchMotionQuality,
  getAdjacentOffsetVw,
  getSwipeDirection,
  isSwipeAllowed,
  resolveGestureLock,
  shouldChangeSlide,
  shouldChangeSlideWithVelocity,
  SWIPE_VELOCITY_COMMIT_PX_PER_MS,
  SWIPE_THRESHOLD_RATIO,
} from "./deckSwipeNavigation"

describe("resolveGestureLock", () => {
  it("returns null within the dead zone", () => {
    expect(resolveGestureLock(5, 5)).toBeNull()
    expect(resolveGestureLock(GESTURE_DEAD_ZONE_PX, 4)).toBeNull()
  })

  it("locks vertical when diffY exceeds diffX", () => {
    expect(resolveGestureLock(12, 20)).toBe("vertical")
  })

  it("locks horizontal when diffX exceeds diffY", () => {
    expect(resolveGestureLock(20, 12)).toBe("horizontal")
  })

  it("prefers horizontal when diffX equals diffY beyond the dead zone", () => {
    expect(resolveGestureLock(15, 15)).toBe("horizontal")
  })
})

describe("computeSwipeProgress", () => {
  it("returns zero for no movement", () => {
    expect(computeSwipeProgress(0, 400)).toBe(0)
  })

  it("scales progress against 25% of viewport width", () => {
    const viewportWidth = 400
    const threshold = viewportWidth * SWIPE_THRESHOLD_RATIO
    expect(computeSwipeProgress(threshold / 2, viewportWidth)).toBe(0.5)
    expect(computeSwipeProgress(threshold, viewportWidth)).toBe(1)
  })

  it("caps progress at 1", () => {
    expect(computeSwipeProgress(500, 400)).toBe(1)
  })
})

describe("shouldChangeSlide", () => {
  it("commits at or above full progress", () => {
    expect(shouldChangeSlide(0.99)).toBe(false)
    expect(shouldChangeSlide(1)).toBe(true)
    expect(shouldChangeSlide(1.2)).toBe(true)
  })
})

describe("shouldChangeSlideWithVelocity", () => {
  it("commits by distance threshold", () => {
    expect(shouldChangeSlideWithVelocity(1, 0.1)).toBe(true)
  })

  it("commits by high swipe velocity below distance threshold", () => {
    expect(
      shouldChangeSlideWithVelocity(0.4, SWIPE_VELOCITY_COMMIT_PX_PER_MS + 0.1),
    ).toBe(true)
  })

  it("does not commit on slow short swipe", () => {
    expect(shouldChangeSlideWithVelocity(0.4, 0.2)).toBe(false)
  })
})

describe("getSwipeDirection", () => {
  it("maps signed dx to next and prev", () => {
    expect(getSwipeDirection(-40)).toBe("next")
    expect(getSwipeDirection(40)).toBe("prev")
  })
})

describe("getAdjacentOffsetVw", () => {
  it("maps signed dx to the adjacent slide target", () => {
    expect(getAdjacentOffsetVw(-40)).toBe("next")
    expect(getAdjacentOffsetVw(40)).toBe("prev")
    expect(getAdjacentOffsetVw(0)).toBeNull()
  })
})

describe("isSwipeAllowed", () => {
  it("blocks prev on the first slide", () => {
    expect(isSwipeAllowed("prev", 0, 5)).toBe(false)
    expect(isSwipeAllowed("prev", 1, 5)).toBe(true)
  })

  it("blocks next on the last slide", () => {
    expect(isSwipeAllowed("next", 4, 5)).toBe(false)
    expect(isSwipeAllowed("next", 3, 5)).toBe(true)
  })
})

describe("getTouchMotionQuality", () => {
  it("returns a valid quality value", () => {
    expect(["normal", "reduced"]).toContain(getTouchMotionQuality())
  })
})
