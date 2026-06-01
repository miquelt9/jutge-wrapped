import { useEffect, useState } from "react"
import type { WrappedInsights, WrappedRawData } from "../types"
import { StoryLayout } from "@/components/StoryLayout"

type Props = {
  raw: WrappedRawData
  insights: WrappedInsights
}

export function IntroSlide({ raw, insights }: Props) {
  const [typed, setTyped] = useState("")
  const line = "Loading your Jutge Wrapped… Done."

  useEffect(() => {
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setTyped(line.slice(0, i))
      if (i >= line.length) window.clearInterval(id)
    }, 28)
    return () => window.clearInterval(id)
  }, [line])

  const { journey, rank } = insights

  return (
    <StoryLayout
      eyebrow="Welcome"
      title={insights.displayName}
      subtitle={`${insights.periodLabel} · your Jutge identity has been verified.`}
    >
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
        <div className="jutge-panel flex items-center gap-6">
          <div className="jutge-panel-body flex items-center gap-6">
            <div
              className="h-32 w-32 shrink-0 overflow-hidden border border-jutge-border bg-jutge-panel"
              style={{ borderRadius: 0 }}
            >
              {raw.avatarUrl ? (
                <img
                  src={raw.avatarUrl}
                  alt="Jutge avatar"
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <img
                  src={`${import.meta.env.BASE_URL}jutge.png`}
                  alt="Jutge mascot"
                  className="h-full w-full object-cover object-center"
                />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-jutge-muted">Judge level</p>
              <p className="jutge-score text-2xl text-jutge-blue">{insights.level}</p>
              <p className="mt-1 text-sm text-jutge-muted">
                {raw.profile.name || raw.profile.email}
              </p>
            </div>
          </div>
        </div>
        <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
          <StatCard label="Problems solved" value={String(journey.acceptedProblems)} variant="green" />
          <StatCard label="Submissions" value={String(journey.totalSubmissions)} variant="orange" />
          <StatCard label="Global rank" value={`#${rank.rank}`} variant="blue" />
          <StatCard label="AC rate" value={`${insights.verdicts.acRate}%`} variant="green" />
        </div>
      </div>
      <div className="jutge-panel mt-4 max-w-xl">
        <div className="jutge-panel-body font-mono text-sm text-jutge-text">
          <span className="text-jutge-blue">&gt; </span>
          {typed}
        </div>
      </div>
    </StoryLayout>
  )
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant: "green" | "orange" | "blue"
}) {
  const cls =
    variant === "green"
      ? "jutge-metric-green"
      : variant === "orange"
        ? "jutge-metric-orange"
        : "jutge-metric-blue"
  return (
    <div className={`p-3 ${cls}`}>
      <p className="text-[10px] font-bold uppercase opacity-90">{label}</p>
      <p className="jutge-score text-xl">{value}</p>
    </div>
  )
}
