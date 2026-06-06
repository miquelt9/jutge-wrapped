/**
 * Script to generate a realistic fictitious student snapshot for the years 2024 to 2026.
 * It reads the original snapshot, shifts the timeline of submissions and awards,
 * and regenerates all dashboard stats, heatmap, and distributions.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const ORIGINAL_SNAPSHOT_PATH = path.join(rootDir, "artifacts", "snapshot-1780610346162.json");
const OUTPUT_SNAPSHOT_PATH = path.join(rootDir, "artifacts", "snapshot-fictitious-2024-2026.json");

// Define original and target timelines
const OLD_START = new Date("2020-09-21T00:00:00.000Z").getTime();
const OLD_END = new Date("2025-07-16T23:59:59.000Z").getTime();
const NEW_START = new Date("2024-09-01T00:00:00.000Z").getTime();
const NEW_END = new Date("2026-06-01T23:59:59.000Z").getTime();

function scaleTime(isoString) {
  const t = new Date(isoString).getTime();
  const scaled = NEW_START + ((t - OLD_START) * (NEW_END - NEW_START)) / (OLD_END - OLD_START);
  return new Date(scaled).toISOString();
}

function main() {
  console.log("Reading original snapshot...");
  if (!fs.existsSync(ORIGINAL_SNAPSHOT_PATH)) {
    console.error(`Original snapshot not found at: ${ORIGINAL_SNAPSHOT_PATH}`);
    process.exit(1);
  }

  const snap = JSON.parse(fs.readFileSync(ORIGINAL_SNAPSHOT_PATH, "utf8"));

  console.log("Generating fictitious student profile...");
  const fictitiousUid = "f10ba1ac10f1b0dac10f1b0dac10f1b0";
  
  snap.exportedAt = new Date("2026-06-06T12:00:00.000Z").toISOString();
  snap.credentials = {
    user_uid: fictitiousUid,
    expiration: new Date("2026-06-07T12:00:00.000Z").toISOString(),
  };

  snap.profile = {
    user_uid: fictitiousUid,
    username: null,
    nickname: "fiona_fibonacci",
    name: "Fiona Fibonacci",
    email: "fiona.fibonacci@estudiantat.upc.edu",
    webpage: null,
    description: "Web registered user",
    affiliation: null,
    country_id: "ES-Cat",
    birth_year: 2005,
    max_subsxhour: 20,
    max_subsxday: 100,
    administrator: 0,
    instructor: 0,
    language_id: "en",
    timezone_id: "Europe/Madrid",
    compiler_id: "G++20",
    parent_email: null,
  };

  snap.avatar = null;
  snap.level = "Master";
  snap.absoluteRanking = 246;

  console.log("Shifting submissions timeline...");
  const newSubmissions = snap.submissions.map((s) => {
    return {
      ...s,
      time_in: scaleTime(s.time_in),
    };
  });

  // Sort submissions by time_in descending
  newSubmissions.sort((a, b) => new Date(b.time_in).getTime() - new Date(a.time_in).getTime());
  snap.submissions = newSubmissions;

  console.log("Shifting awards timeline...");
  const newAwards = {};
  for (const [awardId, a] of Object.entries(snap.awards)) {
    newAwards[awardId] = {
      ...a,
      time: scaleTime(a.time),
    };
  }
  snap.awards = newAwards;

  console.log("Recomputing dashboard stats, heatmap, and distributions...");
  
  // 1. Heatmap
  const heatmapGroups = {};
  for (const s of newSubmissions) {
    const dateStr = s.time_in.slice(0, 10);
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateTs = Math.floor(Date.UTC(y, m - 1, d) / 1000);
    heatmapGroups[dateTs] = (heatmapGroups[dateTs] || 0) + 1;
  }

  const newHeatmap = Object.entries(heatmapGroups).map(([date, value]) => ({
    date: Number(date),
    value,
  }));
  newHeatmap.sort((a, b) => a.date - b.date);
  snap.dashboard.heatmap = newHeatmap;

  // 2. Stats
  const uniqueProblems = new Set(newSubmissions.map((s) => s.problem_id));
  const acceptedProblems = new Set(
    newSubmissions.filter((s) => s.veredict === "AC").map((s) => s.problem_id)
  );
  
  const rejectedProblems = new Set();
  for (const probId of uniqueProblems) {
    if (!acceptedProblems.has(probId)) {
      rejectedProblems.add(probId);
    }
  }

  snap.dashboard.stats = {
    number_of_accepted_problems: acceptedProblems.size,
    number_of_rejected_problems: rejectedProblems.size,
    number_of_submissions: newSubmissions.length,
  };

  // 3. Distributions
  const verdictsDist = {};
  const compilersDist = {};
  const proglangsDist = {};
  const hourDist = {};
  const weekdayDist = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };

  // Initialize hour distribution with 0s
  for (let h = 0; h < 24; h++) {
    hourDist[String(h).padStart(2, "0")] = 0;
  }

  const compilersTable = snap.tables.compilers;

  for (const s of newSubmissions) {
    // Verdicts
    const v = s.veredict;
    verdictsDist[v] = (verdictsDist[v] || 0) + 1;

    // Compilers
    const c = s.compiler_id;
    compilersDist[c] = (compilersDist[c] || 0) + 1;

    // Proglangs
    const compInfo = compilersTable[c];
    if (compInfo && compInfo.language) {
      const lang = compInfo.language;
      proglangsDist[lang] = (proglangsDist[lang] || 0) + 1;
    }

    // Hour of day in Europe/Madrid
    const dateObj = new Date(s.time_in);
    const hourParts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/Madrid",
    }).formatToParts(dateObj);
    let hourStr = hourParts.find((p) => p.type === "hour").value;
    if (hourStr === "24") hourStr = "00"; // Handle some environments formatting midnight as 24
    hourDist[hourStr] = (hourDist[hourStr] || 0) + 1;

    // Weekday in Europe/Madrid
    const weekdayStr = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "Europe/Madrid",
    })
      .format(dateObj)
      .toLowerCase();
    weekdayDist[weekdayStr] = (weekdayDist[weekdayStr] || 0) + 1;
  }

  snap.dashboard.distributions = {
    verdicts: verdictsDist,
    compilers: compilersDist,
    proglangs: proglangsDist,
    submissions_by_hour: hourDist,
    submissions_by_weekday: weekdayDist,
  };

  // Reset period to All time
  snap.period = { start: null, end: null, label: "All time" };

  console.log("Writing fictitious snapshot to disk...");
  fs.writeFileSync(OUTPUT_SNAPSHOT_PATH, JSON.stringify(snap, null, 2), "utf8");

  console.log("\nFictitious student snapshot generated successfully!");
  console.log(`Output file: ${OUTPUT_SNAPSHOT_PATH}`);
  console.log(`Total Submissions: ${newSubmissions.length}`);
  console.log(`Accepted Problems: ${acceptedProblems.size}`);
  console.log(`Rejected Problems: ${rejectedProblems.size}`);
  console.log(`Date range in Heatmap: ${new Date(newHeatmap[0].date * 1000).toISOString().slice(0, 10)} to ${new Date(newHeatmap[newHeatmap.length - 1].date * 1000).toISOString().slice(0, 10)}`);
}

main();
