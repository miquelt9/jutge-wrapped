import { describe, expect, it } from "vitest"
import {
  computePullDisplayDistance,
  isPrimarilyVerticalGesture,
  isScrollAtBottom,
  PULL_THRESHOLD_PX,
  shouldAdvanceSlide,
} from "./deckPullNavigation"

describe("isScrollAtBottom", () => {
  it("returns true when scroll is at the bottom within tolerance", () => {
    const el = {
      scrollHeight: 1000,
      scrollTop: 600,
      clientHeight: 400,
    } as HTMLElement
    expect(isScrollAtBottom(el)).toBe(true)
  })

  it("returns false when content still scrolls below", () => {
    const el = {
      scrollHeight: 1000,
      scrollTop: 500,
      clientHeight: 400,
    } as HTMLElement
    expect(isScrollAtBottom(el)).toBe(false)
  })
})

describe("computePullDisplayDistance", () => {
  it("returns zero for non-positive pull", () => {
    expect(computePullDisplayDistance(0)).toBe(0)
    expect(computePullDisplayDistance(-10)).toBe(0)
  })

  it("linearly maps pull below the threshold", () => {
    expect(computePullDisplayDistance(40)).toBe(40)
    expect(computePullDisplayDistance(PULL_THRESHOLD_PX)).toBe(PULL_THRESHOLD_PX)
  })

  it("applies rubber-band damping above the threshold", () => {
    expect(computePullDisplayDistance(100)).toBe(88)
  })
})

describe("shouldAdvanceSlide", () => {
  it("advances at or above the threshold", () => {
    expect(shouldAdvanceSlide(79)).toBe(false)
    expect(shouldAdvanceSlide(80)).toBe(true)
    expect(shouldAdvanceSlide(120)).toBe(true)
  })
})

describe("isPrimarilyVerticalGesture", () => {
  it("accepts mostly vertical movement", () => {
    expect(isPrimarilyVerticalGesture(10, 40)).toBe(true)
  })

  it("rejects mostly horizontal movement", () => {
    expect(isPrimarilyVerticalGesture(40, 10)).toBe(false)
  })
})
