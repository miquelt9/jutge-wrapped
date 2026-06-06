import { useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import { jutgeProblemUrl } from "../../jutgeLinks"
import type {
  IntroMetricDrilldowns,
  IntroMetricKind,
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
        className={`jutge-panel bg-jutge-panel flex min-h-0 w-full flex-col shadow-xl ${
          isWide
            ? "h-full max-w-md border-l"
            : "max-h-[min(75vh,100%)] rounded-t-xl border-b-0 pb-[env(safe-area-inset-bottom)]"
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
                <SubmissionRow key={item.submissionId} item={item} />
              ))}
            </ul>
          ) : (
            <ul className="divide-jutge-border divide-y">
              {(items as IntroProblemItem[]).map((item) => (
                <ProblemRow key={item.problemId} item={item} />
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

function ProblemTitleDetail({ title }: { title: string }) {
  return (
    <p className="text-jutge-muted mt-0.5 line-clamp-2 text-xs leading-relaxed">
      {title}
    </p>
  )
}

function ProblemRow({ item }: { item: IntroProblemItem }) {
  return (
    <li className="px-1 py-3">
      <a
        href={jutgeProblemUrl(item.problemId)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-jutge-blue hover:bg-jutge-border/40 block text-sm font-semibold no-underline hover:underline"
      >
        {item.problemLabel}
      </a>
      {item.problemTitle && <ProblemTitleDetail title={item.problemTitle} />}
    </li>
  )
}

function SubmissionRow({ item }: { item: IntroSubmissionItem }) {
  return (
    <li className="flex items-start justify-between gap-3 px-1 py-3">
      <div className="min-w-0">
        <a
          href={jutgeProblemUrl(item.problemId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-jutge-blue block truncate text-sm font-semibold no-underline hover:underline"
        >
          {item.problemLabel}
        </a>
        {item.problemTitle && <ProblemTitleDetail title={item.problemTitle} />}
        <p className="text-jutge-muted mt-0.5 text-xs">{item.timeLabel}</p>
      </div>
      <span className="text-jutge-text shrink-0 text-xs font-bold uppercase">
        {item.verdictLabel}
      </span>
    </li>
  )
}
