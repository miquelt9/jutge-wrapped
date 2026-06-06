import type { TFunction } from "i18next"
import { describe, expect, it } from "vitest"
import {
  exportFilename,
  getAwardsPerPage,
  getShareCacheKey,
  getSlideShareText,
} from "./shareExport"
import type { AwardItem, WrappedInsights } from "./types"

function makeAwardItem(id: string, title: string): AwardItem {
  return {
    awardId: id,
    title,
    info: "",
    iconUrl: `https://jutge.org/awards/${id}.png`,
    type: "fun",
    timeLabel: "Jan 2025",
    youtube: null,
    problemId: null,
    problemLabel: null,
  }
}

function makeAwardsInsights(count: number): WrappedInsights["awards"] {
  const items = Array.from({ length: count }, (_, index) =>
    makeAwardItem(`a${index}`, `Award ${index + 1}`),
  )
  return {
    count,
    items,
    featured: items[0] ?? null,
    title: `${count} awards`,
  }
}

const mockT = ((key: string, params?: Record<string, unknown>) => {
  if (key === "share.templates.awards") {
    return `AWARDS:${String(params?.count)}:${String(params?.title)}`
  }
  if (key === "share.templates.awardsPage") {
    return `PAGE:${String(params?.titles)}`
  }
  if (key === "share.makeYours") {
    return `PROMO:${String(params?.url)}`
  }
  return key
}) as TFunction

const awardsInsights = {
  displayName: "tester",
  level: "5",
  awards: makeAwardsInsights(12),
} as WrappedInsights

describe("getShareCacheKey", () => {
  it("returns slide id for non-awards slides", () => {
    expect(getShareCacheKey("intro")).toBe("intro")
    expect(getShareCacheKey("heatmap")).toBe("heatmap")
  })

  it("returns awards page key when awards page is provided", () => {
    expect(getShareCacheKey("awards", 0)).toBe("awards:0")
    expect(getShareCacheKey("awards", 3)).toBe("awards:3")
  })

  it("returns awards slide id when page is omitted", () => {
    expect(getShareCacheKey("awards")).toBe("awards")
  })
})

describe("getAwardsPerPage", () => {
  it("returns 5 for stacked and 10 for wide layouts", () => {
    expect(getAwardsPerPage(false)).toBe(5)
    expect(getAwardsPerPage(true)).toBe(10)
  })
})

describe("exportFilename", () => {
  it("includes awards page suffix when provided", () => {
    expect(exportFilename("alice", "awards", 2)).toBe(
      "jutge-wrapped-alice-awards-p3.png",
    )
  })

  it("keeps slide id for non-awards exports", () => {
    expect(exportFilename("alice", "intro")).toBe(
      "jutge-wrapped-alice-intro.png",
    )
  })
})

describe("getSlideShareText", () => {
  it("appends current page award titles for awards slide", () => {
    const text = getSlideShareText("awards", awardsInsights, mockT, {
      awardsPage: 1,
      awardsPerPage: 5,
    })

    expect(text).toContain("AWARDS:12:Award 1")
    expect(text).toContain("PAGE:Award 6 · Award 7 · Award 8 · Award 9 · Award 10")
    expect(text).toContain("PROMO:")
  })

  it("omits page line when awards page options are missing", () => {
    const text = getSlideShareText("awards", awardsInsights, mockT)

    expect(text).toContain("AWARDS:12:Award 1")
    expect(text).not.toContain("PAGE:")
  })
})
