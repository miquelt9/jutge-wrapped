import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { Trans, useTranslation } from "react-i18next"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import type { RankingHighlightKind } from "../../types"

function formatHighlightPercent(
  kind: RankingHighlightKind,
  value: number,
): string {
  const decimals =
    kind === "platform_submissions" ? 4 : kind === "platform_problems" ? 3 : 1
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

const LABEL_KEYS = {
  first_attempt: "personalization.rankingHighlights.firstAttempt.label",
  platform_problems: "personalization.rankingHighlights.platformProblems.label",
  platform_submissions:
    "personalization.rankingHighlights.platformSubmissions.label",
  compile_grief: "personalization.rankingHighlights.compileGrief.label",
} as const satisfies Record<RankingHighlightKind, string>

const HEADLINE_KEYS = {
  first_attempt: "personalization.rankingHighlights.firstAttempt.headline",
  platform_problems:
    "personalization.rankingHighlights.platformProblems.headline",
  platform_submissions:
    "personalization.rankingHighlights.platformSubmissions.headline",
  compile_grief: "personalization.rankingHighlights.compileGrief.headline",
} as const satisfies Record<RankingHighlightKind, string>

const DETAIL_KEYS = {
  first_attempt: "personalization.rankingHighlights.firstAttempt.detail",
  platform_problems:
    "personalization.rankingHighlights.platformProblems.detail",
  platform_submissions:
    "personalization.rankingHighlights.platformSubmissions.detail",
  compile_grief: "personalization.rankingHighlights.compileGrief.detail",
} as const satisfies Record<RankingHighlightKind, string>

type Props = {
  kind: RankingHighlightKind
  percent: number
  numerator: number
  denominator: number
  animationDelay?: number
}

export function RankingHighlightCard({
  kind,
  percent,
  numerator,
  denominator,
  animationDelay = 0.22,
}: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const percentLabel = formatHighlightPercent(kind, percent)

  return (
    <motion.div
      className="jutge-panel border-l-jutge-blue border-l-4"
      initial={fadeUpHidden(reduceMotion)}
      animate={fadeUpVisible()}
      transition={fadeUpTransition(reduceMotion, animationDelay)}
    >
      <div className="jutge-panel-body">
        <p className="text-jutge-muted text-xs font-bold uppercase">
          {t(LABEL_KEYS[kind])}
        </p>
        <p className="jutge-score text-jutge-text mt-1 text-lg">
          <Trans
            i18nKey={HEADLINE_KEYS[kind]}
            values={{ percent: percentLabel, count: numerator }}
            components={[<span key="0" className="font-bold text-jutge-blue" />]}
          />
        </p>
        <p className="text-jutge-muted mt-1 text-sm">
          {t(DETAIL_KEYS[kind], {
            count: numerator,
            total: denominator,
            accepted: numerator,
            yours: numerator,
            percent: percentLabel,
          })}
        </p>
      </div>
    </motion.div>
  )
}
