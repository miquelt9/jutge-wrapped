import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type {
  IntroMetricKind,
  WrappedInsights,
  WrappedRawData,
} from "../../types"
import { IntroMetricDrilldownSheet } from "./IntroMetricDrilldownSheet"
import { IntroMetricsGrid } from "./IntroMetricsGrid"
import { IntroProfileCard } from "./IntroProfileCard"

type Props = {
  raw: WrappedRawData
  insights: WrappedInsights
}

export function IntroSlideBody({ raw, insights }: Props) {
  const reduceMotion = useReducedMotion()
  const layoutVariant = useLayoutVariant()
  const { level, personalized, journey } = insights
  const [openMetric, setOpenMetric] = useState<IntroMetricKind | null>(null)

  const metricsGrid = (
    <IntroMetricsGrid
      insights={insights}
      layout={layoutVariant === "wide" ? "wide" : "stacked"}
      onMetricClick={setOpenMetric}
    />
  )

  const activityLine = personalized.introActivity && (
    <motion.p
      className="text-jutge-muted text-sm"
      initial={fadeUpHidden(reduceMotion)}
      animate={fadeUpVisible()}
      transition={fadeUpTransition(reduceMotion, 0.28)}
    >
      {personalized.introActivity}
    </motion.p>
  )

  const body =
    layoutVariant === "wide" ? (
      <div className="flex flex-col gap-6">
        <div className="flex min-w-0 flex-col items-start gap-6 lg:flex-row lg:items-center">
          <IntroProfileCard raw={raw} level={level} layout="wide" />
          {metricsGrid}
        </div>
        {activityLine}
      </div>
    ) : (
      <div className="flex flex-col gap-5">
        <IntroProfileCard raw={raw} level={level} layout="stacked" />
        {metricsGrid}
        {activityLine}
      </div>
    )

  return (
    <>
      {body}
      <AnimatePresence>
        {openMetric && (
          <IntroMetricDrilldownSheet
            key={openMetric}
            kind={openMetric}
            drilldowns={journey.drilldowns}
            onClose={() => setOpenMetric(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
