import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { Trans, useTranslation } from "react-i18next"
import { AnimatedCounter } from "@/components/AnimatedCounter"
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

export function RankingAbsoluteBand({ insights, layout }: Props) {
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { rank } = insights

  const rankBlock = (
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
        <AbsoluteRankLabel rank={rank.rank} locale={i18n.language} />
      </p>
    </motion.div>
  )

  if (layout === "wide") {
    return (
      <div
        className="grid items-center gap-6"
        style={{ gridTemplateColumns: "1fr auto" }}
      >
        {rankBlock}
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

  return rankBlock
}

function AbsoluteRankLabel({
  rank,
  locale,
}: {
  rank: number
  locale: string
}) {
  return (
    <Trans
      i18nKey="rank.absoluteRankAnimated"
      components={[
        <AnimatedCounter key="rank" value={rank} locale={locale} />,
      ]}
    />
  )
}
