import { useTranslation } from "react-i18next"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import { StatCard } from "@/components/StatCard"
import { formatDays, formatSubmissions } from "@/i18n/plurals"
import type { LayoutVariant } from "@/hooks/useLayoutVariant"
import type { HeatmapInsights } from "../../types"

type Props = {
  heatmap: HeatmapInsights
  layout: LayoutVariant
}

export function HeatmapStatSections({ heatmap, layout }: Props) {
  const { t } = useTranslation()
  const peak = heatmap.peakDay

  const primaryGridClass =
    layout === "wide" ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"

  const peakGridClass =
    layout === "wide"
      ? "grid gap-3 sm:grid-cols-2 md:grid-cols-3"
      : "grid gap-3"

  return (
    <div className="flex flex-col gap-3">
      <StaggerGroup className={primaryGridClass}>
        <StaggerItem>
          <StatCard
            label={t("slides.heatmap.activeDays")}
            value={String(heatmap.totalActiveDays)}
            variant="blue"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={t("slides.heatmap.longestStreakLabel")}
            value={t("slides.heatmap.longestStreakValue", {
              count: formatDays(t, heatmap.longestStreak),
            })}
            variant="green"
          />
        </StaggerItem>
      </StaggerGroup>
      {(peak || heatmap.peakWeek || heatmap.peakMonth) && (
        <StaggerGroup className={peakGridClass}>
          {peak && (
            <StaggerItem>
              <StatCard
                label={t("slides.heatmap.mostActiveDay")}
                value={formatSubmissions(t, peak.count)}
                hint={peak.date}
                variant="neutral"
              />
            </StaggerItem>
          )}
          {heatmap.peakWeek && (
            <StaggerItem>
              <StatCard
                label={t("slides.heatmap.busiestWeek")}
                value={formatSubmissions(t, heatmap.peakWeek.total)}
                hint={heatmap.peakWeek.weekLabel}
                variant="neutral"
              />
            </StaggerItem>
          )}
          {heatmap.peakMonth && (
            <StaggerItem>
              <StatCard
                label={t("slides.heatmap.busiestMonth")}
                value={formatSubmissions(t, heatmap.peakMonth.total)}
                hint={heatmap.peakMonth.monthLabel}
                variant="neutral"
              />
            </StaggerItem>
          )}
        </StaggerGroup>
      )}
    </div>
  )
}
