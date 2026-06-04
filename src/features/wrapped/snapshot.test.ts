import { describe, expect, it } from "vitest"
import type { JutgeApiClient, Submission } from "@/api/client"
import { buildWrappedInsights } from "./selectors"
import type { WrappedRawData } from "./types"
import {
  hasSubmissionHistory,
  hydrateSnapshot,
  resolveSnapshotSubmissions,
  serializeSnapshot,
  snapshotDownloadFilename,
} from "./snapshot"

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

const rawFixture = {
  profile: {
    email: "ada@example.com",
    username: "Ada Lovelace",
  },
  avatarUrl: null,
  dashboard: {
    stats: {
      number_of_submissions: 3,
      number_of_accepted_problems: 2,
      number_of_rejected_problems: 1,
    },
    heatmap: [],
    distributions: {
      verdicts: {},
      compilers: {},
      proglangs: {},
      submissions_by_hour: {},
      submissions_by_weekday: {},
    },
  },
  level: "P1",
  absoluteRanking: 42,
  homepageStats: {},
  hexColors: {},
  tables: {},
  period: {
    start: "2025-01-01",
    end: "2025-12-31",
    label: "2025",
  },
  submissions: [],
} as unknown as WrappedRawData

describe("snapshot helpers", () => {
  it("hydrates exported snapshots and fills the default all-time period", () => {
    const raw = hydrateSnapshot({
      profile: rawFixture.profile,
      dashboard: rawFixture.dashboard,
      level: rawFixture.level,
      absoluteRanking: rawFixture.absoluteRanking,
      homepageStats: rawFixture.homepageStats,
      hexColors: rawFixture.hexColors,
      tables: rawFixture.tables,
      submissions: rawFixture.submissions,
    })

    expect(raw.avatarUrl).toBeNull()
    expect(raw.period).toEqual({
      start: null,
      end: null,
      label: "All time",
    })
    expect(raw.submissions).toBeUndefined()
  })

  it("preserves in-app raw data snapshots", () => {
    const raw = hydrateSnapshot(rawFixture)

    expect(raw).toEqual({
      ...rawFixture,
      submissions: undefined,
    })
  })

  it("serializes wrapped data back to the export shape", () => {
    const serialized = serializeSnapshot(rawFixture)

    expect(serialized.profile).toEqual(rawFixture.profile)
    expect(serialized.dashboard).toEqual(rawFixture.dashboard)
    expect(serialized.period).toEqual(rawFixture.period)
    expect(serialized.submissions).toEqual(rawFixture.submissions)
    expect(serialized.avatar).toBeNull()
    expect(serialized.exportedAt).toEqual(expect.any(String))
  })

  it("builds a grind hero moment from hydrated snapshots with submissions", () => {
    const exported = {
      profile: rawFixture.profile,
      dashboard: rawFixture.dashboard,
      level: rawFixture.level,
      absoluteRanking: rawFixture.absoluteRanking,
      homepageStats: rawFixture.homepageStats,
      hexColors: rawFixture.hexColors,
      tables: rawFixture.tables,
      submissions: [
        makeSubmission("2025-01-01T10:00:00Z", { veredict: "WA" }),
        makeSubmission("2025-01-02T10:00:00Z", { veredict: "WA" }),
        makeSubmission("2025-01-03T10:00:00Z", { veredict: "AC" }),
      ],
    }

    const raw = hydrateSnapshot(exported)
    const hero = buildWrappedInsights(raw).personalized.heroMoment

    expect(hero).toMatchObject({
      kind: "grind",
      problemId: "X35277",
      attemptsBeforeAc: 2,
    })
  })

  it("detects when a snapshot includes submission history", () => {
    expect(hasSubmissionHistory(undefined)).toBe(false)
    expect(hasSubmissionHistory([])).toBe(false)
    expect(hasSubmissionHistory([makeSubmission("2025-01-01T10:00:00Z")])).toBe(
      true,
    )
  })

  it("falls back to the live API when legacy snapshots omit submissions", async () => {
    const fallback = [
      makeSubmission("2025-01-01T10:00:00Z", { veredict: "WA" }),
      makeSubmission("2025-01-02T10:00:00Z", { veredict: "WA" }),
      makeSubmission("2025-01-03T10:00:00Z", { veredict: "AC" }),
    ]
    const client = {
      meta: { token: "test-token" },
      student: {
        submissions: {
          getAll: async () => fallback,
        },
      },
    } as unknown as JutgeApiClient

    const resolved = await resolveSnapshotSubmissions(rawFixture, client)

    expect(resolved).toEqual(fallback)
  })

  it("keeps legacy snapshots offline when no client is available", async () => {
    const resolved = await resolveSnapshotSubmissions(rawFixture, null)

    expect(resolved).toBeUndefined()
  })

  it("normalizes legacy submission field names for hero insights", () => {
    const exported = {
      profile: rawFixture.profile,
      dashboard: rawFixture.dashboard,
      level: rawFixture.level,
      absoluteRanking: rawFixture.absoluteRanking,
      homepageStats: rawFixture.homepageStats,
      hexColors: rawFixture.hexColors,
      tables: rawFixture.tables,
      submissions: [
        {
          problemId: "X35277",
          submissionId: "sub-1",
          compilerId: "G++17",
          timeIn: "1735689600",
          verdict: "WA",
        },
        {
          problemId: "X35277",
          submissionId: "sub-2",
          compilerId: "G++17",
          timeIn: "1735776000",
          verdict: "WA",
        },
        {
          problemId: "X35277",
          submissionId: "sub-3",
          compilerId: "G++17",
          timeIn: "1735862400",
          verdict: "AC",
        },
      ],
    }

    const raw = hydrateSnapshot(exported)
    const hero = buildWrappedInsights(raw).personalized.heroMoment

    expect(hero).toMatchObject({
      kind: "grind",
      problemId: "X35277",
      attemptsBeforeAc: 2,
    })
  })

  it("builds a safe download filename from profile and period", () => {
    expect(snapshotDownloadFilename(rawFixture)).toBe(
      "jutge-wrapped-Ada-Lovelace-2025-01-01_2025-12-31.json",
    )
  })

  it("rejects invalid snapshot payloads with a clear error", () => {
    expect(() => hydrateSnapshot({ hello: "world" })).toThrow(
      "Invalid snapshot: missing profile or dashboard. Use a file from npm run export:snapshot.",
    )
  })
})
