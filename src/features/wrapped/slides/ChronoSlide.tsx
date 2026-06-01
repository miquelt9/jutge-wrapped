import { StoryLayout } from "@/components/StoryLayout"
import { ChronoHistogram } from "@/components/ChronoHistogram"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function ChronoSlide({ insights }: Props) {
  const { chrono } = insights

  return (
    <StoryLayout eyebrow="Chrono-analysis" title={chrono.archetype} subtitle={chrono.narrative}>
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="jutge-panel">
          <div className="jutge-panel-heading">Submissions by hour</div>
          <div className="jutge-panel-body">
            <ChronoHistogram hours={chrono.hours} peakHour={chrono.peakHour} />
          </div>
        </div>
        <div className="jutge-metric-blue p-6">
          <p className="text-xs font-bold uppercase opacity-90">Peak hour</p>
          <p className="jutge-score mt-2 text-4xl">
            {String(chrono.peakHour).padStart(2, "0")}:00
          </p>
          <p className="mt-2 text-sm opacity-90">{chrono.peakHourCount} submissions</p>
        </div>
      </div>
    </StoryLayout>
  )
}
