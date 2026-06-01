import { StoryLayout } from "@/components/StoryLayout"
import { VerdictDonut } from "@/components/VerdictDonut"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function VerdictSlide({ insights }: Props) {
  return (
    <StoryLayout eyebrow="Verdict distribution" title="The judge has spoken">
      <div className="jutge-panel">
        <div className="jutge-panel-body flex flex-col items-center justify-center py-8">
          <VerdictDonut items={insights.verdicts.items} />
        </div>
      </div>
    </StoryLayout>
  )
}
