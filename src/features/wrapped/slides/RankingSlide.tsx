import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type { WrappedInsights } from "../types"
import { IntroHeroMoment } from "./intro/IntroHeroMoment"
import { RankingHeroBand } from "./ranking/RankingHeroBand"
import { RankingHighlights } from "./ranking/RankingHighlights"

type Props = {
  insights: WrappedInsights
}

export function RankingSlide({ insights }: Props) {
  const { t } = useTranslation()
  const layoutVariant = useLayoutVariant()

  return (
    <StoryLayout
      eyebrow={t("slides.ranking.eyebrow")}
      title={`${insights.level} · ${insights.displayName}`}
      subtitle={insights.periodLabel}
    >
      <div className="flex flex-col gap-6">
        <RankingHeroBand insights={insights} layout={layoutVariant} />
        <RankingHighlights highlights={insights.rankingHighlights} />
        {insights.personalized.heroMoment && (
          <IntroHeroMoment hero={insights.personalized.heroMoment} />
        )}
      </div>
    </StoryLayout>
  )
}
