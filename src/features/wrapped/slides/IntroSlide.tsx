import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Trans, useTranslation } from "react-i18next"
import { ThumbsDown, ThumbsUp, Send, Gavel } from "lucide-react"
import { AnimatedCounter, AnimatedPercent } from "@/components/AnimatedCounter"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import { fadeUpHidden, fadeUpTransition, fadeUpVisible } from "@/components/motionPresets"
import type {
  HeroMomentInsight,
  WrappedInsights,
  WrappedRawData,
} from "../types"
import { jutgeProblemUrl } from "../jutgeLinks"
import { StoryLayout } from "@/components/StoryLayout"

type Props = {
  raw: WrappedRawData
  insights: WrappedInsights
}

export function IntroSlide({ raw, insights }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
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
          <motion.div
            className="jutge-panel w-full min-w-0 lg:w-auto lg:min-w-[18rem] lg:flex-none"
            initial={fadeUpHidden(reduceMotion)}
            animate={fadeUpVisible()}
            transition={fadeUpTransition(reduceMotion, 0.08)}
          >
            <div className="jutge-panel-body flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div
                className="border-jutge-border bg-jutge-panel h-24 w-24 shrink-0 overflow-hidden border sm:h-32 sm:w-32"
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
                <p className="text-jutge-muted text-xs font-bold uppercase">
                  {t("slides.intro.judgeLevel")}
                </p>
                <p className="jutge-score text-jutge-blue text-2xl">{level}</p>
                <p className="text-jutge-muted mt-1 text-sm">
                  {raw.profile.name || raw.profile.email}
                </p>
              </div>
            </div>
          </motion.div>
          <StaggerGroup className="grid w-full min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              percent={insights.verdicts.acRate}
              percentDecimals={1}
              text
              variant="blue"
            />
          </StaggerGroup>
        </div>
        {personalized.introActivity && (
          <motion.p
            className="text-jutge-muted text-sm"
            initial={fadeUpHidden(reduceMotion)}
            animate={fadeUpVisible()}
            transition={fadeUpTransition(reduceMotion, 0.28)}
          >
            {personalized.introActivity}
          </motion.p>
        )}
        {hero && (
          <motion.div
            className="jutge-panel border-l-jutge-blue border-l-4"
            initial={fadeUpHidden(reduceMotion)}
            animate={fadeUpVisible()}
            transition={fadeUpTransition(reduceMotion, 0.34)}
          >
            <div className="jutge-panel-body">
              <p className="text-jutge-muted text-xs font-bold uppercase">
                {t("personalization.hero.label")}
              </p>
              <p className="jutge-score text-jutge-text mt-1 text-lg">
                <HeroHeadline hero={hero} />
              </p>
              <p className="text-jutge-muted mt-1 text-sm">{hero.detail}</p>
            </div>
          </motion.div>
        )}
      </div>
    </StoryLayout>
  )
}

const HERO_HEADLINE_KEYS = {
  grind: "personalization.hero.grindHeadline",
  most_attempted: "personalization.hero.mostAttemptedHeadline",
  first_ac: "personalization.hero.firstAcHeadline",
} as const

function HeroHeadline({ hero }: { hero: HeroMomentInsight }) {
  return (
    <Trans
      i18nKey={HERO_HEADLINE_KEYS[hero.kind]}
      values={{ problem: hero.problemLabel }}
      components={[
        <a
          key="0"
          href={jutgeProblemUrl(hero.problemId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-jutge-blue hover:underline"
        />,
      ]}
    />
  )
}

function MetricCard({
  icon,
  label,
  value,
  percent,
  percentDecimals = 0,
  variant,
  text,
}: {
  icon: ReactNode
  label: string
  value?: number
  percent?: number
  percentDecimals?: number
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
    <StaggerItem className={`p-5 ${cls}`}>
      {icon}
      <p className="mt-3 text-xs font-bold uppercase opacity-90">{label}</p>
      <p className={`jutge-score mt-1 ${text ? "text-2xl" : "text-4xl"}`}>
        {percent != null ? (
          <AnimatedPercent value={percent} decimals={percentDecimals} />
        ) : value != null ? (
          <AnimatedCounter value={value} />
        ) : null}
      </p>
    </StaggerItem>
  )
}
