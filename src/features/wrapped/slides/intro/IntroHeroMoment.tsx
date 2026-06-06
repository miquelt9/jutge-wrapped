import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { Trans, useTranslation } from "react-i18next"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import { jutgeProblemUrl } from "../../jutgeLinks"
import type { HeroMomentInsight } from "../../types"

const HERO_HEADLINE_KEYS = {
  grind: "personalization.hero.grindHeadline",
  most_attempted: "personalization.hero.mostAttemptedHeadline",
  first_ac: "personalization.hero.firstAcHeadline",
} as const

type Props = {
  hero: HeroMomentInsight
  animationDelay?: number
}

export function IntroHeroMoment({ hero, animationDelay = 0.22 }: Props) {
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
          {t("personalization.hero.label")}
        </p>
        <p className="jutge-score text-jutge-text mt-1 text-lg">
          <Trans
            i18nKey={HERO_HEADLINE_KEYS[hero.kind]}
            values={{ problem: hero.problemLabel }}
            components={[
              <a
                key="0"
                href={jutgeProblemUrl(hero.problemId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-jutge-blue hover:underline"
              />,
            ]}
          />
        </p>
        <p className="text-jutge-muted mt-1 text-sm">{hero.detail}</p>
      </div>
    </motion.div>
  )
}
