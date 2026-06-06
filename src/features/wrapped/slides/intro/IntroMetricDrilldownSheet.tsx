import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { Medal, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import { jutgeAwardUrl, jutgeProblemUrl } from "../../jutgeLinks"
import type {
  IntroMetricDrilldowns,
  IntroMetricKind,
  IntroProblemAward,
  IntroProblemItem,
  IntroSubmissionItem,
} from "../../types"

type Props = {
  kind: IntroMetricKind
  drilldowns: IntroMetricDrilldowns
  onClose: () => void
}

const TITLE_KEYS: Record<IntroMetricKind, string> = {
  accepted: "slides.intro.drilldown.acceptedTitle",
  rejected: "slides.intro.drilldown.rejectedTitle",
  submissions: "slides.intro.drilldown.submissionsTitle",
}

export function IntroMetricDrilldownSheet({
  kind,
  drilldowns,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const layout = useLayoutVariant()
  const isWide = layout === "wide"

  const items = getItemsForKind(kind, drilldowns)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose])

  const springTransition = {
    type: "spring" as const,
    damping: 28,
    stiffness: 320,
  }

  const sheet = (
    <motion.div
      className={`fixed inset-0 z-[100] flex bg-black/40 ${
        isWide ? "flex-row justify-end" : "flex-col justify-end"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.aside
        initial={reduceMotion ? false : isWide ? { x: "100%" } : { y: "100%" }}
        animate={reduceMotion ? { opacity: 1 } : isWide ? { x: 0 } : { y: 0 }}
        exit={
          reduceMotion ? { opacity: 0 } : isWide ? { x: "100%" } : { y: "100%" }
        }
        transition={reduceMotion ? { duration: 0 } : springTransition}
        className={`jutge-panel bg-jutge-panel flex w-full flex-col shadow-xl ${
          isWide
            ? "h-full max-w-md border-l min-h-0"
            : "h-auto max-h-[min(75vh,100%)] rounded-t-xl border-b-0 pb-[env(safe-area-inset-bottom)]"
        }`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-metric-drilldown-title"
      >
        {!isWide && (
          <div className="flex shrink-0 justify-center pt-2 pb-1">
            <span className="bg-jutge-border h-1 w-10 rounded-full" />
          </div>
        )}

        <div className="jutge-panel-heading flex shrink-0 items-start justify-between gap-4">
          <h2
            id="intro-metric-drilldown-title"
            className="text-jutge-text text-base font-semibold"
          >
            {t(TITLE_KEYS[kind])}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-jutge-muted hover:text-jutge-text shrink-0"
            aria-label={t("common.dismiss")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="jutge-panel-body min-h-0 flex-1 overflow-y-auto py-0">
          {items.length === 0 ? (
            <p className="text-jutge-muted py-4 text-sm">
              {t("slides.intro.drilldown.empty")}
            </p>
          ) : kind === "submissions" ? (
            <ul className="divide-jutge-border divide-y">
              {(items as IntroSubmissionItem[]).map((item) => (
                <SubmissionRow key={item.submissionId} item={item} isWide={isWide} />
              ))}
            </ul>
          ) : (
            <ul className="divide-jutge-border divide-y">
              {(items as IntroProblemItem[]).map((item) => (
                <ProblemRow key={item.problemId} item={item} kind={kind} isWide={isWide} />
              ))}
            </ul>
          )}
        </div>
      </motion.aside>
    </motion.div>
  )

  return createPortal(sheet, document.body)
}

function getItemsForKind(
  kind: IntroMetricKind,
  drilldowns: IntroMetricDrilldowns,
): IntroProblemItem[] | IntroSubmissionItem[] {
  switch (kind) {
    case "accepted":
      return drilldowns.acceptedProblems
    case "rejected":
      return drilldowns.rejectedProblems
    case "submissions":
      return drilldowns.submissions
  }
}

function ProblemMetaDetail({
  children,
  isWide,
}: {
  children: ReactNode
  isWide: boolean
}) {
  return (
    <p
      className={`text-jutge-muted mt-0.5 leading-relaxed ${
        isWide ? "text-xs sm:text-sm" : "text-xs"
      }`}
    >
      {children}
    </p>
  )
}

function ProblemRow({
  item,
  kind,
  isWide,
}: {
  item: IntroProblemItem
  kind: IntroMetricKind
  isWide: boolean
}) {
  const { t } = useTranslation()
  const displayName = item.problemTitle ?? item.problemLabel

  return (
    <li className="px-1 py-3">
      <a
        href={jutgeProblemUrl(item.problemId)}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-jutge-blue hover:bg-jutge-border/40 block font-semibold no-underline hover:underline ${
          isWide ? "text-sm sm:text-base" : "text-sm"
        }`}
      >
        {displayName}
      </a>
      {item.problemTitle && (
        <ProblemMetaDetail isWide={isWide}>
          {t("slides.intro.drilldown.problemId", { id: item.problemLabel })}
        </ProblemMetaDetail>
      )}
      {kind === "accepted" && item.submissionCount != null && (
        <ProblemMetaDetail isWide={isWide}>
          {item.attemptsBeforeAc === 0
            ? t("slides.intro.drilldown.acceptedFirstTry", {
                submissions: t("submission", { count: item.submissionCount }),
              })
            : t("slides.intro.drilldown.acceptedMeta", {
                submissions: t("submission", { count: item.submissionCount }),
                attempts: item.attemptsBeforeAc ?? 0,
              })}
          {item.acceptedAtLabel
            ? ` · ${t("slides.intro.drilldown.acceptedOn", {
                date: item.acceptedAtLabel,
              })}`
            : null}
        </ProblemMetaDetail>
      )}
      {kind === "rejected" && item.submissionCount != null && (
        <ProblemMetaDetail isWide={isWide}>
          {item.lastVerdictLabel
            ? t("slides.intro.drilldown.rejectedMeta", {
                submissions: t("submission", { count: item.submissionCount }),
                verdict: item.lastVerdictLabel,
              })
            : t("submission", { count: item.submissionCount })}
        </ProblemMetaDetail>
      )}
      {kind === "accepted" && item.awards && item.awards.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {item.awards.map((award) => (
            <ProblemAwardRow key={award.awardId} award={award} isWide={isWide} />
          ))}
        </ul>
      )}
    </li>
  )
}

function ProblemAwardRow({
  award,
  isWide,
}: {
  award: IntroProblemAward
  isWide: boolean
}) {
  const { t } = useTranslation()
  const [iconFailed, setIconFailed] = useState(false)

  return (
    <li>
      <a
        href={jutgeAwardUrl(award.awardId)}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-jutge-blue hover:bg-jutge-border/40 flex items-center gap-2 rounded-sm no-underline hover:underline ${
          isWide ? "text-xs sm:text-sm" : "text-xs"
        }`}
      >
        {iconFailed ? (
          <span
            className="border-jutge-border bg-jutge-panel flex h-5 w-5 shrink-0 items-center justify-center border"
            aria-hidden
          >
            <Medal className="text-jutge-blue h-3 w-3" />
          </span>
        ) : (
          <img
            src={award.iconUrl}
            alt=""
            className="h-5 w-5 shrink-0 object-contain"
            onError={() => setIconFailed(true)}
          />
        )}
        <span className="min-w-0 leading-snug font-medium">
          {t("slides.intro.drilldown.awardForProblem", { title: award.title })}
        </span>
      </a>
    </li>
  )
}

function SubmissionRow({
  item,
  isWide,
}: {
  item: IntroSubmissionItem
  isWide: boolean
}) {
  const displayName = item.problemTitle ?? item.problemLabel

  return (
    <li className="flex items-start justify-between gap-3 px-1 py-3">
      <div className="min-w-0">
        <a
          href={jutgeProblemUrl(item.problemId)}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-jutge-blue block truncate font-semibold no-underline hover:underline ${
            isWide ? "text-sm sm:text-base" : "text-sm"
          }`}
        >
          {displayName}
        </a>
        {item.problemTitle && (
          <ProblemMetaDetail isWide={isWide}>{item.problemLabel}</ProblemMetaDetail>
        )}
        <ProblemMetaDetail isWide={isWide}>{item.timeLabel}</ProblemMetaDetail>
      </div>
      <span
        className={`text-jutge-text shrink-0 font-bold uppercase ${
          isWide ? "text-xs sm:text-sm" : "text-xs"
        }`}
      >
        {item.verdictLabel}
      </span>
    </li>
  )
}
