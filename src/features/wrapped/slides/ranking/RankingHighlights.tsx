import type { RankingHighlights as RankingHighlightsData } from "../../types"
import { RankingHighlightCard } from "./RankingHighlightCard"

type Props = {
  highlights: RankingHighlightsData
}

export function RankingHighlights({ highlights }: Props) {
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
          animationDelay={0.22 + index * 0.06}
        />
      ))}
    </div>
  )
}
