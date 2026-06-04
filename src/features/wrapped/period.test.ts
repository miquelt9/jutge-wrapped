import { describe, expect, it } from "vitest"
import type { AllTables, Dashboard, Submission } from "@/api/client"
import {
  awardInPeriod,
  dashboardForWrappedPeriod,
  filterDashboardByPeriod,
  getCurrentAcademicYearRange,
  submissionInPeriod,
  type WrappedPeriod,
} from "./period"

function makeSubmission(
  timeIn: Submission["time_in"],
  overrides: Partial<Submission> = {},
): Submission {
  return {
    compiler_id: "g++",
    problem_id: "P100",
    time_in: timeIn,
    veredict: "AC",
    ...overrides,
  } as Submission
}

const tables = {
  compilers: {
    "g++": { name: "GNU C++", language: "C++" },
  },
  verdicts: {},
  proglangs: {},
} as unknown as AllTables

const boundedPeriod: WrappedPeriod = {
  start: "2025-02-01",
  end: "2025-02-28",
  label: "February 2025",
}

describe("period helpers", () => {
  it("treats period bounds as inclusive", () => {
    expect(
      submissionInPeriod(makeSubmission("2025-02-01T00:00:00Z"), boundedPeriod),
    ).toBe(true)
    expect(
      submissionInPeriod(makeSubmission("2025-02-28T23:59:59Z"), boundedPeriod),
    ).toBe(true)
    expect(
      submissionInPeriod(makeSubmission("2025-03-01T00:00:00Z"), boundedPeriod),
    ).toBe(false)
  })

  it("filters awards by period bounds", () => {
    const award = {
      award_id: "a1",
      time: "2025-02-15T12:00:00Z",
      type: "funs",
      icon: "icons/a.png",
      title: "Test",
      info: "Info",
      youtube: null,
      submission: null,
    }
    expect(awardInPeriod(award, boundedPeriod)).toBe(true)
    expect(
      awardInPeriod({ ...award, time: "2025-01-01T00:00:00Z" }, boundedPeriod),
    ).toBe(false)
  })

  it("parses unix timestamps stored as numeric strings", () => {
    const feb4 = String(Date.UTC(2025, 1, 4, 10) / 1000)
    expect(submissionInPeriod(makeSubmission(feb4), boundedPeriod)).toBe(true)
    expect(
      submissionInPeriod(
        makeSubmission(String(Date.UTC(2025, 2, 1) / 1000)),
        boundedPeriod,
      ),
    ).toBe(false)
  })

  it("filters dashboard heatmap cells and recomputes submission totals", () => {
    const dashboard = {
      stats: {
        number_of_submissions: 6,
        number_of_accepted_problems: 2,
        number_of_rejected_problems: 1,
      },
      heatmap: [
        { date: Date.UTC(2025, 0, 31) / 1000, value: 2 },
        { date: Date.UTC(2025, 1, 4) / 1000, value: 3 },
        { date: Date.UTC(2025, 1, 9) / 1000, value: 1 },
      ],
      distributions: {
        verdicts: {},
        compilers: {},
        proglangs: {},
        submissions_by_hour: {},
        submissions_by_weekday: {},
      },
    } as Dashboard

    const filtered = filterDashboardByPeriod(dashboard, boundedPeriod)

    expect(filtered.heatmap).toEqual([
      { date: Date.UTC(2025, 1, 4) / 1000, value: 3 },
      { date: Date.UTC(2025, 1, 9) / 1000, value: 1 },
    ])
    expect(filtered.stats.number_of_submissions).toBe(4)
    expect(filtered.distributions).toBe(dashboard.distributions)
  })

  it("rebuilds a bounded dashboard from submission history when available", () => {
    const sourceDashboard = {
      stats: {
        number_of_submissions: 99,
        number_of_accepted_problems: 0,
        number_of_rejected_problems: 0,
      },
      heatmap: [{ date: Date.UTC(2025, 1, 4) / 1000, value: 99 }],
      distributions: {
        verdicts: {},
        compilers: {},
        proglangs: {},
        submissions_by_hour: {},
        submissions_by_weekday: {},
      },
    } as Dashboard

    const result = dashboardForWrappedPeriod(
      {
        dashboard: sourceDashboard,
        submissions: [
          makeSubmission("2025-02-04T10:00:00Z"),
          makeSubmission("2025-02-04T13:00:00Z", { problem_id: "P200" }),
          makeSubmission("2025-03-04T08:00:00Z", { problem_id: "P300" }),
        ],
        tables,
      },
      boundedPeriod,
    )

    expect(result.stats.number_of_submissions).toBe(2)
    expect(result.heatmap).toEqual([
      { date: Date.UTC(2025, 1, 4) / 1000, value: 2 },
    ])
    expect(result.distributions.compilers["g++"]).toBe(2)
  })

  it("uses the current academic year boundaries around September", () => {
    const autumnRange = getCurrentAcademicYearRange(
      new Date("2026-10-03T12:00:00Z"),
    )
    expect(autumnRange.start).toBe("2026-09-01")
    expect(autumnRange.end).toBe("2027-07-31")
    expect(autumnRange.label).toContain("2026")
    expect(autumnRange.label).toContain("27")

    const springRange = getCurrentAcademicYearRange(
      new Date("2026-03-03T12:00:00Z"),
    )
    expect(springRange.start).toBe("2025-09-01")
    expect(springRange.end).toBe("2026-07-31")
    expect(springRange.label).toContain("2025")
    expect(springRange.label).toContain("26")
  })
})
