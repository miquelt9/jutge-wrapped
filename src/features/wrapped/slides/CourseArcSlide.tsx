import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import { CompilerDonut } from "@/components/CompilerDonut"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function CourseArcSlide({ insights }: Props) {
  const { t } = useTranslation()
  const { courseArc } = insights

  return (
    <StoryLayout
      eyebrow={t("slides.courseArc.eyebrow")}
      title={courseArc.title}
      subtitle={courseArc.subtitle}
    >
      <div className="jutge-panel">
        <div className="jutge-chart-panel-body flex w-full flex-col items-center justify-center py-6 sm:py-8">
          <div className="w-full max-w-[400px] px-2">
            <CompilerDonut items={insights.compilers} />
          </div>
        </div>
      </div>
    </StoryLayout>
  )
}
