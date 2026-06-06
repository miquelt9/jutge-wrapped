import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { Trans, useTranslation } from "react-i18next"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import { jutgeProblemUrl } from "../../jutgeLinks"
import type { SlowSolveInsight } from "../../types"

type Props = {
  slowSolve: SlowSolveInsight
  animationDelay?: number
}

export function RankingSlowSolveCard({
  slowSolve,
  animationDelay = 0.28,
}: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="jutge-panel border-l-jutge-blue border-l-4"
      initial={fadeUpHidden(reduceMotion)}
      animate={fadeUpVisible()}
      transition={fadeUpTransition(reduceMotion, animationDelay)}
    >
      <div className="jutge-panel-body">
        <p className="text-jutge-muted text-xs font-bold uppercase">
          {t("personalization.slowSolve.label")}
        </p>
        <p className="jutge-score text-jutge-text mt-1 text-lg">
          <Trans
            i18nKey="personalization.slowSolve.headline"
            values={{
              problem: slowSolve.problemLabel,
              duration: slowSolve.durationLabel,
            }}
            components={[
              <a
                key="0"
                href={jutgeProblemUrl(slowSolve.problemId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-jutge-blue hover:underline"
              />,
            ]}
          />
        </p>
        <p className="text-jutge-muted mt-1 text-sm">{slowSolve.detail}</p>
      </div>
    </motion.div>
  )
}
