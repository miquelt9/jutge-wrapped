import { useTranslation } from "react-i18next"
import { StoryLayout } from "@/components/StoryLayout"
import type { WrappedInsights, WrappedRawData } from "../types"
import { IntroSlideBody } from "./intro/IntroSlideBody"

type Props = {
  raw: WrappedRawData
  insights: WrappedInsights
}

export function IntroSlide({ raw, insights }: Props) {
  const { t } = useTranslation()

  return (
    <StoryLayout
      eyebrow={t("slides.intro.eyebrow")}
      title={insights.displayName}
    >
      <IntroSlideBody raw={raw} insights={insights} />
    </StoryLayout>
  )
}
