import { describe, expect, it } from "vitest"
import type { Award, Submission } from "@/api/client"
import {
  buildAwardInsights,
  buildIntroMetricDrilldowns,
  buildRankingHighlights,
  buildWrappedInsights,
  resolveRhythmTitleKey,
  shuffleAwardsForDisplay,
} from "./selectors"
import type { ChronoInsights, WeekdayInsights, WrappedRawData } from "./types"

function makeSubmission(
  timeIn: string,
  overrides: Partial<Submission> = {},
): Submission {
  return {
    compiler_id: "G++17",
    problem_id: "X35277",
    submission_id: `sub-${timeIn}`,
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

const baseRaw = {
  profile: {
    email: "ada@example.com",
    name: "Ada Lovelace",
    nickname: "Ada",
  },
  avatarUrl: null,
  dashboard: {
    stats: {
      number_of_submissions: 4,
      number_of_accepted_problems: 1,
      number_of_rejected_problems: 0,
    },
    distributions: {
      submissions_by_weekday: {},
      submissions_by_hour: {},
      proglangs: {},
      compilers: {},
      verdicts: {},
    },
    heatmap: [{ date: Date.UTC(2025, 0, 1) / 1000, value: 4 }],
  },
  level: "P1",
  absoluteRanking: 42,
  homepageStats: {
    users: 1000,
    submissions: 50000,
    problems: 4000,
    exams: 0,
    contests: 0,
  },
  hexColors: {},
  tables: {
    compilers: { G__17: { name: "GNU C++17", language: "C++" } },
    verdicts: {},
    proglangs: {},
  },
  period: { start: null, end: null, label: "All time" },
} as unknown as WrappedRawData

describe("buildIntroMetricDrilldowns", () => {
  it("returns unavailable drilldowns without submission history", () => {
    expect(buildIntroMetricDrilldowns(undefined, baseRaw.tables)).toEqual({
      available: false,
      acceptedProblems: [],
      rejectedProblems: [],
      submissions: [],
    })
  })

  it("builds accepted, rejected, and submission lists from history", () => {
    const submissions = [
      makeSubmission("2025-01-03T10:00:00Z", {
        veredict: "AC",
        problem_id: "P002",
        submission_id: "sub-3",
      }),
      makeSubmission("2025-01-01T10:00:00Z", {
        veredict: "AC",
        problem_id: "P001",
        submission_id: "sub-1",
      }),
      makeSubmission("2025-01-02T10:00:00Z", {
        veredict: "WA",
        problem_id: "P003",
        submission_id: "sub-2",
      }),
    ]

    const tables = {
      ...baseRaw.tables,
      verdicts: {
        WA: {
          verdict_id: "WA",
          name: "Wrong Answer",
          emoji: "❌",
          description: "Wrong answer",
        },
      },
    }

    const problemTitles = {
      P001: "First problem",
      P002: "Second problem",
      P003: "Rejected only",
    }
    const raw = { ...baseRaw, submissions, tables, problemTitles }
    const drilldowns = buildIntroMetricDrilldowns(
      submissions,
      tables,
      problemTitles,
    )
    const insights = buildWrappedInsights(raw)

    expect(drilldowns.available).toBe(true)
    expect(
      drilldowns.acceptedProblems.map((problem) => problem.problemId),
    ).toEqual(["P001", "P002"])
    expect(
      drilldowns.rejectedProblems.map((problem) => problem.problemId),
    ).toEqual(["P003"])
    expect(
      drilldowns.submissions.map((submission) => submission.submissionId),
    ).toEqual(["sub-3", "sub-2", "sub-1"])
    expect(drilldowns.submissions[1]?.verdictLabel).toBe("Wrong Answer")
    expect(drilldowns.submissions[1]?.problemTitle).toBe("Rejected only")
    expect(drilldowns.acceptedProblems[0]?.problemTitle).toBe("First problem")
    expect(drilldowns.acceptedProblems[0]).toMatchObject({
      submissionCount: 1,
      attemptsBeforeAc: 0,
    })
    expect(drilldowns.acceptedProblems[1]).toMatchObject({
      submissionCount: 1,
      attemptsBeforeAc: 0,
    })
    expect(drilldowns.rejectedProblems[0]).toMatchObject({
      problemId: "P003",
      submissionCount: 1,
      lastVerdictLabel: "Wrong Answer",
    })
    expect(insights.journey.drilldowns).toEqual(drilldowns)
  })

  it("attaches period awards to accepted problems", () => {
    const submissions = [
      makeSubmission("2025-01-01T10:00:00Z", {
        veredict: "AC",
        problem_id: "P001",
        submission_id: "sub-1",
      }),
    ]
    const awards: Record<string, Award> = {
      A1: {
        award_id: "A1",
        time: "2025-01-01T12:00:00Z",
        type: "funs",
        icon: "25.png",
        title: "First blood",
        info: "Nice one",
        youtube: null,
        submission: submissions[0]!,
      },
      A2: {
        award_id: "A2",
        time: "2024-01-01T12:00:00Z",
        type: "funs",
        icon: "26.png",
        title: "Old award",
        info: "Outside period",
        youtube: null,
        submission: submissions[0]!,
      },
    }
    const period = {
      start: "2025-01-01",
      end: "2025-12-31",
      label: "2025",
    }

    const drilldowns = buildIntroMetricDrilldowns(
      submissions,
      baseRaw.tables,
      undefined,
      awards,
      period,
    )

    expect(drilldowns.acceptedProblems[0]?.awards).toEqual([
      {
        awardId: "A1",
        title: "First blood",
        iconUrl: "https://jutge.org/awards/funs/25.png",
      },
    ])
    expect(drilldowns.acceptedProblems[0]).toMatchObject({
      submissionCount: 1,
      attemptsBeforeAc: 0,
    })
  })
})

describe("buildWrappedInsights hero moment", () => {
  it("picks the grind problem when submissions are available", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      submissions: [
        makeSubmission("2025-01-01T10:00:00Z", {
          veredict: "WA",
          problem_id: "X35277",
        }),
        makeSubmission("2025-01-02T10:00:00Z", {
          veredict: "WA",
          problem_id: "X35277",
        }),
        makeSubmission("2025-01-03T10:00:00Z", {
          veredict: "AC",
          problem_id: "X35277",
        }),
      ],
    }

    const hero = buildWrappedInsights(raw).personalized.heroMoment

    expect(hero).toMatchObject({
      kind: "grind",
      problemId: "X35277",
      problemLabel: "X35277",
      attemptsBeforeAc: 2,
      submissionCount: 3,
    })
  })

  it("returns no hero moment without submission history", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      submissions: undefined,
    }

    expect(buildWrappedInsights(raw).personalized.heroMoment).toBeNull()
  })
})

describe("buildWrappedInsights slow solve", () => {
  it("tracks the longest span from first failed submit to first AC", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      submissions: [
        makeSubmission("2025-01-01T10:00:00Z", {
          veredict: "WA",
          problem_id: "FAST",
        }),
        makeSubmission("2025-01-01T12:00:00Z", {
          veredict: "AC",
          problem_id: "FAST",
        }),
        makeSubmission("2025-01-02T08:00:00Z", {
          veredict: "WA",
          problem_id: "SLOW",
        }),
        makeSubmission("2025-01-04T11:00:00Z", {
          veredict: "WA",
          problem_id: "SLOW",
        }),
        makeSubmission("2025-01-05T09:30:00Z", {
          veredict: "AC",
          problem_id: "SLOW",
        }),
      ],
    }

    const slowSolve = buildWrappedInsights(raw).personalized.slowSolve

    expect(slowSolve).toMatchObject({
      problemId: "SLOW",
      problemLabel: "SLOW",
      submissionsBeforeAc: 2,
      durationLabel: "3 days, 1 hour",
    })
    expect(slowSolve?.durationMs).toBe(264_600_000)
  })

  it("ignores problems solved on the first submission", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      submissions: [
        makeSubmission("2025-01-01T10:00:00Z", {
          veredict: "AC",
          problem_id: "ONE_SHOT",
        }),
      ],
    }

    expect(buildWrappedInsights(raw).personalized.slowSolve).toBeNull()
  })
})

describe("buildRankingHighlights", () => {
  it("computes first-attempt rate from submission history", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      dashboard: {
        ...baseRaw.dashboard,
        stats: {
          number_of_submissions: 5,
          number_of_accepted_problems: 2,
          number_of_rejected_problems: 0,
        },
      },
      homepageStats: {
        users: 1000,
        submissions: 50000,
        problems: 4000,
        exams: 0,
        contests: 0,
      },
      submissions: [
        makeSubmission("2025-01-01T10:00:00Z", {
          veredict: "AC",
          problem_id: "P001",
        }),
        makeSubmission("2025-01-02T10:00:00Z", {
          veredict: "WA",
          problem_id: "P002",
        }),
        makeSubmission("2025-01-03T10:00:00Z", {
          veredict: "AC",
          problem_id: "P002",
        }),
      ],
    }

    const highlights = buildRankingHighlights(raw)

    expect(highlights.items).toContainEqual({
      kind: "first_attempt",
      percent: 50,
      numerator: 1,
      denominator: 2,
    })
  })

  it("includes platform problem and submission shares", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      dashboard: {
        ...baseRaw.dashboard,
        stats: {
          number_of_submissions: 100,
          number_of_accepted_problems: 40,
          number_of_rejected_problems: 0,
        },
      },
      homepageStats: {
        users: 1000,
        submissions: 50000,
        problems: 4000,
        exams: 0,
        contests: 0,
      },
      submissions: [
        makeSubmission("2025-01-01T10:00:00Z", {
          veredict: "AC",
          problem_id: "P001",
        }),
      ],
    }

    const highlights = buildRankingHighlights(raw)

    expect(highlights.items).toContainEqual({
      kind: "platform_problems",
      percent: 1,
      numerator: 40,
      denominator: 4000,
    })
    expect(highlights.items).toContainEqual({
      kind: "platform_submissions",
      percent: 0.2,
      numerator: 100,
      denominator: 50000,
    })
  })

  it("preserves extra precision for tiny platform submission shares", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      dashboard: {
        ...baseRaw.dashboard,
        stats: {
          number_of_submissions: 4,
          number_of_accepted_problems: 1,
          number_of_rejected_problems: 0,
        },
      },
      homepageStats: {
        users: 1000,
        submissions: 500_000,
        problems: 4000,
        exams: 0,
        contests: 0,
      },
    }

    const highlights = buildRankingHighlights(raw)

    expect(highlights.items).toContainEqual({
      kind: "platform_submissions",
      percent: 0.0008,
      numerator: 4,
      denominator: 500_000,
    })
  })

  it("omits first-attempt card without submission history", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      submissions: undefined,
    }

    const highlights = buildRankingHighlights(raw)

    expect(highlights.items.some((item) => item.kind === "first_attempt")).toBe(
      false,
    )
  })

  it("includes compile grief when CE verdicts exist", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      dashboard: {
        ...baseRaw.dashboard,
        distributions: {
          ...baseRaw.dashboard.distributions,
          verdicts: { AC: 80, CE: 142, WA: 50 },
        },
      },
    }

    const highlights = buildRankingHighlights(raw)

    expect(highlights.items).toContainEqual({
      kind: "compile_grief",
      percent: 52.2,
      numerator: 142,
      denominator: 272,
    })
  })

  it("omits compile grief when there are no CE verdicts", () => {
    const highlights = buildRankingHighlights(baseRaw)

    expect(highlights.items.some((item) => item.kind === "compile_grief")).toBe(
      false,
    )
  })

  it("orders highlights in narrative sequence", () => {
    const raw: WrappedRawData = {
      ...baseRaw,
      dashboard: {
        ...baseRaw.dashboard,
        stats: {
          number_of_submissions: 100,
          number_of_accepted_problems: 40,
          number_of_rejected_problems: 0,
        },
        distributions: {
          ...baseRaw.dashboard.distributions,
          verdicts: { AC: 80, CE: 20, WA: 50 },
        },
      },
      homepageStats: {
        users: 1000,
        submissions: 50000,
        problems: 4000,
        exams: 0,
        contests: 0,
      },
      submissions: [
        makeSubmission("2025-01-01T10:00:00Z", {
          veredict: "AC",
          problem_id: "P001",
        }),
        makeSubmission("2025-01-02T10:00:00Z", {
          veredict: "WA",
          problem_id: "P002",
        }),
        makeSubmission("2025-01-03T10:00:00Z", {
          veredict: "AC",
          problem_id: "P002",
        }),
      ],
    }

    const highlights = buildRankingHighlights(raw)

    expect(highlights.items.map((item) => item.kind)).toEqual([
      "compile_grief",
      "platform_submissions",
      "first_attempt",
      "platform_problems",
    ])
  })
})

function makeAward(
  id: string,
  time: string,
  overrides: Partial<Award> = {},
): Award {
  return {
    award_id: id,
    time,
    type: "funs",
    icon: "funs/25.png",
    title: `Award ${id}`,
    info: `Info for ${id}`,
    youtube: null,
    submission: null,
    ...overrides,
  }
}

describe("buildAwardInsights", () => {
  const period = { start: "2025-01-01", end: "2025-12-31", label: "2025" }

  it("returns empty insights when no awards", () => {
    expect(buildAwardInsights(undefined, period)).toEqual({
      count: 0,
      items: [],
      featured: null,
      title: "",
    })
  })

  it("filters awards by period and sorts newest first", () => {
    const awards = {
      old: makeAward("old", "2024-06-01T12:00:00Z"),
      new: makeAward("new", "2025-06-01T12:00:00Z"),
    }

    const insights = buildAwardInsights(awards, period, () => 0)

    expect(insights.count).toBe(1)
    expect(insights.items[0]?.awardId).toBe("new")
    expect(insights.featured?.awardId).toBe("new")
    expect(insights.items[0]?.iconUrl).toBe(
      "https://jutge.org/awards/funs/25.png",
    )
  })

  it("includes all awards for all-time period", () => {
    const awards = {
      a: makeAward("a", "2024-01-01T12:00:00Z"),
      b: makeAward("b", "2025-01-01T12:00:00Z"),
    }
    const allTime = { start: null, end: null, label: "All time" }

    const insights = buildAwardInsights(awards, allTime, () => 0)

    expect(insights.count).toBe(2)
    expect(insights.items.map((item) => item.awardId).sort()).toEqual([
      "a",
      "b",
    ])
  })

  it("strips unreachable YouTube ids from award items", () => {
    const awards = {
      blocked: makeAward("blocked", "2025-06-01T12:00:00Z", {
        youtube: "q5r3qNgB5v8",
      }),
    }

    const insights = buildAwardInsights(awards, period, () => 0)

    expect(insights.items[0]?.youtube).toBeNull()
  })

  it("mixes YouTube and non-YouTube awards when both exist", () => {
    const awards = {
      newer: makeAward("newer", "2025-06-01T12:00:00Z"),
      video: makeAward("video", "2025-01-01T12:00:00Z", {
        youtube: "abc123",
      }),
    }

    const insights = buildAwardInsights(awards, period, () => 0)

    expect(insights.count).toBe(2)
    const topTwo = insights.items.slice(0, 2)
    expect(topTwo.some((item) => item.youtube)).toBe(true)
    expect(topTwo.some((item) => !item.youtube)).toBe(true)
  })

  it("shuffles award order on each wrap", () => {
    const awards = [
      makeAward("a", "2025-01-01T12:00:00Z"),
      makeAward("b", "2025-02-01T12:00:00Z"),
      makeAward("c", "2025-03-01T12:00:00Z"),
    ]

    const alwaysFirst = shuffleAwardsForDisplay(awards, () => 0).map(
      (award) => award.award_id,
    )
    const alwaysLast = shuffleAwardsForDisplay(awards, () => 0.99).map(
      (award) => award.award_id,
    )

    expect(alwaysFirst).not.toEqual(alwaysLast)
    expect(new Set(alwaysFirst)).toEqual(new Set(["a", "b", "c"]))
  })

  it("includes all awards in items for slide pagination", () => {
    const awards = Object.fromEntries(
      Array.from({ length: 12 }, (_, index) => {
        const id = `award-${index}`
        return [id, makeAward(id, "2025-06-01T12:00:00Z")]
      }),
    )

    const insights = buildAwardInsights(awards, period, () => 0.5)

    expect(insights.count).toBe(12)
    expect(insights.items).toHaveLength(12)
  })
})

describe("resolveRhythmTitleKey", () => {
  const chrono = {
    archetypeKey: "afternoonOperator",
    archetype: "Afternoon Coder",
    nightSubmissions: 0,
    peakHour: 15,
    peakHourCount: 10,
    hours: [],
    narrative: "",
  } satisfies ChronoInsights

  it("prefers weekend warrior when most submissions land on Saturday and Sunday", () => {
    const weekday = {
      weekdays: [
        { key: "monday", label: "Monday", count: 5, percent: 10 },
        { key: "tuesday", label: "Tuesday", count: 5, percent: 10 },
        { key: "wednesday", label: "Wednesday", count: 5, percent: 10 },
        { key: "thursday", label: "Thursday", count: 5, percent: 10 },
        { key: "friday", label: "Friday", count: 5, percent: 10 },
        { key: "saturday", label: "Saturday", count: 12, percent: 24 },
        { key: "sunday", label: "Sunday", count: 13, percent: 26 },
      ],
      peak: { key: "sunday", label: "Sunday", count: 13, percent: 26 },
      quietest: { key: "monday", label: "Monday", count: 5, percent: 10 },
    } satisfies WeekdayInsights

    expect(resolveRhythmTitleKey(weekday, chrono)).toBe("weekendWarrior")
  })

  it("falls back to chrono archetype on weekday-heavy schedules", () => {
    const weekday = {
      weekdays: [
        { key: "monday", label: "Monday", count: 4, percent: 10 },
        { key: "tuesday", label: "Tuesday", count: 8, percent: 20 },
        { key: "wednesday", label: "Wednesday", count: 10, percent: 25 },
        { key: "thursday", label: "Thursday", count: 8, percent: 20 },
        { key: "friday", label: "Friday", count: 6, percent: 15 },
        { key: "saturday", label: "Saturday", count: 2, percent: 5 },
        { key: "sunday", label: "Sunday", count: 2, percent: 5 },
      ],
      peak: { key: "wednesday", label: "Wednesday", count: 10, percent: 25 },
      quietest: { key: "saturday", label: "Saturday", count: 2, percent: 5 },
    } satisfies WeekdayInsights

    expect(resolveRhythmTitleKey(weekday, chrono)).toBe("midweekMachine")
  })
})
