import { StoryLayout } from "@/components/StoryLayout"
import { ActivityCalendar } from "@/components/HeatmapGrid"
import { StatCard } from "@/components/StatCard"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function HeatmapSlide({ insights }: Props) {
  const { heatmap } = insights
  const isMonthly = heatmap.calendarMode === "month"

  return (
    <StoryLayout
      eyebrow="Activity map"
      title="The long game"
      subtitle={`${insights.periodLabel} · ${heatmap.totalSubmissions} submissions across ${heatmap.totalActiveDays} active days.`}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="jutge-panel">
          <div className="jutge-panel-heading">
            {isMonthly ? "Submissions by month" : "Submissions calendar"}
          </div>
          <div className="jutge-panel-body">
            <ActivityCalendar heatmap={heatmap} />
          </div>
        </div>
        <div className="space-y-3">
          <StatCard
            label="Longest streak"
            value={`🔥 ${heatmap.longestStreak} day${heatmap.longestStreak === 1 ? "" : "s"} in a row`}
            variant="green"
          />
          {heatmap.peakWeek && (
            <StatCard
              label="Busiest week"
              value={`${heatmap.peakWeek.total} submission${heatmap.peakWeek.total === 1 ? "" : "s"}`}
              hint={heatmap.peakWeek.weekLabel}
              variant="orange"
            />
          )}
          {isMonthly && heatmap.peakMonth && (
            <StatCard
              label="Busiest month"
              value={`${heatmap.peakMonth.total} submission${heatmap.peakMonth.total === 1 ? "" : "s"}`}
              hint={heatmap.peakMonth.monthLabel}
              variant="orange"
            />
          )}
        </div>
      </div>
    </StoryLayout>
  )
}
