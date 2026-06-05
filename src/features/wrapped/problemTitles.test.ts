import { describe, expect, it } from "vitest"
import { resolveProblemTitle } from "./problemTitles"

describe("resolveProblemTitle", () => {
  it("returns null when no title map is available", () => {
    expect(resolveProblemTitle("P001", undefined)).toBeNull()
  })

  it("returns null when the title matches the problem id", () => {
    expect(resolveProblemTitle("P001", { P001: "P001" })).toBeNull()
  })

  it("returns a trimmed title when it differs from the problem id", () => {
    expect(
      resolveProblemTitle("P001", { P001: "  Sum of two numbers  " }),
    ).toBe("Sum of two numbers")
  })
})
