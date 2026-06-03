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
      subtitle={insights.verdicts.narrative}
    >
      <div className="jutge-panel">
        <div className="jutge-panel-body flex flex-col items-center justify-center py-8">
          <VerdictDonut items={insights.verdicts.items} />
        </div>
      </div>
    </StoryLayout>
  )
}
