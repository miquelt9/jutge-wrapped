/**
 * One-off: fill academic year 2025–26 (2025-09-01 … 2026-07-31 UTC) in a snapshot JSON.
 * Usage: node scripts/patch-snapshot-ay2526.mjs <path-to-snapshot.json>
 */
import fs from "node:fs"

const SNAPSHOT_PATH =
  process.argv[2] ??
  new URL(
    "../artifacts/snapshot-1780343576383.json",
    import.meta.url,
  ).pathname

const AY_START = "2025-09-01"
const AY_END = "2026-07-31"
const TARGET_ACTIVE_DAYS = 178
const TARGET_SUBMISSIONS = 872
const SEED = 0x2526

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function utcDayTsFromIso(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 1000)
}

function isoFromTs(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 10)
}

function heatmapBounds(heatmap) {
  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  return {
    min: isoFromTs(sorted[0].date),
    max: isoFromTs(sorted[sorted.length - 1].date),
  }
}

/** Sample daily submission counts from an existing block (e.g. 2026–27). */
function valueHistogramFromBlock(heatmap, rangeStart, rangeEnd) {
  const lo = utcDayTsFromIso(rangeStart)
  const hi = utcDayTsFromIso(rangeEnd)
  const counts = []
  for (const cell of heatmap) {
    if (cell.date >= lo && cell.date <= hi) counts.push(cell.value)
  }
  return counts.length ? counts : [1, 2, 3, 4, 5]
}

function sampleFrom(histogram, rng) {
  return histogram[Math.floor(rng() * histogram.length)]
}

function enumerateDays(startIso, endIso) {
  const days = []
  let ts = utcDayTsFromIso(startIso)
  const endTs = utcDayTsFromIso(endIso)
  while (ts <= endTs) {
    days.push(ts)
    ts += 86_400
  }
  return days
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function addProportional(dist, addCount) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const keys = Object.keys(dist)
  const out = { ...dist }
  const allocations = keys.map((k) => {
    const exact = (addCount * dist[k]) / total
    const base = Math.floor(exact)
    return { k, base, frac: exact - base }
  })
  let assigned = allocations.reduce((s, a) => s + a.base, 0)
  for (const a of allocations) out[a.k] = (out[a.k] ?? 0) + a.base
  const byFrac = [...allocations].sort((a, b) => b.frac - a.frac)
  let i = 0
  while (assigned < addCount) {
    out[byFrac[i % byFrac.length].k]++
    assigned++
    i++
  }
  return out
}

function generateAyHeatmap(allDays, valueHistogram, rng) {
  const picked = shuffleInPlace([...allDays], rng).slice(0, TARGET_ACTIVE_DAYS)
  const cells = picked.map((date) => ({
    date,
    value: sampleFrom(valueHistogram, rng),
  }))

  let total = cells.reduce((s, c) => s + c.value, 0)
  const maxPerDay = 12

  while (total < TARGET_SUBMISSIONS) {
    const cell = cells[Math.floor(rng() * cells.length)]
    if (cell.value >= maxPerDay) continue
    cell.value++
    total++
  }
  while (total > TARGET_SUBMISSIONS) {
    const candidates = cells.filter((c) => c.value > 1)
    if (!candidates.length) break
    const cell = candidates[Math.floor(rng() * candidates.length)]
    cell.value--
    total--
  }

  return { cells: cells.sort((a, b) => a.date - b.date), total }
}

const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8")
const snap = JSON.parse(raw)
const rng = mulberry32(SEED)

const valueHistogram = valueHistogramFromBlock(
  snap.dashboard.heatmap,
  "2026-09-01",
  "2027-07-31",
)

const ayDays = enumerateDays(AY_START, AY_END)
const existingInAy = snap.dashboard.heatmap.filter((c) => {
  const iso = isoFromTs(c.date)
  return iso >= AY_START && iso <= AY_END
})
if (existingInAy.length > 0) {
  console.warn(`Removing ${existingInAy.length} existing cells in ${AY_START}…${AY_END}`)
}
const withoutAy = snap.dashboard.heatmap.filter((c) => {
  const iso = isoFromTs(c.date)
  return iso < AY_START || iso > AY_END
})

const { cells: newCells, total: newSubmissions } = generateAyHeatmap(
  ayDays,
  valueHistogram,
  rng,
)

const mergedHeatmap = [...withoutAy, ...newCells].sort((a, b) => a.date - b.date)
const heatmapTotal = mergedHeatmap.reduce((s, c) => s + c.value, 0)

snap.dashboard.heatmap = mergedHeatmap
snap.dashboard.stats.number_of_submissions = heatmapTotal

const dist = snap.dashboard.distributions
dist.verdicts = addProportional(dist.verdicts, newSubmissions)
dist.compilers = addProportional(dist.compilers, newSubmissions)
dist.proglangs = addProportional(dist.proglangs, newSubmissions)
dist.submissions_by_hour = addProportional(dist.submissions_by_hour, newSubmissions)
dist.submissions_by_weekday = addProportional(
  dist.submissions_by_weekday,
  newSubmissions,
)

snap.period = { start: null, end: null, label: "All time" }

fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snap, null, 2)}\n`, "utf8")

const bounds = heatmapBounds(mergedHeatmap)
const inRange = mergedHeatmap.filter((c) => {
  const iso = isoFromTs(c.date)
  return iso >= AY_START && iso <= AY_END
})
const subsInRange = inRange.reduce((s, c) => s + c.value, 0)

console.log(
  JSON.stringify(
    {
      daysAdded: newCells.length,
      submissionsInRange: subsInRange,
      newSubmissionsAdded: newSubmissions,
      heatmapBounds: bounds,
      totalHeatmapEntries: mergedHeatmap.length,
      number_of_submissions: heatmapTotal,
      academicYearPreset: {
        start: AY_START,
        end: AY_END,
        label: "Academic year 2025–26",
        overlapsBounds:
          AY_START >= bounds.min && AY_END <= bounds.max
            ? "full"
            : AY_START <= bounds.max && AY_END >= bounds.min
              ? "partial"
              : "none",
      },
    },
    null,
    2,
  ),
)
