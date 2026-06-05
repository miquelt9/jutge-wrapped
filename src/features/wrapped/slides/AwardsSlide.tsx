import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ChevronLeft, ChevronRight, Medal, Youtube } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import { StoryLayout } from "@/components/StoryLayout"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import { jutgeAwardUrl, jutgeProblemUrl, jutgeYoutubeUrl } from "../jutgeLinks"
import type { AwardItem, WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

const AWARDS_PER_PAGE = 10

export function AwardsSlide({ insights }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { awards } = insights
  const layoutVariant = useLayoutVariant()
  const totalPages = Math.max(1, Math.ceil(awards.items.length / AWARDS_PER_PAGE))
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    setPageIndex((current) => Math.min(current, totalPages - 1))
  }, [totalPages])

  const pageStart = pageIndex * AWARDS_PER_PAGE
  const pageAwards = awards.items.slice(pageStart, pageStart + AWARDS_PER_PAGE)
  const canPaginate = totalPages > 1

  const goPrev = () => setPageIndex((current) => Math.max(0, current - 1))
  const goNext = () =>
    setPageIndex((current) => Math.min(totalPages - 1, current + 1))

  return (
    <StoryLayout
      align="start"
      eyebrow={t("slides.awards.eyebrow")}
      title={awards.title}
    >
      {pageAwards.length > 0 && (
        <StaggerGroup className="flex flex-col gap-3">
          {pageAwards.map((award) => (
            <StaggerItem key={award.awardId}>
              <AwardTile
                award={award}
                reduceMotion={reduceMotion}
                layout={layoutVariant === "wide" ? "wide" : "compact"}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      {canPaginate && (
        <motion.nav
          className="mt-4 flex items-center justify-center gap-2"
          aria-label={t("slides.awards.paginationLabel")}
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.24)}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={pageIndex === 0}
            aria-label={t("slides.awards.prevPage")}
            className="jutge-btn-default flex shrink-0 items-center gap-1 px-2 disabled:opacity-40 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="sr-only sm:not-sr-only sm:inline">
              {t("common.prev")}
            </span>
          </button>
          <span className="text-jutge-muted min-w-24 text-center text-xs uppercase">
            {t("slides.awards.showingOf", {
              current: pageIndex + 1,
              total: totalPages,
            })}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={pageIndex === totalPages - 1}
            aria-label={t("slides.awards.nextPage")}
            className="jutge-btn-default flex shrink-0 items-center gap-1 px-2 disabled:opacity-40 sm:px-3"
          >
            <span className="sr-only sm:not-sr-only sm:inline">
              {t("common.next")}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </motion.nav>
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
