import { StoryLayout } from "@/components/StoryLayout"
import type { HomepageStats } from "@/api/client"
import type { WrappedInsights } from "../types"

type Props = {
  insights: WrappedInsights
  homepageStats: HomepageStats
}

export function RankingSlide({ insights, homepageStats }: Props) {
  const { rank, journey, weekday, courseArc, verdicts } = insights

  return (
    <StoryLayout
      eyebrow="System rank"
      title={`#${rank.rank}`}
      subtitle={`${insights.periodLabel} · ${rank.eliteLabel}`}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="jutge-metric-blue p-8">
          <p className="font-mono text-sm opacity-90">Global leaderboard</p>
          <p className="jutge-score mt-2 text-6xl">#{rank.rank}</p>
          <p className="mt-2 text-lg">
            {insights.level} · {insights.displayName}
          </p>
          <div className="mt-6 h-3 border border-white/40 bg-white/20">
            <div
              className="h-full bg-white"
              style={{ width: `${Math.min(100, rank.percentile)}%`, borderRadius: 0 }}
            />
          </div>
        </div>
        <img
          src={`${import.meta.env.BASE_URL}jutge.png`}
          alt="Jutge judge"
          className="mx-auto hidden h-36 border border-jutge-border bg-white object-contain p-2 lg:block"
          style={{ borderRadius: 0 }}
        />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <RecapItem label="Problems" value={String(journey.acceptedProblems)} />
        <RecapItem label="Submissions" value={String(journey.totalSubmissions)} />
        <RecapItem label="Top language" value={courseArc.topProglang?.label ?? "—"} />
        <RecapItem label="Busiest day" value={weekday.peak?.label ?? "—"} />
        <RecapItem label="AC runs" value={String(verdicts.ac)} />
        <RecapItem label="Platform subs" value={homepageStats.submissions.toLocaleString()} />
      </dl>
    </StoryLayout>
  )
}

function RecapItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="jutge-panel">
      <div className="jutge-panel-body py-3">
        <dt className="text-xs font-bold uppercase text-jutge-muted">{label}</dt>
        <dd className="jutge-score mt-1 text-lg text-jutge-blue">{value}</dd>
      </div>
    </div>
  )
}
