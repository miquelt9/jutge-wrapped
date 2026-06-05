import { motion, useReducedMotion } from "framer-motion"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type { WrappedInsights, WrappedRawData } from "../../types"
import { IntroMetricsGrid } from "./IntroMetricsGrid"
import { IntroProfileCard } from "./IntroProfileCard"

type Props = {
  raw: WrappedRawData
  insights: WrappedInsights
}

export function IntroSlideBody({ raw, insights }: Props) {
  const reduceMotion = useReducedMotion()
  const layoutVariant = useLayoutVariant()
  const { level, personalized } = insights

  if (layoutVariant === "wide") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex min-w-0 flex-col items-start gap-6 lg:flex-row lg:items-center">
          <IntroProfileCard raw={raw} level={level} layout="wide" />
          <IntroMetricsGrid insights={insights} layout="wide" />
        </div>
        {personalized.introActivity && (
          <motion.p
            className="text-jutge-muted text-sm"
            initial={fadeUpHidden(reduceMotion)}
            animate={fadeUpVisible()}
            transition={fadeUpTransition(reduceMotion, 0.28)}
          >
            {personalized.introActivity}
          </motion.p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <IntroProfileCard raw={raw} level={level} layout="stacked" />
      <IntroMetricsGrid insights={insights} layout="stacked" />
      {personalized.introActivity && (
        <motion.p
          className="text-jutge-muted text-sm"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.28)}
        >
          {personalized.introActivity}
        </motion.p>
      )}
    </div>
  )
}
