import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import { ActivityCalendar } from "@/components/HeatmapGrid"
import { StatCard } from "@/components/StatCard"
import { formatDays, formatSubmissions } from "@/i18n/plurals"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function HeatmapSlide({ insights }: Props) {
  const { t } = useTranslation()
  const { heatmap } = insights
  const peak = heatmap.peakDay

  const subtitle = peak
    ? t("slides.heatmap.peakDay", {
        period: insights.periodLabel,
        count: formatSubmissions(t, peak.count),
        date: peak.date,
      })
    : t("slides.heatmap.summary", {
        period: insights.periodLabel,
        submissions: formatSubmissions(t, heatmap.totalSubmissions),
        days: formatDays(t, heatmap.totalActiveDays),
      })

  return (
    <StoryLayout
      align="start"
      eyebrow={t("slides.heatmap.eyebrow")}
      title={t("slides.heatmap.title")}
      subtitle={subtitle}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label={t("slides.heatmap.activeDays")}
              value={String(heatmap.totalActiveDays)}
              variant="blue"
            />
            <StatCard
              label={t("slides.heatmap.longestStreakLabel")}
              value={t("slides.heatmap.longestStreakValue", {
                count: formatDays(t, heatmap.longestStreak),
              })}
              variant="green"
            />
          </div>
          {(peak || heatmap.peakWeek || heatmap.peakMonth) && (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {peak && (
                <StatCard
                  label={t("slides.heatmap.mostActiveDay")}
                  value={formatSubmissions(t, peak.count)}
                  hint={peak.date}
                  variant="neutral"
                />
              )}
              {heatmap.peakWeek && (
                <StatCard
                  label={t("slides.heatmap.busiestWeek")}
                  value={formatSubmissions(t, heatmap.peakWeek.total)}
                  hint={heatmap.peakWeek.weekLabel}
                  variant="neutral"
                />
              )}
              {heatmap.peakMonth && (
                <StatCard
                  label={t("slides.heatmap.busiestMonth")}
                  value={formatSubmissions(t, heatmap.peakMonth.total)}
                  hint={heatmap.peakMonth.monthLabel}
                  variant="neutral"
                />
              )}
            </div>
          )}
        </div>
        <div className="jutge-panel">
          <div className="jutge-panel-heading">{t("slides.heatmap.calendarHeading")}</div>
          <div className="jutge-panel-body flex justify-center overflow-visible px-2 py-8 md:py-10">
            <ActivityCalendar heatmap={heatmap} />
          </div>
        </div>
      </div>
    </StoryLayout>
  )
}
