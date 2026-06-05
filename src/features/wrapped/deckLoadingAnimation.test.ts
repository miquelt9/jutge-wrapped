import { describe, expect, it } from "vitest"
import {
  deckLoadingAnimationBudgetMs,
  hesitationCountForLength,
  pickHesitationIndices,
} from "./deckLoadingAnimation"
import { deckLoadingSequenceMs } from "./useDeckLoadingUX"

describe("deckLoadingAnimation", () => {
  it("picks stable hesitation positions for a line", () => {
    const text = "Loading your Jutge Wrapped"
    const hesitations = pickHesitationIndices(text)

    expect(hesitations.length).toBe(hesitationCountForLength(text.length))
    expect(pickHesitationIndices(text)).toEqual(hesitations)
    hesitations.forEach((index) => {
      expect(index).toBeGreaterThan(2)
      expect(index).toBeLessThan(text.length - 2)
    })
  })

  it("budgets more time than the old fixed-speed estimate", () => {
    const length = "Loading your Jutge Wrapped".length
    const oldEstimate = length * 45 + 3 * 3 * 300
    const newEstimate = deckLoadingSequenceMs(length)

    expect(deckLoadingAnimationBudgetMs(length)).toBeGreaterThan(length * 45)
    expect(newEstimate).toBeGreaterThanOrEqual(oldEstimate)
  })
})
