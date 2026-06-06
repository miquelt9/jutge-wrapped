import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
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

type Props = { insights: WrappedInsights }

export function HeatmapCalendarSlide({ insights }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const layoutVariant = useLayoutVariant()
  const { heatmap } = insights

  const calendarPadding =
    layoutVariant === "wide"
      ? "flex justify-center px-1 py-6 sm:px-2 sm:py-8 md:py-10"
      : "flex justify-center px-1 py-4 sm:py-6"

  return (
    <StoryLayout align="start" title={t("slides.heatmap.calendarHeading")}>
      <motion.div
        className="jutge-panel"
        initial={fadeUpHidden(reduceMotion)}
        animate={fadeUpVisible()}
        transition={fadeUpTransition(reduceMotion, 0.24)}
      >
        <div className={`jutge-chart-panel-body ${calendarPadding}`}>
          <ActivityCalendar heatmap={heatmap} />
        </div>
      </motion.div>
    </StoryLayout>
  )
}
