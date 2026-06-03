import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import { WeekdayHistogram } from "@/components/WeekdayHistogram"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function WeekdaySlide({ insights }: Props) {
  const { t } = useTranslation()
  const { weekday } = insights
  const peak = weekday.peak

  const subtitle =
    weekday.quietest && peak
      ? t("slides.weekday.subtitle", {
          peak: peak.label.toLowerCase(),
          quietest: weekday.quietest.label.toLowerCase(),
        })
      : undefined

  return (
    <StoryLayout
      eyebrow={t("slides.weekday.eyebrow")}
      title={
        peak ? t("slides.weekday.judgmentDay", { day: peak.label }) : t("slides.weekday.weeklyRhythm")
      }
      subtitle={subtitle}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="jutge-panel">
          <div className="jutge-panel-heading">{t("slides.weekday.chartHeading")}</div>
          <div className="jutge-panel-body">
            <WeekdayHistogram days={weekday.weekdays} peakKey={peak?.key} />
          </div>
        </div>
        {peak && (
          <div className="jutge-metric-green flex flex-col justify-center p-6">
            <p className="text-xs font-bold uppercase opacity-90">{t("slides.weekday.busiestDay")}</p>
            <p className="jutge-score mt-2 text-4xl leading-tight">{peak.label}</p>
            <p className="mt-3 text-sm opacity-90">
              {t("slides.weekday.submissionsShare", {
                count: peak.count,
                percent: peak.percent,
              })}
            </p>
            {weekday.quietest && weekday.quietest.key !== peak.key && (
              <p className="mt-4 border-t border-white/25 pt-4 text-xs opacity-85">
                {t("slides.weekday.quietest", {
                  day: weekday.quietest.label,
                  count: weekday.quietest.count,
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </StoryLayout>
  )
}
