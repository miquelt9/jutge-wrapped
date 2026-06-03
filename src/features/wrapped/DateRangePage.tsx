import { useEffect, useMemo, useState, type FormEvent } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Calendar, Loader2, LogOut } from "lucide-react"
import type { HeatmapCalendar } from "@/api/client"
import { SnapshotLoadButton } from "@/components/SnapshotLoadButton"
import { NavControls } from "@/components/NavControls"
import { useAuth } from "@/context/AuthContext"
import { useSnapshot } from "@/context/SnapshotContext"
import { useWrappedPeriod } from "@/context/WrappedContext"
import {
  clipPeriodPreset,
  clipPeriodToBounds,
  countHeatmapSubmissionsInPeriod,
  getCurrentAcademicYearRange,
  heatmapBounds,
  isValidDateRange,
  type WrappedPeriod,
} from "@/features/wrapped/period"

type PresetOption = {
  label: string
  period: WrappedPeriod
  disabled: boolean
  hint?: string
}

function buildPresetOption(
  start: string,
  end: string,
  label: string,
  bounds: { min: string; max: string },
  heatmap: HeatmapCalendar,
  t: TFunction,
): PresetOption {
  const clipped = clipPeriodToBounds(start, end, bounds)
  const period: WrappedPeriod = { start: clipped.start, end: clipped.end, label }

  if (!isValidDateRange(clipped.start, clipped.end)) {
    return {
      label,
      period,
      disabled: true,
      hint: t("dateRange.presetNoOverlap", { min: bounds.min, max: bounds.max, label }),
    }
  }

  const count = countHeatmapSubmissionsInPeriod(heatmap, period)
  if (count === 0) {
    return {
      label,
      period,
      disabled: true,
      hint: t("dateRange.presetNoSubmissions", {
        label,
        start: clipped.start,
        end: clipped.end,
      }),
    }
  }

  return { label, period, disabled: false }
}

export function DateRangePage() {
  const { t } = useTranslation()
  const { client } = useAuth()
  const { snapshot, isSnapshotMode, clearSnapshot } = useSnapshot()
  const { setPeriod } = useWrappedPeriod()
  const [heatmap, setHeatmap] = useState<HeatmapCalendar | null>(null)
  const [bounds, setBounds] = useState<{ min: string; max: string } | null>(null)
  const [loadingBounds, setLoadingBounds] = useState(true)
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  useEffect(() => {
    if (isSnapshotMode && snapshot) {
      const calendar = snapshot.dashboard.heatmap
      setHeatmap(calendar)
      const b = heatmapBounds(calendar)
      setBounds(b)
      if (b) {
        setStart(b.min)
        setEnd(b.max)
      }
      setLoadingBounds(false)
      return
    }

    if (!client) return
    let cancelled = false
    ;(async () => {
      try {
        const calendar = await client.student.dashboard.getHeatmapCalendar()
        if (!cancelled) {
          setHeatmap(calendar)
          const b = heatmapBounds(calendar)
          setBounds(b)
          if (b) {
            setStart(b.min)
            setEnd(b.max)
          }
        }
      } finally {
        if (!cancelled) setLoadingBounds(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [client, isSnapshotMode, snapshot])

  function applyPeriod(period: WrappedPeriod) {
    if (period.start && period.end && period.start > period.end) return
    setPeriod(period)
  }

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault()
    if (!start || !end || start > end) return
    applyPeriod({ start, end, label: `${start} – ${end}` })
  }

  function setPreset(period: WrappedPeriod) {
    if (period.start && period.end && period.start > period.end) return
    if (period.start && period.end) {
      setStart(period.start)
      setEnd(period.end)
    }
    applyPeriod(period)
  }

  const year = new Date().getFullYear()
  const allTimeLabel = t("period.allTime")
  const last12Label = t("period.last12Months")

  const presetOptions = useMemo((): PresetOption[] => {
    if (!bounds || !heatmap) return []

    const options: PresetOption[] = []

    const calendarYear = clipPeriodPreset(
      `${year}-01-01`,
      `${year}-12-31`,
      bounds,
      String(year),
    )
    if (calendarYear) {
      options.push(
        buildPresetOption(
          calendarYear.start!,
          calendarYear.end!,
          calendarYear.label,
          bounds,
          heatmap,
          t,
        ),
      )
    } else {
      options.push({
        label: String(year),
        period: {
          start: clipPeriodToBounds(`${year}-01-01`, `${year}-12-31`, bounds).start,
          end: clipPeriodToBounds(`${year}-01-01`, `${year}-12-31`, bounds).end,
          label: String(year),
        },
        disabled: true,
        hint: t("dateRange.presetNoOverlap", { min: bounds.min, max: bounds.max, label: year }),
      })
    }

    const endDate = bounds.max
    const d = new Date(endDate)
    d.setFullYear(d.getFullYear() - 1)
    const last12Start = d.toISOString().slice(0, 10)
    options.push(
      buildPresetOption(
        last12Start > bounds.min ? last12Start : bounds.min,
        endDate,
        last12Label,
        bounds,
        heatmap,
        t,
      ),
    )

    const academic = getCurrentAcademicYearRange()
    const academicPreset = clipPeriodPreset(academic.start, academic.end, bounds, academic.label)
    if (academicPreset) {
      options.push(
        buildPresetOption(
          academicPreset.start!,
          academicPreset.end!,
          academicPreset.label,
          bounds,
          heatmap,
          t,
        ),
      )
    } else {
      options.push({
        label: academic.label,
        period: {
          start: clipPeriodToBounds(academic.start, academic.end, bounds).start,
          end: clipPeriodToBounds(academic.start, academic.end, bounds).end,
          label: academic.label,
        },
        disabled: true,
        hint: t("dateRange.presetNoOverlap", {
          min: bounds.min,
          max: bounds.max,
          label: academic.label,
        }),
      })
    }

    return options
  }, [bounds, heatmap, year, t, last12Label])

  return (
    <div className="jutge-page flex min-h-full flex-col">
      <header className="jutge-nav flex items-center justify-between px-4 py-3">
        <div>
          <span className="font-bold text-white">{t("common.brand")}</span>
          <span className="ml-2 text-sm text-white/70">{t("dateRange.headerSuffix")}</span>
        </div>
        <div className="flex items-center gap-2">
          {isSnapshotMode && (
            <button
              type="button"
              onClick={clearSnapshot}
              className="jutge-btn-default flex items-center gap-1 border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> {t("deck.exit")}
            </button>
          )}
          <NavControls onDark />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="jutge-panel w-full max-w-lg">
          <div className="jutge-panel-heading flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t("dateRange.heading")}
          </div>
          <div className="jutge-panel-body">
            <p className="text-sm text-jutge-muted">{t("dateRange.intro")}</p>

            {loadingBounds ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-jutge-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("dateRange.loadingBounds")}
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap gap-2">
                  <PresetButton
                    label={allTimeLabel}
                    onClick={() => setPreset({ start: null, end: null, label: allTimeLabel })}
                  />
                  {presetOptions.map((preset) => (
                    <PresetButton
                      key={preset.label}
                      label={preset.label}
                      disabled={preset.disabled}
                      hint={preset.hint}
                      onClick={() => setPreset(preset.period)}
                    />
                  ))}
                </div>

                <form
                  onSubmit={handleCustomSubmit}
                  className="mt-8 space-y-4 border-t border-jutge-border pt-6"
                >
                  <p className="jutge-eyebrow">{t("dateRange.customRange")}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="font-bold">{t("dateRange.from")}</span>
                      <input
                        type="date"
                        required
                        min={bounds?.min}
                        max={bounds?.max}
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        className="jutge-input mt-1"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-bold">{t("dateRange.to")}</span>
                      <input
                        type="date"
                        required
                        min={bounds?.min}
                        max={bounds?.max}
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        className="jutge-input mt-1"
                      />
                    </label>
                  </div>
                  {start && end && start > end && (
                    <p className="jutge-alert-danger">{t("dateRange.invalidRange")}</p>
                  )}
                  <button
                    type="submit"
                    disabled={!start || !end || start > end}
                    className="jutge-btn-primary w-full"
                  >
                    {t("dateRange.buildWrapped")}
                  </button>
                </form>

                <div className="mt-8 border-t border-jutge-border pt-6">
                  <p className="text-xs text-jutge-muted">{t("dateRange.loadSnapshotHint")}</p>
                  <SnapshotLoadButton className="mt-3" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PresetButton({
  label,
  onClick,
  disabled = false,
  hint,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={`jutge-btn-default ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {label}
    </button>
  )
}
