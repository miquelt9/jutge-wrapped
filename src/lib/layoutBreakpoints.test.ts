import { describe, expect, it } from "vitest"
import { HEATMAP_MOBILE_MEDIA, LAYOUT_WIDE_MEDIA } from "./layoutBreakpoints"

describe("layoutBreakpoints", () => {
  it("aligns heatmap mobile cutoff with Tailwind sm (640px)", () => {
    expect(HEATMAP_MOBILE_MEDIA).toBe("(max-width: 639px)")
  })

  it("aligns wide layout with Tailwind lg (1024px)", () => {
    expect(LAYOUT_WIDE_MEDIA).toBe("(min-width: 1024px)")
  })
})
