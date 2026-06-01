import { useEffect, useState, type FormEvent } from "react"
import { Calendar, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useWrappedPeriod } from "@/context/WrappedContext"
import { ThemeSelect } from "@/components/ThemeSelect"
import { heatmapBounds, type WrappedPeriod } from "@/features/wrapped/period"

export function DateRangePage() {
  const { client } = useAuth()
  const { setPeriod } = useWrappedPeriod()
  const [bounds, setBounds] = useState<{ min: string; max: string } | null>(null)
  const [loadingBounds, setLoadingBounds] = useState(true)
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  useEffect(() => {
    if (!client) return
    let cancelled = false
    ;(async () => {
      try {
        const heatmap = await client.student.dashboard.getHeatmapCalendar()
        if (!cancelled) {
          const b = heatmapBounds(heatmap)
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
  }, [client])

  function applyPeriod(period: WrappedPeriod) {
    setPeriod(period)
  }

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault()
    if (!start || !end || start > end) return
    applyPeriod({ start, end, label: `${start} – ${end}` })
  }

  function setPreset(preset: WrappedPeriod) {
    if (preset.start && preset.end) {
      setStart(preset.start)
      setEnd(preset.end)
    }
    applyPeriod(preset)
  }

  const year = new Date().getFullYear()

  return (
    <div className="jutge-page flex min-h-full flex-col">
      <header className="jutge-nav flex items-center justify-between px-4 py-3">
        <div>
          <span className="font-bold text-white">Jutge.org</span>
          <span className="ml-2 text-sm text-white/70">Wrapped — choose dates</span>
        </div>
        <ThemeSelect onDark />
      </header>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="jutge-panel w-full max-w-lg">
          <div className="jutge-panel-heading flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            When should we look?
          </div>
          <div className="jutge-panel-body">
            <p className="text-sm text-jutge-muted">
              Pick the dates for your Wrapped stats. Custom ranges are built from your submission
              history.
            </p>

            {loadingBounds ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-jutge-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your activity range…
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap gap-2">
                  <PresetButton
                    label="All time"
                    onClick={() => setPreset({ start: null, end: null, label: "All time" })}
                  />
                  {bounds && (
                    <PresetButton
                      label={`${year}`}
                      onClick={() =>
                        setPreset({
                          start: `${year}-01-01`,
                          end: `${year}-12-31`,
                          label: String(year),
                        })
                      }
                    />
                  )}
                  {bounds && (
                    <PresetButton
                      label="Last 12 months"
                      onClick={() => {
                        const endDate = bounds.max
                        const d = new Date(endDate)
                        d.setFullYear(d.getFullYear() - 1)
                        const startDate = d.toISOString().slice(0, 10)
                        setPreset({
                          start: startDate > bounds.min ? startDate : bounds.min,
                          end: endDate,
                          label: "Last 12 months",
                        })
                      }}
                    />
                  )}
                </div>

                <form
                  onSubmit={handleCustomSubmit}
                  className="mt-8 space-y-4 border-t border-jutge-border pt-6"
                >
                  <p className="jutge-eyebrow">Custom range</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="font-bold">From</span>
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
                      <span className="font-bold">To</span>
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
                    <p className="jutge-alert-danger">Start date must be on or before end date.</p>
                  )}
                  <button
                    type="submit"
                    disabled={!start || !end || start > end}
                    className="jutge-btn-primary w-full"
                  >
                    Build my Wrapped
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="jutge-btn-default">
      {label}
    </button>
  )
}
