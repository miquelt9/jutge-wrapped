import { useTranslation } from "react-i18next"
import { AnimatedCounter } from "@/components/AnimatedCounter"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import type { HomepageStats } from "@/api/client"
import type { WrappedInsights } from "../../types"

type Props = {
  insights: WrappedInsights
  homepageStats: HomepageStats
  layout: "stacked" | "wide"
}

export function RankingRecapGrid({ insights, homepageStats, layout }: Props) {
  const { t, i18n } = useTranslation()
  const { journey, weekday, courseArc, verdicts } = insights

  const gridClass =
    layout === "wide"
      ? "mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-3"
      : "mt-5 grid grid-cols-2 gap-3 text-sm"

  return (
    <StaggerGroup className={gridClass}>
      <RecapItem
        label={t("slides.ranking.problems")}
        value={journey.acceptedProblems}
      />
      <RecapItem
        label={t("slides.ranking.submissions")}
        value={journey.totalSubmissions}
      />
      <RecapItem
        label={t("slides.ranking.topLanguage")}
        value={courseArc.topProglang?.label ?? "—"}
      />
      <RecapItem
        label={t("slides.ranking.busiestDay")}
        value={weekday.peak?.label ?? "—"}
      />
      <RecapItem label={t("slides.ranking.acRuns")} value={verdicts.ac} />
      <RecapItem
        label={t("slides.ranking.platformSubs")}
        value={homepageStats.submissions}
        locale={i18n.language}
      />
    </StaggerGroup>
  )
}

function RecapItem({
  label,
  value,
  locale,
}: {
  label: string
  value: number | string
  locale?: string
}) {
  return (
    <StaggerItem className="jutge-panel">
      <div className="jutge-panel-body py-3">
        <dt className="text-jutge-muted text-xs font-bold uppercase">
          {label}
        </dt>
        <dd className="jutge-score text-jutge-blue mt-1 text-lg">
          {typeof value === "number" ? (
            <AnimatedCounter value={value} locale={locale} />
          ) : (
            value
          )}
        </dd>
      </div>
    </StaggerItem>
  )
}
