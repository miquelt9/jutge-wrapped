import { StoryLayout } from "@/components/StoryLayout"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import type { WrappedInsights } from "../types"
import { HeatmapStatSections } from "./heatmap/HeatmapStatSections"

type Props = { insights: WrappedInsights }

export function HeatmapStatsSlide({ insights }: Props) {
  const layoutVariant = useLayoutVariant()
  const { heatmap, personalized } = insights

  return (
    <StoryLayout
      align="start"
      title={personalized.heatmapTitle}
      subtitle={personalized.heatmapSubtitle}
    >
      <HeatmapStatSections heatmap={heatmap} layout={layoutVariant} />
    </StoryLayout>
  )
}
