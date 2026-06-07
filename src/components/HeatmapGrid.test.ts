import { describe, expect, it } from "vitest"
import { shouldUseMobileHeatmapLayout } from "./HeatmapGrid"

describe("shouldUseMobileHeatmapLayout", () => {
  it("keeps mobile layout on mobile viewport outside export mode", () => {
    expect(shouldUseMobileHeatmapLayout(true, false)).toBe(true)
  })

  it("keeps mobile layout on mobile viewport during export mode", () => {
    expect(shouldUseMobileHeatmapLayout(true, true)).toBe(true)
  })

  it("uses desktop layout on desktop viewport", () => {
    expect(shouldUseMobileHeatmapLayout(false, false)).toBe(false)
    expect(shouldUseMobileHeatmapLayout(false, true)).toBe(false)
  })
})
