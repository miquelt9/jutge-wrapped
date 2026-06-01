import type { AllTables, ColorMapping, Dashboard, HeatmapCalendar, HomepageStats } from "@/api/client"
import { formatPeriodLabel } from "./period"
import { compilerColor } from "@/theme/jutgeColors"
import type {
  ChronoInsights,
  CourseArcInsights,
  DistributionItem,
  HeatmapInsights,
  HeatmapMonthCell,
  JourneyInsights,
  RankInsights,
  VerdictInsights,
  WeekdayInsights,
  WrappedInsights,
  WrappedRawData,
} from "./types"

const DAY_SECONDS = 86_400

/** Beyond this span, the weekly GitHub grid becomes unreadable — use monthly bars. */
export const WEEK_MODE_MAX_WEEKS = 26
const COURSE_COMPILERS = new Set(["P1++", "PRO2", "MakePRO2"])

export const WEEKDAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

function heatmapTimestampToMs(ts: number): number {
  return ts > 1e12 ? ts : ts * 1000
}

function formatDate(ts: number): string {
  return new Date(heatmapTimestampToMs(ts)).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function labelForKey(key: string, tables?: AllTables): string {
  if (tables?.compilers[key]) return tables.compilers[key].name
  if (tables?.verdicts[key]) return tables.verdicts[key].name
  if (tables?.proglangs[key]) return key
  return key.replace(/_/g, " ")
}

function colorForKey(
  key: string,
  hexColors: ColorMapping,
  category: "verdicts" | "compilers" | "proglangs",
): string | undefined {
  return hexColors[category]?.[key]
}

export function distributionToItems(
  dist: Record<string, number>,
  tables: AllTables | undefined,
  hexColors: ColorMapping,
  category: "verdicts" | "compilers" | "proglangs",
): DistributionItem[] {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  return Object.entries(dist)
    .map(([key, count]) => {
      const apiColor = colorForKey(key, hexColors, category)
      return {
        key,
        label: labelForKey(key, tables),
        count,
        percent: Math.round((count / total) * 1000) / 10,
        color:
          category === "compilers"
            ? compilerColor(key, apiColor)
            : apiColor,
        emoji: tables?.verdicts[key]?.emoji,
        description: tables?.verdicts[key]?.description,
      }
    })
    .sort((a, b) => b.count - a.count)
}

function formatMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month, 1))
  const mon = d.toLocaleDateString(undefined, { month: "short" })
  const yr = String(year).slice(-2)
  return `${mon} '${yr}`
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

function heatmapSpanWeeks(heatmap: HeatmapCalendar): number {
  if (heatmap.length === 0) return 0
  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  const minTs = sorted[0]!.date
  const maxTs = sorted[sorted.length - 1]!.date
  return Math.floor((maxTs - minTs) / (7 * DAY_SECONDS)) + 1
}

function buildWeekMonthLabels(minTs: number, weekCount: number): (string | null)[] {
  const labels: (string | null)[] = []
  let prevMonth: number | null = null
  for (let w = 0; w < weekCount; w++) {
    const weekStartTs = minTs + w * 7 * DAY_SECONDS
    const d = new Date(heatmapTimestampToMs(weekStartTs))
    const month = d.getUTCMonth()
    if (month !== prevMonth) {
      labels.push(d.toLocaleDateString(undefined, { month: "short" }))
      prevMonth = month
    } else {
      labels.push(null)
    }
  }
  return labels
}

function buildMonthlyBars(heatmap: HeatmapCalendar): {
  monthlyBars: HeatmapMonthCell[]
  maxMonthValue: number
  peakMonth: HeatmapInsights["peakMonth"]
} {
  if (heatmap.length === 0) {
    return { monthlyBars: [], maxMonthValue: 0, peakMonth: null }
  }

  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  const minCell = sorted[0]!
  const maxCell = sorted[sorted.length - 1]!
  const minDate = new Date(heatmapTimestampToMs(minCell.date))
  const maxDate = new Date(heatmapTimestampToMs(maxCell.date))

  const valueByMonth = new Map<string, number>()
  for (const c of heatmap) {
    const d = new Date(heatmapTimestampToMs(c.date))
    const key = monthKey(d.getUTCFullYear(), d.getUTCMonth())
    valueByMonth.set(key, (valueByMonth.get(key) ?? 0) + c.value)
  }

  const monthlyBars: HeatmapMonthCell[] = []
  let year = minDate.getUTCFullYear()
  let month = minDate.getUTCMonth()
  const endYear = maxDate.getUTCFullYear()
  const endMonth = maxDate.getUTCMonth()

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = monthKey(year, month)
    const total = valueByMonth.get(key) ?? 0
    monthlyBars.push({
      year,
      month,
      label: formatMonthLabel(year, month),
      total,
    })
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
  }

  const maxMonthValue = Math.max(...monthlyBars.map((b) => b.total), 0)
  let peakMonth: HeatmapInsights["peakMonth"] = null
  for (const bar of monthlyBars) {
    if (bar.total > 0 && (!peakMonth || bar.total > peakMonth.total)) {
      peakMonth = { monthLabel: bar.label, total: bar.total }
    }
  }

  return { monthlyBars, maxMonthValue, peakMonth }
}

function buildCalendarGrid(heatmap: HeatmapCalendar): {
  calendarGrid: number[][]
  calendarLabels: (string | null)[][]
  weekCount: number
  maxCellValue: number
  minTs: number
} {
  if (heatmap.length === 0) {
    return {
      calendarGrid: [],
      calendarLabels: [],
      weekCount: 0,
      maxCellValue: 0,
      minTs: 0,
    }
  }

  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  const minTs = sorted[0]!.date
  const maxTs = sorted[sorted.length - 1]!.date
  const valueByDay = new Map(sorted.map((c) => [c.date, c.value]))
  const weekCount = Math.floor((maxTs - minTs) / (7 * DAY_SECONDS)) + 1

  const calendarGrid: number[][] = Array.from({ length: 7 }, () => Array(weekCount).fill(0))
  const calendarLabels: (string | null)[][] = Array.from({ length: 7 }, () =>
    Array(weekCount).fill(null),
  )
  let maxCellValue = 0

  for (let ts = minTs; ts <= maxTs; ts += DAY_SECONDS) {
    const weekIndex = Math.floor((ts - minTs) / (7 * DAY_SECONDS))
    const dow = new Date(heatmapTimestampToMs(ts)).getUTCDay()
    const value = valueByDay.get(ts) ?? 0
    maxCellValue = Math.max(maxCellValue, value)
    calendarGrid[dow]![weekIndex] = value
    if (value > 0) calendarLabels[dow]![weekIndex] = formatDate(ts)
  }

  return { calendarGrid, calendarLabels, weekCount, maxCellValue, minTs }
}

export function buildHeatmapInsights(dashboard: Dashboard): HeatmapInsights {
  const activeDays = dashboard.heatmap.filter((c) => c.value > 0)
  const sorted = [...activeDays].sort((a, b) => a.date - b.date)

  let longestStreak = 0
  let current = 0
  let prevTs: number | null = null

  for (const day of sorted) {
    if (prevTs !== null && day.date === prevTs + DAY_SECONDS) current += 1
    else current = 1
    longestStreak = Math.max(longestStreak, current)
    prevTs = day.date
  }

  const peakCell = activeDays.reduce(
    (best, c) => (c.value > (best?.value ?? 0) ? c : best),
    null as (typeof activeDays)[0] | null,
  )

  const minTs = sorted[0]?.date ?? dashboard.heatmap[0]?.date ?? 0
  const weekTotals = new Map<number, number>()
  for (const c of dashboard.heatmap) {
    const weekIndex = Math.floor((c.date - minTs) / (7 * DAY_SECONDS))
    weekTotals.set(weekIndex, (weekTotals.get(weekIndex) ?? 0) + c.value)
  }

  let peakWeek: HeatmapInsights["peakWeek"] = null
  for (const [weekIndex, total] of weekTotals) {
    if (total <= 0) continue
    if (!peakWeek || total > peakWeek.total) {
      const weekStart = minTs + weekIndex * 7 * DAY_SECONDS
      const weekEnd = weekStart + 6 * DAY_SECONDS
      peakWeek = {
        weekLabel: `${formatDate(weekStart)} – ${formatDate(weekEnd)}`,
        total,
      }
    }
  }

  const spanWeeks = heatmapSpanWeeks(dashboard.heatmap)
  const calendarMode: HeatmapInsights["calendarMode"] =
    spanWeeks > WEEK_MODE_MAX_WEEKS ? "month" : "week"
  const totalSubmissions = dashboard.heatmap.reduce((s, c) => s + c.value, 0)

  const base = {
    calendarMode,
    longestStreak,
    peakDay: peakCell
      ? { date: formatDate(peakCell.date), count: peakCell.value, timestamp: peakCell.date }
      : null,
    peakWeek,
    totalActiveDays: activeDays.length,
    totalSubmissions,
  }

  if (calendarMode === "month") {
    const { monthlyBars, maxMonthValue, peakMonth } = buildMonthlyBars(dashboard.heatmap)
    return {
      ...base,
      peakMonth,
      calendarGrid: [],
      calendarLabels: [],
      weekMonthLabels: [],
      weekCount: 0,
      maxCellValue: 0,
      monthlyBars,
      maxMonthValue,
    }
  }

  const { calendarGrid, calendarLabels, weekCount, maxCellValue, minTs: gridMinTs } =
    buildCalendarGrid(dashboard.heatmap)
  const weekMonthLabels = buildWeekMonthLabels(gridMinTs, weekCount)

  return {
    ...base,
    peakMonth: null,
    calendarGrid,
    calendarLabels,
    weekMonthLabels,
    weekCount,
    maxCellValue,
    monthlyBars: [],
    maxMonthValue: 0,
  }
}

export function buildJourneyInsights(dashboard: Dashboard): JourneyInsights {
  const { stats, heatmap } = dashboard
  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const accepted = stats.number_of_accepted_problems ?? 0
  const rejected = stats.number_of_rejected_problems ?? 0
  const denom = accepted + rejected || 1

  return {
    acceptedProblems: accepted,
    rejectedProblems: rejected,
    totalSubmissions: stats.number_of_submissions ?? 0,
    problemSuccessRate: Math.round((accepted / denom) * 1000) / 10,
    firstActive: first ? formatDate(first.date) : null,
    lastActive: last ? formatDate(last.date) : null,
    spanLabel:
      first && last ? `${formatDate(first.date)} – ${formatDate(last.date)}` : "All-time",
  }
}

export function buildWeekdayInsights(dashboard: Dashboard): WeekdayInsights {
  const dist = dashboard.distributions.submissions_by_weekday
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const weekdays = WEEKDAY_ORDER.map((key) => ({
    key,
    label: WEEKDAY_LABELS[key] ?? key,
    count: dist[key] ?? 0,
    percent: Math.round(((dist[key] ?? 0) / total) * 1000) / 10,
  }))
  const byCount = [...weekdays].sort((a, b) => b.count - a.count)

  return {
    weekdays,
    peak: byCount[0] ?? null,
    quietest: byCount[byCount.length - 1] ?? null,
  }
}

function countForHour(raw: Record<string, number>, hour: number): number {
  const padded = String(hour).padStart(2, "0")
  return raw[padded] ?? raw[String(hour)] ?? raw[`${hour}:00`] ?? 0
}

export function buildChronoInsights(dashboard: Dashboard): ChronoInsights {
  const raw = dashboard.distributions.submissions_by_hour
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: countForHour(raw, hour),
  }))

  const nightSubmissions = hours
    .filter((h) => h.hour >= 0 && h.hour <= 4)
    .reduce((s, h) => s + h.count, 0)

  const morning = hours.filter((h) => h.hour >= 5 && h.hour < 12).reduce((s, h) => s + h.count, 0)
  const afternoon = hours.filter((h) => h.hour >= 12 && h.hour < 18).reduce((s, h) => s + h.count, 0)
  const evening = hours.filter((h) => h.hour >= 18 && h.hour <= 23).reduce((s, h) => s + h.count, 0)

  let archetype = "Balanced Grinder"
  const maxBucket = Math.max(morning, afternoon, evening, nightSubmissions)
  if (nightSubmissions === maxBucket && nightSubmissions > 50) archetype = "Night Owl"
  else if (morning === maxBucket) archetype = "Early Riser"
  else if (evening === maxBucket) archetype = "Evening Coder"
  else if (afternoon === maxBucket) archetype = "Afternoon Operator"

  const peak = hours.reduce(
    (best, h) => (h.count > best.count ? h : best),
    { hour: 0, count: 0 },
  )

  const subsTotal = dashboard.stats.number_of_submissions || 1
  const narrative =
    nightSubmissions < subsTotal * 0.05
      ? `You peak around ${String(peak.hour).padStart(2, "0")}:00 — a ${archetype.toLowerCase()} on campus time.`
      : `${nightSubmissions} submissions landed between midnight and 5 AM.`

  return {
    archetype,
    nightSubmissions,
    peakHour: peak.hour,
    peakHourCount: peak.count,
    hours,
    narrative,
  }
}

export function buildCourseArcInsights(
  dashboard: Dashboard,
  tables: AllTables,
  hexColors: ColorMapping,
): CourseArcInsights {
  const compilers = distributionToItems(
    dashboard.distributions.compilers,
    tables,
    hexColors,
    "compilers",
  )
  const proglangs = distributionToItems(
    dashboard.distributions.proglangs,
    tables,
    hexColors,
    "proglangs",
  )

  const total = compilers.reduce((s, c) => s + c.count, 0) || 1
  const courseCompilerCount = compilers
    .filter((c) => COURSE_COMPILERS.has(c.key))
    .reduce((s, c) => s + c.count, 0)

  const otherLanguages = proglangs.filter((p) => p.key !== proglangs[0]?.key).slice(0, 3)
  const courseCompilerShare = Math.round((courseCompilerCount / total) * 1000) / 10
  const topProglang = proglangs[0] ?? null
  const topCompiler = compilers[0] ?? null

  const { title, subtitle } = buildCourseArcCopy(
    courseCompilerShare,
    topProglang,
    topCompiler,
  )

  return {
    courseCompilerShare,
    courseCompilerCount,
    topProglang,
    topCompiler,
    otherLanguages,
    title,
    subtitle,
  }
}

function buildCourseArcCopy(
  courseShare: number,
  topProglang: DistributionItem | null,
  topCompiler: DistributionItem | null,
): { title: string; subtitle: string } {
  const lang = topProglang?.label ?? "your go-to language"
  const compiler = topCompiler?.label ?? "your top compiler"

  if (courseShare >= 50) {
    return {
      title: "Mostly campus coursework",
      subtitle: `${courseShare}% of runs used the classic UPC compilers (P1++, PRO2…) · ${lang} was your main language`,
    }
  }

  return {
    title: "Your compiler mix",
    subtitle: `Led by ${compiler} · ${lang} (${topProglang?.percent ?? 0}% of runs)`,
  }
}

function buildVerdictNarrative(
  ac: number,
  wa: number,
  ce: number,
  ee: number,
  sc: number,
  pe: number,
  total: number,
): string {
  const friction = [
    { key: "WA", count: wa, label: "wrong answers" },
    { key: "CE", count: ce, label: "compilation errors" },
    { key: "EE", count: ee, label: "execution errors" },
    { key: "SC", count: sc, label: "scored attempts" },
    { key: "PE", count: pe, label: "presentation errors" },
  ].sort((a, b) => b.count - a.count)

  const top = friction[0]
  if (!top || top.count === 0) {
    return `You logged ${ac} fully accepted runs out of ${total} judged submissions.`
  }
  return `Across ${total} judged runs, you earned ${ac} AC verdicts while battling ${top.count} ${top.label} along the way.`
}

export function buildVerdictInsights(
  dashboard: Dashboard,
  tables: AllTables,
  hexColors: ColorMapping,
): VerdictInsights {
  const dist = dashboard.distributions.verdicts
  const items = distributionToItems(dist, tables, hexColors, "verdicts")

  const ac = dist.AC ?? 0
  const pe = dist.PE ?? 0
  const wa = dist.WA ?? 0
  const ce = dist.CE ?? 0
  const ee = dist.EE ?? 0
  const sc = dist.SC ?? 0
  const known = ac + pe + wa + ce + ee + sc
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const other = total - known

  return {
    ac,
    pe,
    wa,
    ce,
    ee,
    sc,
    other,
    total,
    acRate: Math.round((ac / total) * 1000) / 10,
    narrative: buildVerdictNarrative(ac, wa, ce, ee, sc, pe, total),
    items,
  }
}

export function buildRankInsights(rank: number, homepage: HomepageStats): RankInsights {
  const platformUserCount = homepage.users || 1
  const usersAhead = Math.max(0, rank - 1)
  const percentile = Math.round((1 - usersAhead / platformUserCount) * 1000) / 10
  const topPercent = Math.round((rank / platformUserCount) * 10000) / 100
  return {
    rank,
    platformUserCount,
    percentile,
    usersAhead,
    eliteLabel: `Top ${topPercent}% of Jutge users`,
  }
}

export function buildWrappedInsights(raw: WrappedRawData): WrappedInsights {
  const { profile, dashboard, level, absoluteRanking, homepageStats, hexColors, tables } = raw
  const displayName = profile.nickname || profile.name || profile.email.split("@")[0] || "Coder"

  const proglangs = distributionToItems(
    dashboard.distributions.proglangs,
    tables,
    hexColors,
    "proglangs",
  )
  const compilers = distributionToItems(
    dashboard.distributions.compilers,
    tables,
    hexColors,
    "compilers",
  )

  return {
    displayName,
    level,
    periodLabel: formatPeriodLabel(raw.period),
    journey: buildJourneyInsights(dashboard),
    heatmap: buildHeatmapInsights(dashboard),
    weekday: buildWeekdayInsights(dashboard),
    chrono: buildChronoInsights(dashboard),
    courseArc: buildCourseArcInsights(dashboard, tables, hexColors),
    proglangs,
    compilers,
    verdicts: buildVerdictInsights(dashboard, tables, hexColors),
    rank: buildRankInsights(absoluteRanking, homepageStats),
  }
}
