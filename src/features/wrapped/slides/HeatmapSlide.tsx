import { motion, useReducedMotion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import { fadeUpHidden, fadeUpTransition, fadeUpVisible } from "@/components/motionPresets"
import { StoryLayout } from "@/components/StoryLayout"
import { ActivityCalendar } from "@/components/HeatmapGrid"
import { StatCard } from "@/components/StatCard"
import { formatDays, formatSubmissions } from "@/i18n/plurals"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function HeatmapSlide({ insights }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { heatmap, personalized } = insights
  const peak = heatmap.peakDay

  return (
    <StoryLayout
      align="start"
      eyebrow={t("slides.heatmap.eyebrow")}
      title={personalized.heatmapTitle}
      subtitle={personalized.heatmapSubtitle}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <StaggerGroup className="grid gap-3 sm:grid-cols-2">
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
            <StaggerGroup className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
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
        <motion.div
          className="jutge-panel"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.24)}
        >
          <div className="jutge-panel-heading">
            {t("slides.heatmap.calendarHeading")}
          </div>
          <div className="jutge-chart-panel-body flex justify-center px-1 py-6 sm:px-2 sm:py-8 md:py-10">
            <ActivityCalendar heatmap={heatmap} />
          </div>
        </motion.div>
      </div>
    </StoryLayout>
  )
}
