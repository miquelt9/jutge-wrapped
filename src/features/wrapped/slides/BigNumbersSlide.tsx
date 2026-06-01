import type { ReactNode } from "react"
import { ThumbsDown, ThumbsUp, Send, Gavel } from "lucide-react"
import { StoryLayout } from "@/components/StoryLayout"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function BigNumbersSlide({ insights }: Props) {
  const { journey, level } = insights

  return (
    <StoryLayout
      eyebrow="Dashboard recap"
      title="Your Jutge footprint"
      subtitle={insights.periodLabel}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<ThumbsUp className="h-6 w-6" />} label="Accepted problems" value={journey.acceptedProblems} variant="green" />
        <MetricCard icon={<ThumbsDown className="h-6 w-6" />} label="Rejected problems" value={journey.rejectedProblems} variant="red" />
        <MetricCard icon={<Send className="h-6 w-6" />} label="Submissions" value={journey.totalSubmissions} variant="orange" />
        <MetricCard icon={<Gavel className="h-6 w-6" />} label="Judge level" value={level} text variant="blue" />
      </div>
      <p className="mt-4 text-sm text-jutge-muted">
        {journey.problemSuccessRate}% of attempted problems reached acceptance in this period.
      </p>
    </StoryLayout>
  )
}

function MetricCard({
  icon,
  label,
  value,
  variant,
  text,
}: {
  icon: ReactNode
  label: string
  value: number | string
  variant: "green" | "red" | "orange" | "blue"
  text?: boolean
}) {
  const cls = {
    green: "jutge-metric-green",
    red: "jutge-metric-red",
    orange: "jutge-metric-orange",
    blue: "jutge-metric-blue",
  }[variant]

  return (
    <div className={`p-5 ${cls}`}>
      {icon}
      <p className="mt-3 text-xs font-bold uppercase opacity-90">{label}</p>
      <p className={`jutge-score mt-1 ${text ? "text-2xl" : "text-4xl"}`}>{value}</p>
    </div>
  )
}
