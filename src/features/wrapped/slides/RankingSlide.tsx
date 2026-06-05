import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type { WrappedInsights } from "../types"
import { IntroHeroMoment } from "./intro/IntroHeroMoment"
import { RankingHeroBand } from "./ranking/RankingHeroBand"
import { RankingHighlights } from "./ranking/RankingHighlights"
import { RankingSlowSolveCard } from "./ranking/RankingSlowSolveCard"

type Props = {
  insights: WrappedInsights
}

export function RankingSlide({ insights }: Props) {
  const { t } = useTranslation()
  const layoutVariant = useLayoutVariant()
  const extraPanels =
    Number(Boolean(insights.personalized.heroMoment)) +
    Number(Boolean(insights.personalized.slowSolve))

  return (
    <StoryLayout
      eyebrow={t("slides.ranking.eyebrow")}
      title={`${insights.displayName} · ${insights.level}`}
      subtitle={insights.periodLabel}
    >
      <div className="flex flex-col gap-6">
        <RankingHeroBand insights={insights} layout={layoutVariant} />
        {insights.personalized.heroMoment && (
          <IntroHeroMoment
            hero={insights.personalized.heroMoment}
            animationDelay={0.22}
          />
        )}
        {insights.personalized.slowSolve && (
          <RankingSlowSolveCard
            slowSolve={insights.personalized.slowSolve}
            animationDelay={insights.personalized.heroMoment ? 0.3 : 0.22}
          />
        )}
        <RankingHighlights
          highlights={insights.rankingHighlights}
          baseAnimationDelay={0.22 + extraPanels * 0.08}
        />
      </div>
    </StoryLayout>
  )
}
