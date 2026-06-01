import { Zap } from "lucide-react"
import { StoryLayout } from "@/components/StoryLayout"
import { StatCard } from "@/components/StatCard"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function PeakDaySlide({ insights }: Props) {
  const { heatmap } = insights
  const peak = heatmap.peakDay

  if (!peak) {
    return (
      <StoryLayout eyebrow="Momentum" title="Quiet arc" subtitle="No peak day recorded yet." />
    )
  }

  return (
    <StoryLayout
      eyebrow="Peak momentum"
      title="Most active day"
      subtitle={`${peak.date} — ${peak.count} submissions in one day.`}
    >
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <div className="jutge-metric-orange p-10 text-center">
          <Zap className="mx-auto h-10 w-10" />
          <p className="jutge-score mt-4 text-6xl">{peak.count}</p>
          <p className="mt-2 text-sm opacity-90">submissions</p>
        </div>
        <div className="grid w-full max-w-sm gap-3">
          <StatCard label="Date" value={peak.date} variant="orange" />
          <StatCard
            label="Longest streak"
            value={`🔥 ${heatmap.longestStreak} day${heatmap.longestStreak === 1 ? "" : "s"} in a row`}
            variant="green"
          />
          <StatCard label="Active days" value={String(heatmap.totalActiveDays)} variant="blue" />
        </div>
      </div>
    </StoryLayout>
  )
}
