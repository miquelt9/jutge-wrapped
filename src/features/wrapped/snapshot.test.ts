import { describe, expect, it } from "vitest"
import type { WrappedRawData } from "./types"
import {
  hydrateSnapshot,
  serializeSnapshot,
  snapshotDownloadFilename,
} from "./snapshot"

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
    expect(raw.submissions).toEqual([])
  })

  it("preserves in-app raw data snapshots", () => {
    const raw = hydrateSnapshot(rawFixture)

    expect(raw).toEqual(rawFixture)
  })

  it("serializes wrapped data back to the export shape", () => {
    const serialized = serializeSnapshot(rawFixture)

    expect(serialized.profile).toEqual(rawFixture.profile)
    expect(serialized.dashboard).toEqual(rawFixture.dashboard)
    expect(serialized.period).toEqual(rawFixture.period)
    expect(serialized.avatar).toBeNull()
    expect(serialized.exportedAt).toEqual(expect.any(String))
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
