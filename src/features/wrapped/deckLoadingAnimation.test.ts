import { describe, expect, it } from "vitest"
import {
  deckLoadingAnimationBudgetMs,
  pickStumbleIndex,
  pickTypoIndex,
  typoChar,
} from "./deckLoadingAnimation"
import { deckLoadingSequenceMs } from "./useDeckLoadingUX"

describe("deckLoadingAnimation", () => {
  it("picks stable typo and stumble positions for a line", () => {
    const text = "Loading your Jutge Wrapped"
    const typo = pickTypoIndex(text)
    const stumble = pickStumbleIndex(text, typo)

    expect(typo).not.toBeNull()
    expect(stumble).not.toBeNull()
    expect(typo).not.toBe(stumble)
    expect(pickTypoIndex(text)).toBe(typo)
    expect(pickStumbleIndex(text, typo)).toBe(stumble)
  })

  it("returns a different nearby key for typos", () => {
    expect(typoChar("o")).toBe("i")
    expect(typoChar("J")).toBe("K")
  })

  it("budgets more time than the old fixed-speed estimate", () => {
    const length = "Loading your Jutge Wrapped".length
    const oldEstimate = length * 45 + 3 * 3 * 300
    const newEstimate = deckLoadingSequenceMs(length)

    expect(deckLoadingAnimationBudgetMs(length)).toBeGreaterThan(length * 45)
    expect(newEstimate).toBeGreaterThanOrEqual(oldEstimate)
  })
})
