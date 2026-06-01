import { StoryLayout } from "@/components/StoryLayout"
import { CompilerDonut } from "@/components/CompilerDonut"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function CourseArcSlide({ insights }: Props) {
  return (
    <StoryLayout eyebrow="Languages & compilers" title={insights.courseArc.title}>
      <div className="jutge-panel">
        <div className="jutge-panel-body flex flex-col items-center justify-center py-8">
          <CompilerDonut items={insights.compilers} />
        </div>
      </div>
    </StoryLayout>
  )
}
