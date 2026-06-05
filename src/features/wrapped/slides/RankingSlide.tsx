import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type { HomepageStats } from "@/api/client"
import type { WrappedInsights } from "../types"
import { RankingHeroBand } from "./ranking/RankingHeroBand"
import { RankingRecapGrid } from "./ranking/RankingRecapGrid"

type Props = {
  insights: WrappedInsights
  homepageStats: HomepageStats
}

export function RankingSlide({ insights, homepageStats }: Props) {
  const { t } = useTranslation()
  const layoutVariant = useLayoutVariant()

  return (
    <StoryLayout
      eyebrow={t("slides.ranking.eyebrow")}
      title={`${insights.level} · ${insights.displayName}`}
      subtitle={insights.periodLabel}
    >
      <RankingHeroBand insights={insights} layout={layoutVariant} />
      <RankingRecapGrid
        insights={insights}
        homepageStats={homepageStats}
        layout={layoutVariant}
      />
    </StoryLayout>
  )
}
