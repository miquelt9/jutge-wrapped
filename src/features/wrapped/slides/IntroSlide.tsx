import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ThumbsDown, ThumbsUp, Send, Gavel } from "lucide-react"
import type { WrappedInsights, WrappedRawData } from "../types"
import { StoryLayout } from "@/components/StoryLayout"

type Props = {
  raw: WrappedRawData
  insights: WrappedInsights
}

export function IntroSlide({ raw, insights }: Props) {
  const { t } = useTranslation()
  const { journey, level, personalized } = insights
  const hero = personalized.heroMoment

  return (
    <StoryLayout
      eyebrow={t("slides.intro.eyebrow")}
      title={insights.displayName}
      subtitle={personalized.introSubtitle}
    >
      <div className="flex flex-col gap-6">
        <div className="flex min-w-0 flex-col items-start gap-6 lg:flex-row lg:items-center">
          <div className="jutge-panel w-full min-w-0">
            <div className="jutge-panel-body flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div
                className="h-24 w-24 shrink-0 overflow-hidden border border-jutge-border bg-jutge-panel sm:h-32 sm:w-32"
                style={{ borderRadius: 0 }}
              >
                {raw.avatarUrl ? (
                  <img
                    src={raw.avatarUrl}
                    alt={t("slides.intro.avatarAlt")}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <img
                    src={`${import.meta.env.BASE_URL}jutge.png`}
                    alt={t("slides.intro.mascotAlt")}
                    className="h-full w-full object-cover object-center"
                  />
                )}
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-xs font-bold uppercase text-jutge-muted">
                  {t("slides.intro.judgeLevel")}
                </p>
                <p className="jutge-score text-2xl text-jutge-blue">{level}</p>
                <p className="mt-1 text-sm text-jutge-muted">
                  {raw.profile.name || raw.profile.email}
                </p>
              </div>
            </div>
          </div>
          <div className="grid w-full flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={<ThumbsUp className="h-6 w-6" />}
              label={t("slides.intro.acceptedProblems")}
              value={journey.acceptedProblems}
              variant="green"
            />
            <MetricCard
              icon={<ThumbsDown className="h-6 w-6" />}
              label={t("slides.intro.rejectedProblems")}
              value={journey.rejectedProblems}
              variant="red"
            />
            <MetricCard
              icon={<Send className="h-6 w-6" />}
              label={t("slides.intro.submissions")}
              value={journey.totalSubmissions}
              variant="orange"
            />
            <MetricCard
              icon={<Gavel className="h-6 w-6" />}
              label={t("slides.intro.acRate")}
              value={`${insights.verdicts.acRate}%`}
              text
              variant="blue"
            />
          </div>
        </div>
        {personalized.introActivity && (
          <p className="text-sm text-jutge-muted">{personalized.introActivity}</p>
        )}
        {hero && (
          <div className="jutge-panel border-l-4 border-l-jutge-blue">
            <div className="jutge-panel-body">
              <p className="text-xs font-bold uppercase text-jutge-muted">
                {t("personalization.hero.label")}
              </p>
              <p className="jutge-score mt-1 text-lg text-jutge-text">{hero.headline}</p>
              <p className="mt-1 text-sm text-jutge-muted">{hero.detail}</p>
            </div>
          </div>
        )}
      </div>
    </StoryLayout>
  )
}

function MetricCard({
  icon,
  label,
  value,
  variant,
  text,
}: {
  icon: ReactNode
  label: string
  value: number | string
  variant: "green" | "red" | "orange" | "blue"
  text?: boolean
}) {
  const cls = {
    green: "jutge-metric-green",
    red: "jutge-metric-red",
    orange: "jutge-metric-orange",
    blue: "jutge-metric-blue",
  }[variant]

  return (
    <div className={`p-5 ${cls}`}>
      {icon}
      <p className="mt-3 text-xs font-bold uppercase opacity-90">{label}</p>
      <p className={`jutge-score mt-1 ${text ? "text-2xl" : "text-4xl"}`}>{value}</p>
    </div>
  )
}
