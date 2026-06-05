import { useTranslation } from "react-i18next"
import { ChartMetricLayout } from "@/components/ChartMetricLayout"
import { StoryLayout } from "@/components/StoryLayout"
import { ChronoHistogram } from "@/components/ChronoHistogram"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function ChronoSlide({ insights }: Props) {
  const { t } = useTranslation()
  const { chrono, personalized } = insights

  const chart = (
    <div className="jutge-panel">
      <div className="jutge-panel-heading">
        {t("slides.chrono.chartHeading")}
      </div>
      <div className="jutge-chart-panel-body">
        <ChronoHistogram hours={chrono.hours} />
      </div>
    </div>
  )

  const aside = (
    <div className="jutge-metric-blue p-6">
      <p className="text-xs font-bold uppercase opacity-90">
        {t("slides.chrono.peakHour")}
      </p>
      <p className="jutge-score mt-2 text-4xl">
        {String(chrono.peakHour).padStart(2, "0")}:00
      </p>
      <p className="mt-2 text-sm opacity-90">
        {t("slides.chrono.submissionsAtPeak", {
          count: chrono.peakHourCount,
        })}
      </p>
    </div>
  )

  return (
    <StoryLayout
      eyebrow={personalized.chronoEyebrow}
      title={chrono.archetype}
      subtitle={chrono.narrative}
    >
      <ChartMetricLayout chart={chart} aside={aside} asideWidth={240} />
    </StoryLayout>
  )
}
