import { useTranslation } from "react-i18next"
import { CompilerDonut } from "@/components/CompilerDonut"
import { DonutChartPanel } from "@/components/DonutChartPanel"
import { StoryLayout } from "@/components/StoryLayout"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function CourseArcSlide({ insights }: Props) {
  const { t } = useTranslation()
  const { courseArc } = insights

  return (
    <StoryLayout
      title={t("slides.courseArc.title")}
      subtitle={courseArc.subtitle}
    >
      <DonutChartPanel>
        {(displaySize) => (
          <CompilerDonut
            items={insights.compilers}
            displaySize={displaySize}
            fill
          />
        )}
      </DonutChartPanel>
    </StoryLayout>
  )
}
