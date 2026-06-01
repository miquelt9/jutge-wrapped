import type { AllTables, Dashboard, HeatmapCalendar, Submission } from "@/api/client"

export type WrappedPeriod = {
  /** Inclusive ISO date `YYYY-MM-DD`, or null for no lower bound */
  start: string | null
  /** Inclusive ISO date `YYYY-MM-DD`, or null for no upper bound */
  end: string | null
  label: string
}

export function isAllTimePeriod(period: WrappedPeriod): boolean {
  return period.start === null && period.end === null
}

export function parseSubmissionTime(timeIn: Submission["time_in"]): Date {
  if (typeof timeIn === "number") {
    return new Date(timeIn > 1e12 ? timeIn : timeIn * 1000)
  }
  return new Date(timeIn as string)
}

function startOfDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number)
  return new Date(y!, m! - 1, d!, 0, 0, 0, 0)
}

function endOfDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number)
  return new Date(y!, m! - 1, d!, 23, 59, 59, 999)
}

export function submissionInPeriod(
  submission: Submission,
  period: WrappedPeriod,
): boolean {
  if (isAllTimePeriod(period)) return true
  const t = parseSubmissionTime(submission.time_in)
  if (period.start && t < startOfDay(period.start)) return false
  if (period.end && t > endOfDay(period.end)) return false
  return true
}

function utcDayTimestamp(d: Date): number {
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000,
  )
}

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

export function aggregateDashboardFromSubmissions(
  submissions: Submission[],
  tables: AllTables,
): Dashboard {
  const heatmapMap = new Map<number, number>()
  const verdicts: Record<string, number> = {}
  const compilers: Record<string, number> = {}
  const proglangs: Record<string, number> = {}
  const submissionsByHour: Record<string, number> = {}
  const submissionsByWeekday: Record<string, number> = {}

  for (let h = 0; h < 24; h++) {
    submissionsByHour[String(h).padStart(2, "0")] = 0
  }
  for (const key of WEEKDAY_KEYS) {
    submissionsByWeekday[key] = 0
  }

  const problemsAttempted = new Set<string>()
  const problemsWithAc = new Set<string>()

  for (const sub of submissions) {
    const t = parseSubmissionTime(sub.time_in)
    const dayTs = utcDayTimestamp(t)
    heatmapMap.set(dayTs, (heatmapMap.get(dayTs) ?? 0) + 1)

    const verdict = sub.veredict ?? "?"
    verdicts[verdict] = (verdicts[verdict] ?? 0) + 1

    const compilerId = sub.compiler_id
    compilers[compilerId] = (compilers[compilerId] ?? 0) + 1

    const lang =
      tables.compilers[compilerId]?.language ??
      tables.compilers[compilerId]?.name ??
      compilerId
    proglangs[lang] = (proglangs[lang] ?? 0) + 1

    const hourKey = String(t.getHours()).padStart(2, "0")
    submissionsByHour[hourKey] = (submissionsByHour[hourKey] ?? 0) + 1

    const weekdayKey = WEEKDAY_KEYS[t.getDay()]!
    submissionsByWeekday[weekdayKey] = (submissionsByWeekday[weekdayKey] ?? 0) + 1

    problemsAttempted.add(sub.problem_id)
    if (sub.veredict === "AC") problemsWithAc.add(sub.problem_id)
  }

  const heatmap: HeatmapCalendar = [...heatmapMap.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date - b.date)

  return {
    stats: {
      number_of_submissions: submissions.length,
      number_of_accepted_problems: problemsWithAc.size,
      number_of_rejected_problems: [...problemsAttempted].filter(
        (p) => !problemsWithAc.has(p),
      ).length,
    },
    heatmap,
    distributions: {
      verdicts,
      compilers,
      proglangs,
      submissions_by_hour: submissionsByHour,
      submissions_by_weekday: submissionsByWeekday,
    },
  }
}

export function heatmapBounds(heatmap: HeatmapCalendar): {
  min: string
  max: string
} | null {
  if (heatmap.length === 0) return null
  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  const toIso = (ts: number) => {
    const d = new Date(ts > 1e12 ? ts : ts * 1000)
    return d.toISOString().slice(0, 10)
  }
  return { min: toIso(sorted[0]!.date), max: toIso(sorted[sorted.length - 1]!.date) }
}

export function formatPeriodLabel(period: WrappedPeriod): string {
  if (isAllTimePeriod(period)) return "All time"
  if (period.start && period.end) return `${period.start} – ${period.end}`
  if (period.start) return `From ${period.start}`
  if (period.end) return `Until ${period.end}`
  return period.label
}
