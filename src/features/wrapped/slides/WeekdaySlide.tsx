import { StoryLayout } from "@/components/StoryLayout"
import { WeekdayHistogram } from "@/components/WeekdayHistogram"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function WeekdaySlide({ insights }: Props) {
  const { weekday } = insights
  const peak = weekday.peak

  return (
    <StoryLayout
      eyebrow="Campus rhythm"
      title={peak ? `${peak.label} is judgment day` : "Weekly rhythm"}
      subtitle={
        weekday.quietest && peak
          ? `You submit most on ${peak.label.toLowerCase()}s · quietest: ${weekday.quietest.label.toLowerCase()}`
          : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="jutge-panel">
          <div className="jutge-panel-heading">Submissions by day of week</div>
          <div className="jutge-panel-body">
            <WeekdayHistogram days={weekday.weekdays} peakKey={peak?.key} />
          </div>
        </div>
        {peak && (
          <div className="jutge-metric-green flex flex-col justify-center p-6">
            <p className="text-xs font-bold uppercase opacity-90">Busiest day</p>
            <p className="jutge-score mt-2 text-4xl leading-tight">{peak.label}</p>
            <p className="mt-3 text-sm opacity-90">
              {peak.count} submissions
              <span className="opacity-80"> · {peak.percent}% of your week</span>
            </p>
            {weekday.quietest && weekday.quietest.key !== peak.key && (
              <p className="mt-4 border-t border-white/25 pt-4 text-xs opacity-85">
                Quietest: {weekday.quietest.label} ({weekday.quietest.count})
              </p>
            )}
          </div>
        )}
      </div>
    </StoryLayout>
  )
}
