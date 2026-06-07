import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { useAppReducedMotion as useReducedMotion } from "@/context/SlideExportModeContext"
import { Clock, Code2, Gavel, Send, Trophy } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { AnimatedDescendingPercent, AnimatedPercent } from "@/components/AnimatedCounter"
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/components/motionPresets"
import { StoryLayout } from "@/components/StoryLayout"
import { StaggerGroup, StaggerItem } from "@/components/StaggerReveal"
import { useLayoutVariant } from "@/hooks/useLayoutVariant"
import { formatMinutes, formatSubmissions } from "@/i18n/plurals"
import { WRAPPED_APP_URL } from "../shareExport"
import type { WrappedInsights, WrappedRawData } from "../types"

type Props = {
  raw: WrappedRawData
  insights: WrappedInsights
}

function resolveYearRange(insights: WrappedInsights): string {
  const yearValues = insights.heatmap.yearBlocks
    .map((block) => block.year)
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => a - b)

  if (yearValues.length > 0) {
    const startYear = yearValues[0]!
    const endYear = yearValues[yearValues.length - 1]!
    return startYear === endYear ? String(startYear) : `${startYear}-${endYear}`
  }

  const fallbackYears = [insights.journey.firstActive, insights.journey.lastActive]
    .flatMap((label) => (label ? label.match(/\d{4}/g) ?? [] : []))
    .map(Number)
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => a - b)

  if (fallbackYears.length === 0) return String(new Date().getFullYear())
  const startYear = fallbackYears[0]!
  const endYear = fallbackYears[fallbackYears.length - 1]!
  return startYear === endYear ? String(startYear) : `${startYear}-${endYear}`
}

export function ShareRecapSlide({ raw, insights }: Props) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const layout = useLayoutVariant()
  const estimatedMinutes = insights.journey.estimatedActiveMinutes
  const yearRange = resolveYearRange(insights)
  const profileName = raw.profile.name || raw.profile.nickname || raw.profile.email
  const estimatedTime =
    estimatedMinutes === null
      ? t("slides.recap.timeUnavailable")
      : formatMinutes(t, estimatedMinutes)
  const topLanguage =
    insights.courseArc.topProglang?.label ?? t("courseArc.fallbackLang")

  const isStacked = layout === "stacked"
  const gridClass = isStacked
    ? "grid w-full min-w-0 grid-cols-2 gap-3"
    : "grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3"
  const tileOrder = isStacked
    ? {
        ranking: 1,
        submissions: 3,
        language: 5,
        time: 2,
        ac: 4,
        profile: 6,
      }
    : {
        ranking: 1,
        submissions: 2,
        language: 3,
        time: 4,
        ac: 5,
        profile: 6,
      }

  return (
    <StoryLayout title={t("slides.recap.title", { yearRange })}>
      <div className="flex flex-col gap-5 pt-3 sm:pt-1">
        <StaggerGroup className={gridClass}>
          <RecapMetricCard
            icon={<Trophy className="h-6 w-6" />}
            label={t("slides.recap.ranking")}
            compact={isStacked}
            variant="blue"
            order={tileOrder.ranking}
          >
            <p
              className={`jutge-score mt-1 leading-tight ${
                isStacked ? "text-lg" : "text-xl sm:text-2xl"
              }`}
            >
              <Trans
                i18nKey="rank.eliteLabelAnimated"
                components={[
                  <AnimatedDescendingPercent
                    key="percent"
                    value={insights.rank.topPercent}
                    showSuffix={false}
                    className="text-inherit"
                  />,
                ]}
              />
            </p>
          </RecapMetricCard>

          <RecapMetricCard
            icon={<Send className="h-6 w-6" />}
            label={t("slides.recap.totalSubmissions")}
            compact={isStacked}
            variant="orange"
            order={tileOrder.submissions}
          >
            <p
              className={`jutge-score mt-1 leading-tight ${
                isStacked ? "text-lg" : "text-xl"
              }`}
            >
              {formatSubmissions(t, insights.journey.totalSubmissions)}
            </p>
          </RecapMetricCard>

          <RecapMetricCard
            icon={<Code2 className="h-6 w-6" />}
            label={t("slides.recap.topLanguage")}
            value={topLanguage}
            compact={isStacked}
            variant="neutral"
            order={tileOrder.language}
            valueClassName={isStacked ? "text-xl" : "text-2xl"}
          />

          <RecapMetricCard
            icon={<Clock className="h-6 w-6" />}
            label={t("slides.recap.estimatedTime")}
            value={estimatedTime}
            compact={isStacked}
            variant="primary"
            order={tileOrder.time}
            valueClassName={isStacked ? "text-xl" : "text-2xl"}
          />

          <RecapMetricCard
            icon={<Gavel className="h-6 w-6" />}
            label={t("slides.recap.acRate")}
            compact={isStacked}
            variant="blue"
            order={tileOrder.ac}
          >
            <p
              className={`jutge-score mt-1 ${
                isStacked ? "text-xl" : "text-2xl"
              }`}
            >
              <AnimatedPercent value={insights.verdicts.acRate} decimals={1} />
            </p>
          </RecapMetricCard>

          <StaggerItem
            className={`jutge-panel ${isStacked ? "p-4 pb-6" : "p-5"}`}
            style={{ order: tileOrder.profile }}
          >
            <div className="flex h-full items-center gap-3">
              <div
                className="border-jutge-border bg-jutge-panel h-14 w-14 shrink-0 overflow-hidden border sm:h-16 sm:w-16"
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
              <div className="min-w-0 text-left">
                <p
                  className={`jutge-score text-jutge-blue leading-tight ${
                    isStacked ? "text-xl" : "text-2xl"
                  }`}
                >
                  {insights.level}
                </p>
                <p className="text-jutge-muted mt-1 line-clamp-2 break-words text-sm leading-snug">
                  {profileName}
                </p>
              </div>
            </div>
          </StaggerItem>
        </StaggerGroup>

        <motion.p
          className="text-jutge-muted text-center text-xs sm:text-left"
          initial={fadeUpHidden(reduceMotion)}
          animate={fadeUpVisible()}
          transition={fadeUpTransition(reduceMotion, 0.28)}
        >
          <Trans
            i18nKey="slides.recap.footer"
            values={{ url: WRAPPED_APP_URL }}
            components={[
              <a
                key="url"
                href={WRAPPED_APP_URL}
                target="_blank"
                rel="noreferrer"
                className="text-jutge-blue font-semibold hover:underline"
              />,
            ]}
          />
        </motion.p>
      </div>
    </StoryLayout>
  )
}

function RecapMetricCard({
  icon,
  label,
  value,
  children,
  variant,
  compact,
  valueClassName,
  order,
}: {
  icon: ReactNode
  label: string
  value?: string
  children?: ReactNode
  variant: "blue" | "primary" | "orange" | "neutral"
  compact?: boolean
  valueClassName?: string
  order?: number
}) {
  const cls = {
    blue: "jutge-metric-blue",
    primary: "jutge-metric-primary",
    orange: "jutge-metric-orange",
    neutral: "jutge-metric-neutral",
  }[variant]

  const resolvedValueClass =
    valueClassName ?? (compact ? "text-3xl" : "text-4xl")

  return (
    <StaggerItem
      className={`${compact ? "p-4 pb-6" : "p-5"} ${cls}`}
      style={order === undefined ? undefined : { order }}
    >
      {icon}
      <p className="mt-2 text-xs font-bold uppercase opacity-90 sm:mt-3">
        {label}
      </p>
      {children ?? (
        <p className={`jutge-score mt-1 ${resolvedValueClass}`}>{value}</p>
      )}
    </StaggerItem>
  )
}
