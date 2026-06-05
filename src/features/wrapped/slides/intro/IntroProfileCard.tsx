import { motion, useReducedMotion } from "framer-motion"
import { useTranslation } from "react-i18next"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import type { WrappedRawData } from "../../types"

type Props = {
  raw: WrappedRawData
  level: string
  layout: "stacked" | "wide"
}

export function IntroProfileCard({ raw, level, layout }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={`jutge-panel w-full min-w-0 ${
        layout === "wide" ? "lg:w-auto lg:min-w-[18rem] lg:flex-none" : ""
      }`}
      initial={fadeUpHidden(reduceMotion)}
      animate={fadeUpVisible()}
      transition={fadeUpTransition(reduceMotion, 0.08)}
    >
      <div className="jutge-panel-body flex flex-row items-center gap-4 py-4 sm:gap-6">
        <div
          className="border-jutge-border bg-jutge-panel h-24 w-24 shrink-0 overflow-hidden border sm:h-32 sm:w-32"
          style={{ borderRadius: 0 }}
        >
          {raw.avatarUrl ? (
            <img
              src={raw.avatarUrl}
              alt={t("slides.intro.avatarAlt")}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <img
              src={`${import.meta.env.BASE_URL}jutge.png`}
              alt={t("slides.intro.mascotAlt")}
              className="h-full w-full object-cover object-center"
            />
          )}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-jutge-muted text-xs font-bold uppercase">
            {t("slides.intro.judgeLevel")}
          </p>
          <p className="jutge-score text-jutge-blue text-2xl">{level}</p>
          <p className="text-jutge-muted mt-1 text-sm">
            {raw.profile.name || raw.profile.email}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
