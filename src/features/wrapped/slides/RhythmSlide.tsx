import { useTranslation } from "react-i18next"
import { ChartMetricLayout } from "@/components/ChartMetricLayout"
import { StoryLayout } from "@/components/StoryLayout"
import { ChronoHistogram } from "@/components/ChronoHistogram"
import { WeekdayHistogram } from "@/components/WeekdayHistogram"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function RhythmSlide({ insights }: Props) {
  const { t } = useTranslation()
  const { weekday, chrono, personalized } = insights
  const peak = weekday.peak
  const quietest = weekday.quietest
  const peakHour = String(chrono.peakHour).padStart(2, "0")

  const weekdayChart = (
    <div className="jutge-panel w-full min-w-0">
      <div className="jutge-panel-heading">
        {t("slides.weekday.chartHeading")}
      </div>
      <div className="jutge-chart-panel-body">
        <WeekdayHistogram days={weekday.weekdays} peakKey={peak?.key} />
      </div>
    </div>
  )

  const weekdayAside =
    peak != null ? (
      <div className="jutge-metric-green flex flex-col justify-center p-6">
        <p className="text-xs font-bold uppercase opacity-90">
          {t("slides.weekday.busiestDay")}
        </p>
        <p className="jutge-score mt-2 text-4xl leading-tight">{peak.label}</p>
        <p className="mt-3 text-sm opacity-90">
          {t("slides.weekday.submissionsShare", {
            count: peak.count,
            percent: peak.percent,
          })}
        </p>
        {quietest && quietest.key !== peak.key && (
          <p className="mt-4 border-t border-white/25 pt-4 text-xs opacity-85">
            {t("slides.weekday.quietest", {
              day: quietest.label,
              count: quietest.count,
            })}
          </p>
        )}
      </div>
    ) : null

  const chronoChart = (
    <div className="jutge-panel w-full min-w-0">
      <div className="jutge-panel-heading">
        {t("slides.chrono.chartHeading")}
      </div>
      <div className="jutge-chart-panel-body">
        <ChronoHistogram hours={chrono.hours} />
      </div>
    </div>
  )

  const chronoAside = (
    <div className="jutge-metric-blue p-6">
      <p className="text-xs font-bold uppercase opacity-90">
        {t("slides.chrono.peakHour")}
      </p>
      <p className="jutge-score mt-2 text-4xl">{peakHour}:00</p>
      <p className="mt-2 text-sm opacity-90">
        {t("slides.chrono.submissionsAtPeak", {
          count: chrono.peakHourCount,
        })}
      </p>
    </div>
  )

  return (
    <StoryLayout
      align="start"
      title={t(`slides.rhythm.titles.${personalized.rhythmTitleKey}`, {
        defaultValue: chrono.archetype,
      })}
    >
      <div className="flex w-full min-w-0 flex-col gap-6">
        {weekdayAside ? (
          <ChartMetricLayout
            chart={weekdayChart}
            aside={weekdayAside}
            asideWidth={220}
          />
        ) : (
          weekdayChart
        )}
        <ChartMetricLayout
          chart={chronoChart}
          aside={chronoAside}
          asideWidth={240}
        />
      </div>
    </StoryLayout>
  )
}
