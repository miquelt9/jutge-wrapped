import type {
  AllTables,
  ColorMapping,
  Dashboard,
  HomepageStats,
  Profile,
} from "@/api/client"
import type { WrappedPeriod } from "./period"

export type WrappedRawData = {
  profile: Profile
  avatarUrl: string | null
  dashboard: Dashboard
  level: string
  absoluteRanking: number
  homepageStats: HomepageStats
  hexColors: ColorMapping
  tables: AllTables
  period: WrappedPeriod
}

export type DistributionItem = {
  key: string
  label: string
  count: number
  percent: number
  color?: string
  emoji?: string
  description?: string
}

export type JourneyInsights = {
  acceptedProblems: number
  rejectedProblems: number
  totalSubmissions: number
  problemSuccessRate: number
  firstActive: string | null
  lastActive: string | null
  spanLabel: string
}

export type HeatmapMonthCell = {
  year: number
  month: number
  label: string
  total: number
}

export type HeatmapInsights = {
  calendarMode: "week" | "month"
  longestStreak: number
  peakDay: { date: string; count: number; timestamp: number } | null
  peakWeek: { weekLabel: string; total: number } | null
  peakMonth: { monthLabel: string; total: number } | null
  totalActiveDays: number
  totalSubmissions: number
  /** rows = Sun..Sat, cols = weeks (week mode only) */
  calendarGrid: number[][]
  calendarLabels: (string | null)[][]
  weekMonthLabels: (string | null)[]
  weekCount: number
  maxCellValue: number
  /** one bar per calendar month (month mode only) */
  monthlyBars: HeatmapMonthCell[]
  maxMonthValue: number
}

export type WeekdayInsights = {
  weekdays: DistributionItem[]
  peak: DistributionItem | null
  quietest: DistributionItem | null
}

export type ChronoInsights = {
  archetype: string
  nightSubmissions: number
  peakHour: number
  peakHourCount: number
  hours: { hour: number; count: number }[]
  narrative: string
}

export type CourseArcInsights = {
  courseCompilerShare: number
  courseCompilerCount: number
  topProglang: DistributionItem | null
  topCompiler: DistributionItem | null
  otherLanguages: DistributionItem[]
  title: string
  subtitle: string
}

export type VerdictInsights = {
  ac: number
  pe: number
  wa: number
  ce: number
  ee: number
  sc: number
  other: number
  total: number
  acRate: number
  narrative: string
  items: DistributionItem[]
}

export type RankInsights = {
  rank: number
  platformUserCount: number
  percentile: number
  usersAhead: number
  eliteLabel: string
}

export type WrappedInsights = {
  displayName: string
  level: string
  periodLabel: string
  journey: JourneyInsights
  heatmap: HeatmapInsights
  weekday: WeekdayInsights
  chrono: ChronoInsights
  courseArc: CourseArcInsights
  proglangs: DistributionItem[]
  compilers: DistributionItem[]
  verdicts: VerdictInsights
  rank: RankInsights
}
