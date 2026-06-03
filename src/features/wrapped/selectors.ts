import type { AllTables, ColorMapping, Dashboard, HeatmapCalendar, HomepageStats } from "@/api/client"
import i18n from "@/i18n/config"
import { formatPeriodLabel, isAllTimePeriod, utcDayTsFromIso } from "./period"
import type { WrappedPeriod } from "./period"
import { compilerColor } from "@/theme/jutgeColors"
import type {
  ChronoInsights,
  CourseArcInsights,
  DistributionItem,
  HeatmapInsights,
  HeatmapYearBlock,
  JourneyInsights,
  RankInsights,
  VerdictInsights,
  WeekdayInsights,
  WrappedInsights,
  WrappedRawData,
} from "./types"

const DAY_SECONDS = 86_400

/** Beyond this span, stack one GitHub-style grid per calendar year. */
export const MULTI_YEAR_THRESHOLD_WEEKS = 54
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

function weekdayLabel(key: string): string {
  return i18n.t(`weekdays.${key}`, { defaultValue: key })
}

function heatmapTimestampToMs(ts: number): number {
  return ts > 1e12 ? ts : ts * 1000
}

function formatDate(ts: number): string {
  return new Date(heatmapTimestampToMs(ts)).toLocaleDateString(i18n.language, {
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
  const mon = d.toLocaleDateString(i18n.language, { month: "short" })
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
      labels.push(d.toLocaleDateString(i18n.language, { month: "long" }))
      prevMonth = month
    } else {
      labels.push(null)
    }
  }
  return labels
}

function utcDayTs(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month, day) / 1000)
}

function mondayBasedDow(ts: number): number {
  return (new Date(heatmapTimestampToMs(ts)).getUTCDay() + 6) % 7
}

function buildPeakMonth(heatmap: HeatmapCalendar): HeatmapInsights["peakMonth"] {
  if (heatmap.length === 0) return null

  const valueByMonth = new Map<string, number>()
  for (const c of heatmap) {
    const d = new Date(heatmapTimestampToMs(c.date))
    const key = monthKey(d.getUTCFullYear(), d.getUTCMonth())
    valueByMonth.set(key, (valueByMonth.get(key) ?? 0) + c.value)
  }

  let peakMonth: HeatmapInsights["peakMonth"] = null
  for (const [key, total] of valueByMonth) {
    if (total <= 0) continue
    if (!peakMonth || total > peakMonth.total) {
      const [yearStr, monthStr] = key.split("-")
      const year = Number(yearStr)
      const month = Number(monthStr)
      peakMonth = { monthLabel: formatMonthLabel(year, month), total }
    }
  }
  return peakMonth
}

function buildCalendarGridForRange(
  valueByDay: Map<number, number>,
  minTs: number,
  maxTs: number,
): Omit<HeatmapYearBlock, "year"> {
  const weekCount = Math.floor((maxTs - minTs) / (7 * DAY_SECONDS)) + 1
  const grid: number[][] = Array.from({ length: 7 }, () => Array(weekCount).fill(0))
  const labels: (string | null)[][] = Array.from({ length: 7 }, () =>
    Array(weekCount).fill(null),
  )
  let maxCellValue = 0

  for (let ts = minTs; ts <= maxTs; ts += DAY_SECONDS) {
    const weekIndex = Math.floor((ts - minTs) / (7 * DAY_SECONDS))
    const dow = mondayBasedDow(ts)
    const value = valueByDay.get(ts) ?? 0
    maxCellValue = Math.max(maxCellValue, value)
    grid[dow]![weekIndex] = value
    labels[dow]![weekIndex] = formatDate(ts)
  }

  return {
    grid,
    labels,
    monthLabels: buildWeekMonthLabels(minTs, weekCount),
    maxCellValue,
  }
}

function periodGridBounds(
  heatmap: HeatmapCalendar,
  period?: WrappedPeriod,
): { minTs: number; maxTs: number } | null {
  if (period && !isAllTimePeriod(period) && period.start && period.end) {
    return {
      minTs: utcDayTsFromIso(period.start),
      maxTs: utcDayTsFromIso(period.end),
    }
  }
  if (heatmap.length === 0) return null
  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  return { minTs: sorted[0]!.date, maxTs: sorted[sorted.length - 1]!.date }
}

function gridSpanWeeks(minTs: number, maxTs: number): number {
  return Math.floor((maxTs - minTs) / (7 * DAY_SECONDS)) + 1
}

function buildYearBlocks(heatmap: HeatmapCalendar, period?: WrappedPeriod): HeatmapYearBlock[] {
  const bounds = periodGridBounds(heatmap, period)
  if (!bounds) return []

  const { minTs, maxTs } = bounds
  const valueByDay = new Map(heatmap.map((c) => [c.date, c.value]))
  const spanWeeks = gridSpanWeeks(minTs, maxTs)

  if (spanWeeks > MULTI_YEAR_THRESHOLD_WEEKS) {
    const minYear = new Date(heatmapTimestampToMs(minTs)).getUTCFullYear()
    const maxYear = new Date(heatmapTimestampToMs(maxTs)).getUTCFullYear()
    const blocks: HeatmapYearBlock[] = []
    for (let year = minYear; year <= maxYear; year++) {
      const rangeMin = Math.max(utcDayTs(year, 0, 1), minTs)
      const rangeMax = Math.min(utcDayTs(year, 11, 31), maxTs)
      if (rangeMin > rangeMax) continue
      blocks.push({
        year,
        ...buildCalendarGridForRange(valueByDay, rangeMin, rangeMax),
      })
    }
    return blocks
  }

  const year = new Date(heatmapTimestampToMs(minTs)).getUTCFullYear()
  return [{ year, ...buildCalendarGridForRange(valueByDay, minTs, maxTs) }]
}

export function buildHeatmapInsights(
  dashboard: Dashboard,
  period?: WrappedPeriod,
): HeatmapInsights {
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

  const gridBounds = periodGridBounds(dashboard.heatmap, period)
  const spanWeeks = gridBounds
    ? gridSpanWeeks(gridBounds.minTs, gridBounds.maxTs)
    : heatmapSpanWeeks(dashboard.heatmap)
  const yearBlocks = buildYearBlocks(dashboard.heatmap, period)
  const calendarMode: HeatmapInsights["calendarMode"] =
    spanWeeks > MULTI_YEAR_THRESHOLD_WEEKS ? "multiYear" : "single"
  const totalSubmissions = dashboard.heatmap.reduce((s, c) => s + c.value, 0)
  const maxCellValue = Math.max(...dashboard.heatmap.map((c) => c.value), 0)

  return {
    calendarMode,
    longestStreak,
    peakDay: peakCell
      ? { date: formatDate(peakCell.date), count: peakCell.value, timestamp: peakCell.date }
      : null,
    peakWeek,
    peakMonth: buildPeakMonth(dashboard.heatmap),
    totalActiveDays: activeDays.length,
    totalSubmissions,
    yearBlocks,
    maxCellValue,
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
      first && last
        ? `${formatDate(first.date)} – ${formatDate(last.date)}`
        : i18n.t("period.allTime"),
  }
}

export function buildWeekdayInsights(dashboard: Dashboard): WeekdayInsights {
  const dist = dashboard.distributions.submissions_by_weekday
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const weekdays = WEEKDAY_ORDER.map((key) => ({
    key,
    label: weekdayLabel(key),
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

  let archetypeKey = "balancedGrinder"
  const maxBucket = Math.max(morning, afternoon, evening, nightSubmissions)
  if (nightSubmissions === maxBucket && nightSubmissions > 50) archetypeKey = "nightOwl"
  else if (morning === maxBucket) archetypeKey = "earlyRiser"
  else if (evening === maxBucket) archetypeKey = "eveningCoder"
  else if (afternoon === maxBucket) archetypeKey = "afternoonOperator"
  const archetype = i18n.t(`chrono.archetypes.${archetypeKey}`)

  const peak = hours.reduce(
    (best, h) => (h.count > best.count ? h : best),
    { hour: 0, count: 0 },
  )

  const subsTotal = dashboard.stats.number_of_submissions || 1
  const narrative =
    nightSubmissions < subsTotal * 0.05
      ? i18n.t("chrono.narrativePeak", {
          hour: String(peak.hour).padStart(2, "0"),
          archetype: archetype.toLowerCase(),
        })
      : i18n.t("chrono.narrativeNight", { count: nightSubmissions })

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
): { title: string; subtitle: string } {
  const lang = topProglang?.label ?? i18n.t("courseArc.fallbackLang")
  const subtitle = i18n.t("courseArc.mainLanguageSub", { lang })

  if (courseShare >= 50) {
    return {
      title: i18n.t("courseArc.mostlyCoursework"),
      subtitle,
    }
  }

  return {
    title: i18n.t("courseArc.compilerMix"),
    subtitle,
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
    { key: "WA", count: wa, label: i18n.t("verdicts.wrongAnswers") },
    { key: "CE", count: ce, label: i18n.t("verdicts.compilationErrors") },
    { key: "EE", count: ee, label: i18n.t("verdicts.executionErrors") },
    { key: "SC", count: sc, label: i18n.t("verdicts.scoredAttempts") },
    { key: "PE", count: pe, label: i18n.t("verdicts.presentationErrors") },
  ].sort((a, b) => b.count - a.count)

  const top = friction[0]
  if (!top || top.count === 0) {
    return i18n.t("verdicts.narrativeClean", { ac, total })
  }
  return i18n.t("verdicts.narrativeFriction", {
    total,
    ac,
    count: top.count,
    label: top.label,
  })
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
    eliteLabel: i18n.t("rank.eliteLabel", { percent: topPercent }),
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
    heatmap: buildHeatmapInsights(dashboard, raw.period),
    weekday: buildWeekdayInsights(dashboard),
    chrono: buildChronoInsights(dashboard),
    courseArc: buildCourseArcInsights(dashboard, tables, hexColors),
    proglangs,
    compilers,
    verdicts: buildVerdictInsights(dashboard, tables, hexColors),
    rank: buildRankInsights(absoluteRanking, homepageStats),
  }
}
