import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Medal, Youtube } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import { StoryLayout } from "@/components/StoryLayout"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import { AWARD_TILE_LIMIT } from "../awards"
import { jutgeAwardUrl, jutgeProblemUrl, jutgeYoutubeUrl } from "../jutgeLinks"
import type { AwardItem, WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function AwardsSlide({ insights }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { awards } = insights
  const layoutVariant = useLayoutVariant()
  const hiddenCount = Math.max(0, awards.count - awards.items.length)

  return (
    <StoryLayout
      align="start"
      eyebrow={t("slides.awards.eyebrow")}
      title={awards.title}
      subtitle={awards.subtitle}
    >
      <StaggerGroup className="flex flex-col gap-3">
        {awards.items.map((award) => (
          <StaggerItem key={award.awardId}>
            <AwardTile
              award={award}
              reduceMotion={reduceMotion}
              layout={layoutVariant === "wide" ? "wide" : "compact"}
            />
          </StaggerItem>
        ))}
      </StaggerGroup>

      {hiddenCount > 0 && (
        <motion.p
          className="text-jutge-muted mt-4 text-center text-sm"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.24)}
        >
          {t("slides.awards.moreAwards", { count: hiddenCount })}
        </motion.p>
      )}

      {awards.count > AWARD_TILE_LIMIT && (
        <motion.p
          className="text-jutge-muted mt-2 text-center text-xs uppercase"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.28)}
        >
          {t("slides.awards.showingOf", {
            shown: awards.items.length,
            total: awards.count,
          })}
        </motion.p>
      )}
    </StoryLayout>
  )
}

function AwardTile({
  award,
  reduceMotion,
  layout,
}: {
  award: AwardItem
  reduceMotion: boolean | null
  layout: "compact" | "wide"
}) {
  const { t } = useTranslation()
  const wide = layout === "wide"

  return (
    <motion.div
      className="jutge-panel"
      initial={fadeUpHidden(reduceMotion)}
      animate={fadeUpVisible()}
      transition={fadeUpTransition(reduceMotion, 0.08)}
    >
      <div
        className={`jutge-panel-body flex items-start gap-3 py-3 ${
          wide ? "sm:gap-4 sm:py-4" : ""
        }`}
      >
        <AwardIcon
          award={award}
          className={
            wide ? "h-12 w-12 shrink-0 sm:h-14 sm:w-14" : "h-11 w-11 shrink-0"
          }
        />

        <div className="min-w-0 flex-1">
          <p
            className={`text-jutge-muted font-bold uppercase ${
              wide ? "text-[10px] sm:text-xs" : "text-[10px]"
            }`}
          >
            {award.timeLabel}
          </p>
          {award.problemId && (
            <a
              href={jutgeProblemUrl(award.problemId)}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-jutge-blue mt-0.5 inline-block font-semibold no-underline hover:underline ${
                wide ? "text-xs sm:text-sm" : "text-xs"
              }`}
            >
              {t("slides.awards.problemAwarded", {
                problem: award.problemLabel ?? award.problemId,
              })}
            </a>
          )}
          <a
            href={jutgeAwardUrl(award.awardId)}
            target="_blank"
            rel="noopener noreferrer"
            className={`jutge-score text-jutge-blue mt-0.5 block truncate leading-tight font-semibold no-underline hover:underline ${
              wide ? "text-base sm:text-lg" : "text-base"
            }`}
          >
            {award.title}
          </a>
          {award.info && (
            <p
              className={`text-jutge-muted mt-1 line-clamp-2 text-xs leading-relaxed ${
                wide ? "sm:text-sm" : ""
              }`}
            >
              {award.info}
            </p>
          )}
        </div>

        {award.youtube && (
          <a
            href={jutgeYoutubeUrl(award.youtube)}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-jutge-blue flex shrink-0 flex-col items-center gap-1 self-center px-1 text-center font-semibold no-underline hover:underline ${
              wide ? "text-[10px] sm:text-xs" : "text-[10px]"
            }`}
          >
            <Youtube
              className={`shrink-0 ${wide ? "h-5 w-5 sm:h-6 sm:w-6" : "h-5 w-5"}`}
            />
            <span
              className={
                wide ? "hidden max-w-16 leading-tight sm:inline" : "sr-only"
              }
            >
              {t("slides.awards.watchYoutube")}
            </span>
          </a>
        )}
      </div>
    </motion.div>
  )
}

function AwardIcon({
  award,
  className,
}: {
  award: AwardItem
  className?: string
}) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`border-jutge-border bg-jutge-panel flex items-center justify-center border ${className ?? ""}`}
        style={{ borderRadius: 0 }}
      >
        <Medal className="text-jutge-blue h-1/2 w-1/2" aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={award.iconUrl}
      alt={t("slides.awards.iconAlt", { title: award.title })}
      className={`border-jutge-border bg-white object-contain p-1 ${className ?? ""}`}
      style={{ borderRadius: 0 }}
      onError={() => setFailed(true)}
    />
  )
}
