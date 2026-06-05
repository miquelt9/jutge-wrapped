import type {
  AllTables,
  Award,
  ColorMapping,
  Dashboard,
  HomepageStats,
  JutgeApiClient,
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
  problemTitles?: Record<string, string>
  awards?: Record<string, Award>
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

function avatarFromExport(
  avatar: ExportedJutgeSnapshot["avatar"],
): string | null {
  if (!avatar?.base64) return null
  const binary = atob(avatar.base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: avatar.mimeType || "image/png" })
  return URL.createObjectURL(blob)
}

function normalizeSubmission(raw: unknown): Submission | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const problemId = o.problem_id ?? o.problemId
  if (typeof problemId !== "string" || !problemId) return null

  const timeIn = o.time_in ?? o.timeIn ?? o.time
  if (timeIn === undefined || timeIn === null || timeIn === "") return null

  const veredictRaw = o.veredict ?? o.verdict
  const veredict =
    typeof veredictRaw === "string" ? veredictRaw : (veredictRaw ?? null)

  return {
    problem_id: problemId,
    submission_id: String(
      o.submission_id ?? o.submissionId ?? `${problemId}-${String(timeIn)}`,
    ),
    compiler_id: String(o.compiler_id ?? o.compilerId ?? ""),
    annotation: typeof o.annotation === "string" ? o.annotation : null,
    state: typeof o.state === "string" ? o.state : "done",
    time_in: timeIn as Submission["time_in"],
    veredict: typeof veredict === "string" ? veredict : null,
    veredict_info:
      typeof o.veredict_info === "string"
        ? o.veredict_info
        : typeof o.verdict_info === "string"
          ? o.verdict_info
          : null,
    veredict_publics:
      typeof o.veredict_publics === "string" ? o.veredict_publics : null,
    ok_publics_but_wrong: Number(o.ok_publics_but_wrong ?? 0),
  }
}

/** Coerce snapshot/API submission records into the shape hero-moment logic expects. */
export function normalizeSubmissions(
  submissions: unknown,
): Submission[] | undefined {
  if (!Array.isArray(submissions)) return undefined
  const normalized = submissions
    .map(normalizeSubmission)
    .filter((sub): sub is Submission => sub !== null)
  return normalized.length > 0 ? normalized : undefined
}

export function hasSubmissionHistory(
  submissions: Submission[] | undefined,
): boolean {
  return Boolean(submissions?.length)
}

/**
 * Hero-moment insights (e.g. grind headline) need per-submission history.
 * Legacy snapshots may omit `submissions`; when a live client is available,
 * fetch the list as a fallback before building insights.
 */
export async function resolveSnapshotSubmissions(
  snapshot: WrappedRawData,
  client: JutgeApiClient | null,
): Promise<Submission[] | undefined> {
  const embedded = normalizeSubmissions(snapshot.submissions)
  if (hasSubmissionHistory(embedded)) {
    return embedded
  }
  if (!client?.meta?.token) {
    return embedded
  }
  try {
    const all = normalizeSubmissions(
      await client.student.submissions.getAll(),
    )
    return hasSubmissionHistory(all) ? all : embedded
  } catch {
    return embedded
  }
}

/** Turn exported API JSON (or in-app raw data) into `WrappedRawData`. */
export function hydrateSnapshot(json: unknown): WrappedRawData {
  if (isWrappedRawData(json)) {
    return {
      ...json,
      avatarUrl: json.avatarUrl ?? null,
      period: json.period ?? DEFAULT_PERIOD,
      submissions: normalizeSubmissions(json.submissions),
      problemTitles: json.problemTitles,
      awards: json.awards,
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
    submissions: normalizeSubmissions(snap.submissions),
    problemTitles: snap.problemTitles,
    awards: snap.awards,
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

async function avatarUrlToExport(
  avatarUrl: string | null,
): Promise<ExportedJutgeSnapshot["avatar"]> {
  if (!avatarUrl) return null
  const res = await fetch(avatarUrl)
  const blob = await res.blob()
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return {
    mimeType: blob.type || "image/png",
    base64: uint8ArrayToBase64(bytes),
  }
}

/** Serialize in-app data to the export file shape. */
export function serializeSnapshot(
  raw: WrappedRawData,
  avatar: ExportedJutgeSnapshot["avatar"] = null,
): ExportedJutgeSnapshot {
  return {
    exportedAt: new Date().toISOString(),
    profile: raw.profile,
    avatar,
    dashboard: raw.dashboard,
    level: raw.level,
    absoluteRanking: raw.absoluteRanking,
    homepageStats: raw.homepageStats,
    hexColors: raw.hexColors,
    tables: raw.tables,
    period: raw.period,
    submissions: raw.submissions,
    problemTitles: raw.problemTitles,
    awards: raw.awards,
  }
}

export function snapshotDownloadFilename(raw: WrappedRawData): string {
  const user = raw.profile.username ?? raw.profile.email.split("@")[0] ?? "user"
  const safeUser = user
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  const periodPart =
    raw.period.start && raw.period.end
      ? `${raw.period.start}_${raw.period.end}`
      : "all-time"
  return `jutge-wrapped-${safeUser || "user"}-${periodPart}.json`
}

export async function downloadSnapshotJson(raw: WrappedRawData): Promise<void> {
  const avatar = await avatarUrlToExport(raw.avatarUrl)
  const payload = serializeSnapshot(raw, avatar)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = snapshotDownloadFilename(raw)
  anchor.click()
  URL.revokeObjectURL(url)
}
