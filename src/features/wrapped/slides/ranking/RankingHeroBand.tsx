import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { Trans, useTranslation } from "react-i18next"
import { AnimatedDescendingPercent } from "@/components/AnimatedCounter"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import type { WrappedInsights } from "../../types"

type Props = {
  insights: WrappedInsights
  layout: "stacked" | "wide"
}

export function RankingHeroBand({ insights, layout }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { rank } = insights

  const eliteBlock = (
    <motion.div
      className={`jutge-metric-blue flex flex-col justify-center ${
        layout === "wide" ? "min-h-40 p-8" : "p-6 sm:p-8"
      }`}
      initial={fadeUpHidden(reduceMotion)}
      animate={fadeUpVisible()}
      transition={fadeUpTransition(reduceMotion, 0.12)}
    >
      <p
        className={`jutge-score leading-tight ${
          layout === "wide" ? "text-4xl" : "text-2xl sm:text-3xl"
        }`}
      >
        <EliteLabel percent={rank.topPercent} />
      </p>
    </motion.div>
  )

  if (layout === "wide") {
    return (
      <div
        className="grid items-center gap-6"
        style={{ gridTemplateColumns: "1fr auto" }}
      >
        {eliteBlock}
        <motion.img
          src={`${import.meta.env.BASE_URL}jutge.png`}
          alt={t("slides.ranking.judgeAlt")}
          className="border-jutge-border h-40 w-40 border bg-white object-contain p-2"
          style={{ borderRadius: 0 }}
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.2)}
        />
      </div>
    )
  }

  return eliteBlock
}

function EliteLabel({ percent }: { percent: number }) {
  return (
    <Trans
      i18nKey="rank.eliteLabelAnimated"
      components={[
        <AnimatedDescendingPercent
          key="percent"
          value={percent}
          showSuffix={false}
          className="text-inherit"
        />,
      ]}
    />
  )
}
