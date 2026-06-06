import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type { RankingHighlightKind, WrappedInsights } from "../types"
import { IntroHeroMoment } from "./intro/IntroHeroMoment"
import { RankingAbsoluteBand } from "./ranking/RankingAbsoluteBand"
import { RankingHighlights } from "./ranking/RankingHighlights"
import { RankingSlowSolveCard } from "./ranking/RankingSlowSolveCard"

const PERFORMANCE_HIGHLIGHT_KINDS = new Set<RankingHighlightKind>([
  "first_attempt",
])

type Props = {
  insights: WrappedInsights
}

export function PerformanceSlide({ insights }: Props) {
  const { t } = useTranslation()
  const layoutVariant = useLayoutVariant()
  const extraPanels =
    Number(Boolean(insights.personalized.heroMoment)) +
    Number(Boolean(insights.personalized.slowSolve))

  const performanceHighlights = useMemo(
    () => ({
      items: insights.rankingHighlights.items.filter((item) =>
        PERFORMANCE_HIGHLIGHT_KINDS.has(item.kind),
      ),
    }),
    [insights.rankingHighlights.items],
  )

  return (
    <StoryLayout
      eyebrow={t("slides.performance.eyebrow")}
      title={`${insights.displayName} · ${insights.level}`}
      subtitle={insights.periodLabel}
    >
      <div className="flex flex-col gap-6">
        <RankingAbsoluteBand insights={insights} layout={layoutVariant} />
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
          highlights={performanceHighlights}
          baseAnimationDelay={0.22 + extraPanels * 0.08}
        />
      </div>
    </StoryLayout>
  )
}
