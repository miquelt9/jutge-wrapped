import { describe, expect, it } from "vitest"
import type { Submission } from "@/api/client"
import { estimateActiveMinutes } from "./timeSpent"

function makeSubmission(
  timeIn: string | number,
  overrides: Partial<Submission> = {},
): Submission {
  return {
    compiler_id: "G++17",
    problem_id: "P001",
    submission_id: `sub-${String(timeIn)}`,
    annotation: null,
    state: "done",
    time_in: timeIn,
    veredict: "AC",
    veredict_info: null,
    veredict_publics: null,
    ok_publics_but_wrong: 0,
    ...overrides,
  }
}

describe("estimateActiveMinutes", () => {
  it("returns null without submissions", () => {
    expect(estimateActiveMinutes(undefined)).toBeNull()
    expect(estimateActiveMinutes([])).toBeNull()
  })

  it("credits setup time for a single submission", () => {
    const submissions = [makeSubmission("2026-01-01T10:00:00.000Z")]
    expect(estimateActiveMinutes(submissions)).toBe(15)
  })

  it("adds short gaps within the same session", () => {
    const submissions = [
      makeSubmission("2026-01-01T10:00:00.000Z"),
      makeSubmission("2026-01-01T10:12:00.000Z"),
      makeSubmission("2026-01-01T10:20:00.000Z"),
    ]

    // Setup: 15 min, gaps: 12 + 8 min
    expect(estimateActiveMinutes(submissions)).toBe(35)
  })

  it("starts a new session after long breaks", () => {
    const submissions = [
      makeSubmission("2026-01-01T22:00:00.000Z"),
      makeSubmission("2026-01-02T09:00:00.000Z"),
    ]

    // Two sessions: 15 + 15 setup minutes
    expect(estimateActiveMinutes(submissions)).toBe(30)
  })

  it("ignores invalid timestamps while keeping valid entries", () => {
    const submissions = [
      makeSubmission("invalid-date"),
      makeSubmission("2026-01-01T10:00:00.000Z"),
      makeSubmission("2026-01-01T10:05:00.000Z"),
    ]
    expect(estimateActiveMinutes(submissions)).toBe(20)
  })

  it("adds a context-switch penalty when the problem changes", () => {
    const submissions = [
      makeSubmission("2026-01-01T10:00:00.000Z", { problem_id: "P001" }),
      makeSubmission("2026-01-01T10:10:00.000Z", { problem_id: "P002" }),
    ]

    // Setup 15 + gap 10 + context switch 5
    expect(estimateActiveMinutes(submissions)).toBe(30)
  })

  it("keeps debugging gaps after a wrong answer in the same session", () => {
    const submissions = [
      makeSubmission("2026-01-01T10:00:00.000Z", { veredict: "WA" }),
      makeSubmission("2026-01-01T10:50:00.000Z", { veredict: "AC" }),
    ]

    // Setup 15 + 50 min debugging gap
    expect(estimateActiveMinutes(submissions)).toBe(65)
  })

  it("treats long gaps after AC as a new session even under the idle threshold", () => {
    const submissions = [
      makeSubmission("2026-01-01T10:00:00.000Z", { veredict: "AC" }),
      makeSubmission("2026-01-01T10:50:00.000Z", { veredict: "WA" }),
    ]

    // Two sessions: 15 + 15 setup minutes (50 min gap not counted after AC)
    expect(estimateActiveMinutes(submissions)).toBe(30)
  })
})
