import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import type { HomepageStats } from "@/api/client"
import type { WrappedInsights } from "../types"

type Props = {
  insights: WrappedInsights
  homepageStats: HomepageStats
}

export function RankingSlide({ insights, homepageStats }: Props) {
  const { t, i18n } = useTranslation()
  const { rank, journey, weekday, courseArc, verdicts } = insights

  return (
    <StoryLayout
      eyebrow={t("slides.ranking.eyebrow")}
      title={`${insights.level} · ${insights.displayName}`}
      subtitle={insights.periodLabel}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="jutge-metric-blue flex min-h-40 flex-col justify-center p-8 sm:min-h-40">
          <p className="jutge-score text-2xl leading-tight sm:text-4xl">{rank.eliteLabel}</p>
        </div>
        <img
          src={`${import.meta.env.BASE_URL}jutge.png`}
          alt={t("slides.ranking.judgeAlt")}
          className="mx-auto hidden h-40 w-40 border border-jutge-border bg-white object-contain p-2 lg:block"
          style={{ borderRadius: 0 }}
        />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <RecapItem label={t("slides.ranking.problems")} value={String(journey.acceptedProblems)} />
        <RecapItem
          label={t("slides.ranking.submissions")}
          value={String(journey.totalSubmissions)}
        />
        <RecapItem
          label={t("slides.ranking.topLanguage")}
          value={courseArc.topProglang?.label ?? "—"}
        />
        <RecapItem label={t("slides.ranking.busiestDay")} value={weekday.peak?.label ?? "—"} />
        <RecapItem label={t("slides.ranking.acRuns")} value={String(verdicts.ac)} />
        <RecapItem
          label={t("slides.ranking.platformSubs")}
          value={homepageStats.submissions.toLocaleString(i18n.language)}
        />
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
