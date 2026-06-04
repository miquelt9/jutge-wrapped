import type { TFunction } from "i18next"
import type { WrappedInsights } from "./types"

export const SLIDE_IDS = [
  "intro",
  "heatmap",
  "weekday",
  "chrono",
  "course",
  "verdict",
  "awards",
  "ranking",
] as const

export type SlideId = (typeof SLIDE_IDS)[number]

export function getActiveSlideIds(insights: WrappedInsights): SlideId[] {
  if (insights.awards.count === 0) {
    return SLIDE_IDS.filter((id) => id !== "awards")
  }
  return [...SLIDE_IDS]
}

/** True when the Web Share API can share files (typical mobile browsers). */
export function canUseNativeImageShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof window !== "undefined" &&
    window.isSecureContext
  )
}

export function getSlideShareText(
  slideId: SlideId,
  insights: WrappedInsights,
  t: TFunction,
): string {
  switch (slideId) {
    case "intro":
      return t("share.templates.intro", {
        level: insights.level,
        name: insights.displayName,
        accepted: insights.journey.acceptedProblems,
        submissions: insights.journey.totalSubmissions,
        acRate: insights.verdicts.acRate,
      })
    case "heatmap":
      return t("share.templates.heatmap", {
        activeDays: insights.heatmap.totalActiveDays,
        longestStreak: insights.heatmap.longestStreak,
      })
    case "weekday":
      return t("share.templates.weekday", {
        busiestDay: insights.weekday.peak?.label ?? "—",
      })
    case "chrono":
      return t("share.templates.chrono", {
        peakHour: String(insights.chrono.peakHour).padStart(2, "0"),
        archetype: insights.chrono.archetype,
      })
    case "course":
      return t("share.templates.course", {
        topLanguage: insights.courseArc.topProglang?.label ?? "—",
      })
    case "verdict":
      return t("share.templates.verdict", {
        ac: insights.verdicts.ac,
        acRate: insights.verdicts.acRate,
      })
    case "awards":
      return t("share.templates.awards", {
        count: insights.awards.count,
        title: insights.awards.featured?.title ?? "—",
      })
    case "ranking":
      return t("share.templates.ranking", {
        elite: insights.rank.eliteLabel,
      })
    default:
      return "Jutge.org Wrapped!"
  }
}

export function exportFilename(username: string, slideId: SlideId): string {
  const safe =
    username
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "user"
  return `jutge-wrapped-${safe}-${slideId}.png`
}

/** Synchronous data-URL → File conversion (preserves user activation for navigator.share). */
export function dataUrlToPngFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(",", 2)
  const mime = header?.match(/data:(.*?);base64/)?.[1] ?? "image/png"
  const binary = atob(base64 ?? "")
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], fileName, { type: mime })
}

/**
 * Capture a DOM node to a PNG data URL.
 *
 * `skipFonts` is intentional: the app loads a remote web font
 * (jutge.org Terminal.ttf) that html-to-image otherwise tries to fetch and
 * inline on every capture. That cross-origin fetch can hang indefinitely,
 * which previously caused the share button to load forever. Skipping font
 * embedding makes capture fast and reliable; the score font gracefully falls
 * back to the monospace stack defined in the CSS.
 */
export async function captureSlideImage(node: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image")
  return toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: true,
    backgroundColor: getComputedStyle(node).backgroundColor || undefined,
  })
}
