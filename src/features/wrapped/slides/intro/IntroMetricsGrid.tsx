import type { ReactNode } from "react"
import { ThumbsDown, ThumbsUp, Send, Gavel } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AnimatedCounter, AnimatedPercent } from "@/components/AnimatedCounter"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import type { WrappedInsights } from "../../types"

type Props = {
  insights: WrappedInsights
  layout: "stacked" | "wide"
}

export function IntroMetricsGrid({ insights, layout }: Props) {
  const { t } = useTranslation()
  const { journey, verdicts } = insights

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
      />
      <MetricCard
        icon={<ThumbsDown className="h-6 w-6" />}
        label={t("slides.intro.rejectedProblems")}
        value={journey.rejectedProblems}
        variant="red"
        compact={layout === "stacked"}
      />
      <MetricCard
        icon={<Send className="h-6 w-6" />}
        label={t("slides.intro.submissions")}
        value={journey.totalSubmissions}
        variant="orange"
        compact={layout === "stacked"}
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
}: {
  icon: ReactNode
  label: string
  value?: number
  percent?: number
  percentDecimals?: number
  variant: "green" | "red" | "orange" | "blue"
  text?: boolean
  compact?: boolean
}) {
  const cls = {
    green: "jutge-metric-green",
    red: "jutge-metric-red",
    orange: "jutge-metric-orange",
    blue: "jutge-metric-blue",
  }[variant]

  return (
    <StaggerItem className={`${compact ? "p-4" : "p-5"} ${cls}`}>
      {icon}
      <p className="mt-2 text-xs font-bold uppercase opacity-90 sm:mt-3">
        {label}
      </p>
      <p
        className={`jutge-score mt-1 ${text ? (compact ? "text-xl" : "text-2xl") : compact ? "text-3xl" : "text-4xl"}`}
      >
        {percent != null ? (
          <AnimatedPercent value={percent} decimals={percentDecimals} />
        ) : value != null ? (
          <AnimatedCounter value={value} />
        ) : null}
      </p>
    </StaggerItem>
  )
}
