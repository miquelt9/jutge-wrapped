import { motion, useReducedMotion } from "framer-motion"
import { Trans, useTranslation } from "react-i18next"
import {
  AnimatedCounter,
  AnimatedDescendingPercent,
} from "@/components/AnimatedCounter"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import { fadeUpHidden, fadeUpTransition, fadeUpVisible } from "@/components/motionPresets"
import { StoryLayout } from "@/components/StoryLayout"
import type { HomepageStats } from "@/api/client"
import type { WrappedInsights } from "../types"

type Props = {
  insights: WrappedInsights
  homepageStats: HomepageStats
}

export function RankingSlide({ insights, homepageStats }: Props) {
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { rank, journey, weekday, courseArc, verdicts } = insights

  return (
    <StoryLayout
      eyebrow={t("slides.ranking.eyebrow")}
      title={`${insights.level} · ${insights.displayName}`}
      subtitle={insights.periodLabel}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <motion.div
          className="jutge-metric-blue flex min-h-40 flex-col justify-center p-8 sm:min-h-40"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.12)}
        >
          <p className="jutge-score text-2xl leading-tight sm:text-4xl">
            <Trans
              i18nKey="rank.eliteLabelAnimated"
              components={[
                <AnimatedDescendingPercent
                  key="percent"
                  value={rank.topPercent}
                  showSuffix={false}
                />,
              ]}
            />
          </p>
        </motion.div>
        <motion.img
          src={`${import.meta.env.BASE_URL}jutge.png`}
          alt={t("slides.ranking.judgeAlt")}
          className="border-jutge-border mx-auto hidden h-40 w-40 border bg-white object-contain p-2 lg:block"
          style={{ borderRadius: 0 }}
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.2)}
        />
      </div>
      <StaggerGroup className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <RecapItem
          label={t("slides.ranking.problems")}
          value={journey.acceptedProblems}
        />
        <RecapItem
          label={t("slides.ranking.submissions")}
          value={journey.totalSubmissions}
        />
        <RecapItem
          label={t("slides.ranking.topLanguage")}
          value={courseArc.topProglang?.label ?? "—"}
        />
        <RecapItem
          label={t("slides.ranking.busiestDay")}
          value={weekday.peak?.label ?? "—"}
        />
        <RecapItem
          label={t("slides.ranking.acRuns")}
          value={verdicts.ac}
        />
        <RecapItem
          label={t("slides.ranking.platformSubs")}
          value={homepageStats.submissions}
          locale={i18n.language}
        />
      </StaggerGroup>
    </StoryLayout>
  )
}

function RecapItem({
  label,
  value,
  locale,
}: {
  label: string
  value: number | string
  locale?: string
}) {
  return (
    <StaggerItem className="jutge-panel">
      <div className="jutge-panel-body py-3">
        <dt className="text-jutge-muted text-xs font-bold uppercase">
          {label}
        </dt>
        <dd className="jutge-score text-jutge-blue mt-1 text-lg">
          {typeof value === "number" ? (
            <AnimatedCounter value={value} locale={locale} />
          ) : (
            value
          )}
        </dd>
      </div>
    </StaggerItem>
  )
}
