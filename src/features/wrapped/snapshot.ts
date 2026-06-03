import type {
  AllTables,
  ColorMapping,
  Dashboard,
  HomepageStats,
  Profile,
  Submission,
} from "@/api/client"
import type { WrappedPeriod } from "./period"
import type { WrappedRawData } from "./types"

/** Shape written by `npm run export:snapshot`. */
export type ExportedJutgeSnapshot = {
  exportedAt?: string
  credentials?: { user_uid: string; expiration: string | number }
  profile: Profile
  avatar?: { mimeType: string; name?: string; base64: string } | null
  dashboard: Dashboard
  level: string
  absoluteRanking: number
  homepageStats: HomepageStats
  hexColors: ColorMapping
  tables: AllTables
  period?: WrappedPeriod
  submissions?: Submission[]
}

const DEFAULT_PERIOD: WrappedPeriod = {
  start: null,
  end: null,
  label: "All time",
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid snapshot: expected ${label} to be an object.`)
  }
  return value as Record<string, unknown>
}

function isWrappedRawData(value: unknown): value is WrappedRawData {
  const o = assertRecord(value, "root")
  return (
    typeof o.profile === "object" &&
    typeof o.dashboard === "object" &&
    typeof o.level === "string" &&
    typeof o.absoluteRanking === "number" &&
    typeof o.homepageStats === "object" &&
    typeof o.hexColors === "object" &&
    typeof o.tables === "object" &&
    typeof o.period === "object"
  )
}

function avatarFromExport(avatar: ExportedJutgeSnapshot["avatar"]): string | null {
  if (!avatar?.base64) return null
  const binary = atob(avatar.base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: avatar.mimeType || "image/png" })
  return URL.createObjectURL(blob)
}

/** Turn exported API JSON (or in-app raw data) into `WrappedRawData`. */
export function hydrateSnapshot(json: unknown): WrappedRawData {
  if (isWrappedRawData(json)) {
    return {
      ...json,
      avatarUrl: json.avatarUrl ?? null,
      period: json.period ?? DEFAULT_PERIOD,
    }
  }

  const snap = assertRecord(json, "root") as unknown as ExportedJutgeSnapshot
  if (!snap.profile || !snap.dashboard) {
    throw new Error(
      "Invalid snapshot: missing profile or dashboard. Use a file from npm run export:snapshot.",
    )
  }

  return {
    profile: snap.profile,
    avatarUrl: avatarFromExport(snap.avatar ?? null),
    dashboard: snap.dashboard,
    level: snap.level ?? "",
    absoluteRanking: snap.absoluteRanking ?? 0,
    homepageStats: snap.homepageStats ?? ({} as HomepageStats),
    hexColors: snap.hexColors ?? ({} as ColorMapping),
    tables: snap.tables ?? ({} as AllTables),
    period: snap.period ?? DEFAULT_PERIOD,
    submissions: snap.submissions,
  }
}
