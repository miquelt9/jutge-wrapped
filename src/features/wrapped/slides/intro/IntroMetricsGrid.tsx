import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { ChevronRight, ThumbsDown, ThumbsUp, Send, Gavel } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AnimatedCounter, AnimatedPercent } from "@/components/AnimatedCounter"
import { staggerItem } from "@/components/motionPresets"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import type { IntroMetricKind, WrappedInsights } from "../../types"

type Props = {
  insights: WrappedInsights
  layout: "stacked" | "wide"
  onMetricClick?: (kind: IntroMetricKind) => void
}

export function IntroMetricsGrid({ insights, layout, onMetricClick }: Props) {
  const { t } = useTranslation()
  const { journey, verdicts } = insights
  const drilldownAvailable = journey.drilldowns.available

  const gridClass =
    layout === "wide"
      ? "grid w-full min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      : "grid w-full min-w-0 gap-3 grid-cols-2"

  return (
    <StaggerGroup className={gridClass}>
      <MetricCard
        icon={<ThumbsUp className="h-6 w-6" />}
        label={t("slides.intro.acceptedProblems")}
        value={journey.acceptedProblems}
        variant="green"
        compact={layout === "stacked"}
        onClick={
          drilldownAvailable && onMetricClick
            ? () => onMetricClick("accepted")
            : undefined
        }
        ariaLabel={t("slides.intro.drilldown.openAccepted")}
      />
      <MetricCard
        icon={<ThumbsDown className="h-6 w-6" />}
        label={t("slides.intro.rejectedProblems")}
        value={journey.rejectedProblems}
        variant="red"
        compact={layout === "stacked"}
        onClick={
          drilldownAvailable && onMetricClick
            ? () => onMetricClick("rejected")
            : undefined
        }
        ariaLabel={t("slides.intro.drilldown.openRejected")}
      />
      <MetricCard
        icon={<Send className="h-6 w-6" />}
        label={t("slides.intro.submissions")}
        value={journey.totalSubmissions}
        variant="orange"
        compact={layout === "stacked"}
        onClick={
          drilldownAvailable && onMetricClick
            ? () => onMetricClick("submissions")
            : undefined
        }
        ariaLabel={t("slides.intro.drilldown.openSubmissions")}
      />
      <MetricCard
        icon={<Gavel className="h-6 w-6" />}
        label={t("slides.intro.acRate")}
        percent={verdicts.acRate}
        percentDecimals={1}
        text
        variant="blue"
        compact={layout === "stacked"}
      />
    </StaggerGroup>
  )
}

function MetricCard({
  icon,
  label,
  value,
  percent,
  percentDecimals = 0,
  variant,
  text,
  compact,
  onClick,
  ariaLabel,
}: {
  icon: ReactNode
  label: string
  value?: number
  percent?: number
  percentDecimals?: number
  variant: "green" | "red" | "orange" | "blue"
  text?: boolean
  compact?: boolean
  onClick?: () => void
  ariaLabel?: string
}) {
  const reduceMotion = useReducedMotion()
  const cls = {
    green: "jutge-metric-green",
    red: "jutge-metric-red",
    orange: "jutge-metric-orange",
    blue: "jutge-metric-blue",
  }[variant]

  const className = `${compact ? "p-4" : "p-5"} ${cls} relative text-left`

  const valueBlock = (
    <p
      className={`jutge-score mt-1 ${text ? (compact ? "text-xl" : "text-2xl") : compact ? "text-3xl" : "text-4xl"}`}
    >
      {percent != null ? (
        <AnimatedPercent value={percent} decimals={percentDecimals} />
      ) : value != null ? (
        <AnimatedCounter value={value} />
      ) : null}
    </p>
  )

  if (onClick) {
    return (
      <motion.button
        type="button"
        variants={staggerItem(reduceMotion)}
        initial="hidden"
        animate="visible"
        whileHover={
          reduceMotion
            ? undefined
            : {
                scale: 1.04,
                y: -3,
                boxShadow: "0 10px 24px rgba(0, 0, 0, 0.18)",
              }
        }
        whileTap={reduceMotion ? undefined : { scale: 0.98, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={`${className} group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80`}
      >
        <span className="block motion-safe:transition-transform motion-safe:duration-200">
          {icon}
        </span>
        <p className="mt-2 text-xs font-bold uppercase opacity-90 sm:mt-3">
          {label}
        </p>
        {valueBlock}
        <ChevronRight
          className="absolute top-3 right-3 h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-70 group-focus-visible:opacity-70"
          aria-hidden
        />
      </motion.button>
    )
  }

  return (
    <StaggerItem className={className}>
      {icon}
      <p className="mt-2 text-xs font-bold uppercase opacity-90 sm:mt-3">
        {label}
      </p>
      {valueBlock}
    </StaggerItem>
  )
}
