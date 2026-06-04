import { useTranslation } from "react-i18next"
import { DonutChartPanel } from "@/components/DonutChartPanel"
import { StoryLayout } from "@/components/StoryLayout"
import { VerdictDonut } from "@/components/VerdictDonut"
import type { WrappedInsights } from "../types"

type Props = { insights: WrappedInsights }

export function VerdictSlide({ insights }: Props) {
  const { t } = useTranslation()

  return (
    <StoryLayout
      eyebrow={t("slides.verdict.eyebrow")}
      title={t("slides.verdict.title")}
    >
      <DonutChartPanel>
        {(displaySize) => (
          <VerdictDonut
            items={insights.verdicts.items}
            displaySize={displaySize}
            fill
          />
        )}
      </DonutChartPanel>
    </StoryLayout>
  )
}
