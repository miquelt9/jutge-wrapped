import type {
  AllTables,
  Award,
  Dashboard,
  HeatmapCalendar,
  Submission,
} from "@/api/client"
import i18n from "@/i18n/config"

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

/** UTC midnight for an inclusive ISO calendar day (`YYYY-MM-DD`). */
export function utcDayTsFromIso(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number)
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 1000)
}

export function heatmapCellInPeriod(
  cell: { date: number },
  period: WrappedPeriod,
): boolean {
  if (isAllTimePeriod(period)) return true
  const dayTs = cell.date > 1e12 ? Math.floor(cell.date / 1000) : cell.date
  if (period.start && dayTs < utcDayTsFromIso(period.start)) return false
  if (period.end && dayTs > utcDayTsFromIso(period.end)) return false
  return true
}

/** Filter an all-time dashboard heatmap to a period (distributions stay all-time). */
export function filterDashboardByPeriod(
  dashboard: Dashboard,
  period: WrappedPeriod,
): Dashboard {
  if (isAllTimePeriod(period)) return dashboard

  const heatmap = dashboard.heatmap.filter((c) =>
    heatmapCellInPeriod(c, period),
  )
  const totalSubmissions = heatmap.reduce((sum, c) => sum + c.value, 0)

  return {
    ...dashboard,
    heatmap,
    stats: {
      ...dashboard.stats,
      number_of_submissions: totalSubmissions,
    },
  }
}

export function isValidDateRange(start: string, end: string): boolean {
  return start <= end
}

export function isValidBoundedPeriod(period: WrappedPeriod): boolean {
  if (isAllTimePeriod(period)) return true
  if (period.start && period.end)
    return isValidDateRange(period.start, period.end)
  return true
}

export function countHeatmapSubmissionsInPeriod(
  heatmap: HeatmapCalendar,
  period: WrappedPeriod,
): number {
  return heatmap
    .filter((cell) => heatmapCellInPeriod(cell, period))
    .reduce((sum, cell) => sum + cell.value, 0)
}

export function clipPeriodPreset(
  start: string,
  end: string,
  bounds: { min: string; max: string },
  label: string,
): WrappedPeriod | null {
  const clipped = clipPeriodToBounds(start, end, bounds)
  if (!isValidDateRange(clipped.start, clipped.end)) return null
  return { start: clipped.start, end: clipped.end, label }
}

export function dashboardForWrappedPeriod(
  source: {
    dashboard: Dashboard
    submissions?: Submission[]
    tables: AllTables
  },
  period: WrappedPeriod,
): Dashboard {
  if (isAllTimePeriod(period)) return source.dashboard

  if (source.submissions && source.submissions.length > 0) {
    const filtered = source.submissions.filter((s) =>
      submissionInPeriod(s, period),
    )
    if (filtered.length > 0) {
      return aggregateDashboardFromSubmissions(filtered, source.tables)
    }
    if (countHeatmapSubmissionsInPeriod(source.dashboard.heatmap, period) > 0) {
      return filterDashboardByPeriod(source.dashboard, period)
    }
    return aggregateDashboardFromSubmissions(filtered, source.tables)
  }

  return filterDashboardByPeriod(source.dashboard, period)
}

export function parseSubmissionTime(timeIn: Submission["time_in"]): Date {
  if (typeof timeIn === "number") {
    return new Date(timeIn > 1e12 ? timeIn : timeIn * 1000)
  }
  if (typeof timeIn === "string" && /^\d+(\.\d+)?$/.test(timeIn.trim())) {
    const n = Number(timeIn)
    return new Date(n > 1e12 ? n : n * 1000)
  }
  return new Date(timeIn as string)
}

/** Submissions scoped to the active wrapped period (all-time returns the full list). */
export function submissionsForWrappedPeriod(
  submissions: Submission[] | undefined,
  period: WrappedPeriod,
): Submission[] | undefined {
  if (!submissions?.length) return undefined
  if (isAllTimePeriod(period)) return submissions
  const filtered = submissions.filter((s) => submissionInPeriod(s, period))
  return filtered.length > 0 ? filtered : undefined
}

function utcDayTimestamp(d: Date): number {
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000,
  )
}

export function submissionInPeriod(
  submission: Submission,
  period: WrappedPeriod,
): boolean {
  if (isAllTimePeriod(period)) return true
  const dayTs = utcDayTimestamp(parseSubmissionTime(submission.time_in))
  if (period.start && dayTs < utcDayTsFromIso(period.start)) return false
  if (period.end && dayTs > utcDayTsFromIso(period.end)) return false
  return true
}

export function awardInPeriod(
  award: Award,
  period: WrappedPeriod,
): boolean {
  if (isAllTimePeriod(period)) return true
  const dayTs = utcDayTimestamp(parseSubmissionTime(award.time))
  if (period.start && dayTs < utcDayTsFromIso(period.start)) return false
  if (period.end && dayTs > utcDayTsFromIso(period.end)) return false
  return true
}

/** Awards scoped to the active wrapped period (all-time returns the full dict). */
export function awardsForWrappedPeriod(
  awards: Record<string, Award> | undefined,
  period: WrappedPeriod,
): Record<string, Award> | undefined {
  if (!awards || Object.keys(awards).length === 0) return undefined
  if (isAllTimePeriod(period)) return awards
  const filtered = Object.fromEntries(
    Object.entries(awards).filter(([, award]) => awardInPeriod(award, period)),
  )
  return Object.keys(filtered).length > 0 ? filtered : undefined
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
    submissionsByWeekday[weekdayKey] =
      (submissionsByWeekday[weekdayKey] ?? 0) + 1

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

/** September 1 through July 31 (inclusive) for the current academic year. */
export function getCurrentAcademicYearRange(now = new Date()): {
  start: string
  end: string
  label: string
} {
  const year = now.getFullYear()
  const month = now.getMonth()
  const startYear = month >= 8 ? year : year - 1
  const endYear = startYear + 1
  const start = `${startYear}-09-01`
  const end = `${endYear}-07-31`
  const label = i18n.t("period.academicYear", {
    startYear,
    endYearShort: String(endYear).slice(-2),
  })
  return { start, end, label }
}

export function clipPeriodToBounds(
  start: string,
  end: string,
  bounds: { min: string; max: string },
): { start: string; end: string } {
  return {
    start: start > bounds.min ? start : bounds.min,
    end: end < bounds.max ? end : bounds.max,
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
  return {
    min: toIso(sorted[0]!.date),
    max: toIso(sorted[sorted.length - 1]!.date),
  }
}

export function formatPeriodLabel(period: WrappedPeriod): string {
  if (isAllTimePeriod(period)) return i18n.t("period.allTime")
  if (period.start && period.end) return `${period.start} – ${period.end}`
  if (period.start) return i18n.t("period.from", { date: period.start })
  if (period.end) return i18n.t("period.until", { date: period.end })
  return period.label
}
