import type { TFunction } from "i18next"
import type { WrappedInsights } from "./types"

export const SLIDE_IDS = [
  "intro",
  "heatmap_stats",
  "heatmap_calendar",
  "rhythm",
  "course",
  "verdict",
  "awards",
  "ranking",
  "performance",
  "recap",
] as const

export type SlideId = (typeof SLIDE_IDS)[number]

export type ShareCacheKey = SlideId | `awards:${number}`

export const WRAPPED_APP_URL = "https://miquelt9.github.io/jutge-wrapped/"

export const AWARDS_PER_PAGE_STACKED = 5
export const AWARDS_PER_PAGE_WIDE = 10

export function getAwardsPerPage(isWide: boolean): number {
  return isWide ? AWARDS_PER_PAGE_WIDE : AWARDS_PER_PAGE_STACKED
}

export function getShareCacheKey(
  slideId: SlideId,
  awardsPage?: number,
): ShareCacheKey {
  if (slideId === "awards" && awardsPage !== undefined) {
    return `awards:${awardsPage}`
  }
  return slideId
}

export function getActiveSlideIds(insights: WrappedInsights): SlideId[] {
  if (insights.awards.count === 0) {
    return SLIDE_IDS.filter((id) => id !== "awards")
  }
  return [...SLIDE_IDS]
}

/** True when the Web Share API can share files (typical mobile browsers). */
export function canShareFiles(): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function"
  ) {
    return false
  }
  if (typeof window === "undefined" || !window.isSecureContext) {
    return false
  }
  if (typeof navigator.canShare !== "function" || typeof File === "undefined") {
    return false
  }
  try {
    const dummyFile = new File([""], "probe.png", { type: "image/png" })
    return navigator.canShare({ files: [dummyFile] })
  } catch {
    return false
  }
}

export type SlideShareTextOptions = {
  awardsPage?: number
  awardsPerPage?: number
}

function slideShareTemplate(
  slideId: SlideId,
  insights: WrappedInsights,
  t: TFunction,
  options?: SlideShareTextOptions,
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
    case "heatmap_stats":
      return t("share.templates.heatmap_stats", {
        activeDays: insights.heatmap.totalActiveDays,
        longestStreak: insights.heatmap.longestStreak,
      })
    case "heatmap_calendar":
      return t("share.templates.heatmap_calendar", {
        activeDays: insights.heatmap.totalActiveDays,
        submissions: insights.heatmap.totalSubmissions,
      })
    case "rhythm":
      return t("share.templates.rhythm", {
        busiestDay: insights.weekday.peak?.label ?? "—",
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
    case "awards": {
      const base = t("share.templates.awards", {
        count: insights.awards.count,
        title: insights.awards.featured?.title ?? "—",
      })
      const { awardsPage, awardsPerPage } = options ?? {}
      if (awardsPage === undefined || awardsPerPage === undefined) {
        return base
      }
      const pageStart = awardsPage * awardsPerPage
      const pageTitles = insights.awards.items
        .slice(pageStart, pageStart + awardsPerPage)
        .map((award) => award.title)
      if (pageTitles.length === 0) return base
      const pageLine = t("share.templates.awardsPage", {
        titles: pageTitles.join(" · "),
      })
      return `${base}\n${pageLine}`
    }
    case "ranking":
      return t("share.templates.ranking", {
        elite: insights.rank.eliteLabel,
      })
    case "performance":
      return t("share.templates.performance", {
        rank: insights.rank.rank,
      })
    case "recap":
      return t("share.templates.recap", {
        minutes: insights.journey.estimatedActiveMinutes ?? 0,
        accepted: insights.journey.acceptedProblems,
        submissions: insights.journey.totalSubmissions,
      })
    default:
      return "Jutge.org Wrapped!"
  }
}

export function getSlideShareText(
  slideId: SlideId,
  insights: WrappedInsights,
  t: TFunction,
  options?: SlideShareTextOptions,
): string {
  const template = slideShareTemplate(slideId, insights, t, options)
  const promo = t("share.makeYours", { url: WRAPPED_APP_URL })
  return `${template}\n\n${promo}`
}

export function exportFilename(
  username: string,
  slideId: SlideId,
  awardsPage?: number,
): string {
  const safe =
    username
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "user"
  const slidePart =
    slideId === "awards" && awardsPage !== undefined
      ? `${slideId}-p${awardsPage + 1}`
      : slideId
  return `jutge-wrapped-${safe}-${slidePart}.png`
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

export function isCaptureAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

function throwIfCaptureAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Capture aborted", "AbortError")
  }
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
export async function captureSlideImage(
  node: HTMLElement,
  options?: { signal?: AbortSignal },
): Promise<string> {
  throwIfCaptureAborted(options?.signal)
  const { toPng } = await import("html-to-image")
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: true,
    backgroundColor: getComputedStyle(node).backgroundColor || undefined,
  })
  throwIfCaptureAborted(options?.signal)
  return dataUrl
}
