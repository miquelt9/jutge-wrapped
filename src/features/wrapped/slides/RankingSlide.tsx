import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type { RankingHighlightKind, WrappedInsights } from "../types"
import { RankingHeroBand } from "./ranking/RankingHeroBand"
import { RankingHighlights } from "./ranking/RankingHighlights"

const PLATFORM_HIGHLIGHT_KINDS = new Set<RankingHighlightKind>([
  "compile_grief",
  "platform_submissions",
  "platform_problems",
])

type Props = {
  insights: WrappedInsights
}

export function RankingSlide({ insights }: Props) {
  const { t } = useTranslation()
  const layoutVariant = useLayoutVariant()

  const platformHighlights = useMemo(
    () => ({
      items: insights.rankingHighlights.items.filter((item) =>
        PLATFORM_HIGHLIGHT_KINDS.has(item.kind),
      ),
    }),
    [insights.rankingHighlights.items],
  )

  return (
    <StoryLayout
      eyebrow={`${t("slides.ranking.eyebrow")} · ${insights.periodLabel}`}
      title={`${insights.displayName} · ${insights.level}`}
    >
      <div className="flex flex-col gap-6">
        <RankingHeroBand insights={insights} layout={layoutVariant} />
        <RankingHighlights highlights={platformHighlights} />
      </div>
    </StoryLayout>
  )
}
