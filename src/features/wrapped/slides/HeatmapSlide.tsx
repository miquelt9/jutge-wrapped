import { motion, useReducedMotion } from "framer-motion"
import { useTranslation } from "react-i18next"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import { StoryLayout } from "@/components/StoryLayout"
import { ActivityCalendar } from "@/components/HeatmapGrid"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type { WrappedInsights } from "../types"
import { HeatmapStatSections } from "./heatmap/HeatmapStatSections"

type Props = { insights: WrappedInsights }

export function HeatmapSlide({ insights }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const layoutVariant = useLayoutVariant()
  const { heatmap, personalized } = insights

  const calendarPadding =
    layoutVariant === "wide"
      ? "flex justify-center px-1 py-6 sm:px-2 sm:py-8 md:py-10"
      : "flex justify-center px-1 py-4 sm:py-6"

  return (
    <StoryLayout
      align="start"
      eyebrow={t("slides.heatmap.eyebrow")}
      title={personalized.heatmapTitle}
      subtitle={personalized.heatmapSubtitle}
    >
      <div className="flex flex-col gap-4">
        <HeatmapStatSections heatmap={heatmap} layout={layoutVariant} />
        <motion.div
          className="jutge-panel"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.24)}
        >
          <div className="jutge-panel-heading">
            {t("slides.heatmap.calendarHeading")}
          </div>
          <div className={`jutge-chart-panel-body ${calendarPadding}`}>
            <ActivityCalendar heatmap={heatmap} />
          </div>
        </motion.div>
      </div>
    </StoryLayout>
  )
}
