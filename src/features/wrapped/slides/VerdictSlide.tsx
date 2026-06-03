import { useTranslation } from "react-i18next"
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
      <div className="jutge-panel">
        <div className="jutge-chart-panel-body flex w-full flex-col items-center justify-center py-6 sm:py-8">
          <div className="w-full max-w-[400px] px-2">
            <VerdictDonut items={insights.verdicts.items} />
          </div>
        </div>
      </div>
    </StoryLayout>
  )
}
