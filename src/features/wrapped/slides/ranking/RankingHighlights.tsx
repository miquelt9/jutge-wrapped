import type { RankingHighlights as RankingHighlightsData } from "../../types"
import { RankingHighlightCard } from "./RankingHighlightCard"

type Props = {
  highlights: RankingHighlightsData
  baseAnimationDelay?: number
}

export function RankingHighlights({
  highlights,
  baseAnimationDelay = 0.22,
}: Props) {
  if (highlights.items.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      {highlights.items.map((item, index) => (
        <RankingHighlightCard
          key={item.kind}
          kind={item.kind}
          percent={item.percent}
          numerator={item.numerator}
          denominator={item.denominator}
          animationDelay={baseAnimationDelay + index * 0.06}
        />
      ))}
    </div>
  )
}
