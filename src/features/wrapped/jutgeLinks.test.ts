import { describe, expect, it } from "vitest"
import {
  jutgeAwardIconUrl,
  jutgeAwardUrl,
  jutgeProblemUrl,
  jutgeYoutubeUrl,
  resolveAwardYoutube,
} from "./jutgeLinks"

describe("jutgeProblemUrl", () => {
  it("builds a Jutge problem page URL from the problem id", () => {
    expect(jutgeProblemUrl("X35277")).toBe("https://jutge.org/problems/X35277")
  })
})

describe("jutgeAwardUrl", () => {
  it("builds a Jutge profile award page URL from the award id", () => {
    expect(jutgeAwardUrl("A001238324")).toBe(
      "https://jutge.org/profile/awards/A001238324",
    )
  })
})

describe("resolveAwardYoutube", () => {
  it("returns null for known unreachable video ids", () => {
    expect(resolveAwardYoutube("q5r3qNgB5v8")).toBeNull()
    expect(resolveAwardYoutube("https://youtu.be/q5r3qNgB5v8")).toBeNull()
  })

  it("returns the original value for reachable ids", () => {
    expect(resolveAwardYoutube("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })
})

describe("jutgeYoutubeUrl", () => {
  it("returns absolute URLs unchanged", () => {
    expect(jutgeYoutubeUrl("https://youtu.be/abc123")).toBe(
      "https://youtu.be/abc123",
    )
  })

  it("builds a watch URL from a bare video id", () => {
    expect(jutgeYoutubeUrl("abc123")).toBe(
      "https://www.youtube.com/watch?v=abc123",
    )
  })
})

describe("jutgeAwardIconUrl", () => {
  it("returns absolute URLs unchanged", () => {
    expect(
      jutgeAwardIconUrl("https://jutge.org/awards/funs/25.png"),
    ).toBe("https://jutge.org/awards/funs/25.png")
  })

  it("builds award image URLs under /awards/", () => {
    expect(jutgeAwardIconUrl("funs/25.png")).toBe(
      "https://jutge.org/awards/funs/25.png",
    )
    expect(jutgeAwardIconUrl("/awards/funs/25.png")).toBe(
      "https://jutge.org/awards/funs/25.png",
    )
    expect(jutgeAwardIconUrl("c3po.png")).toBe(
      "https://jutge.org/awards/c3po.png",
    )
    expect(jutgeAwardIconUrl("little-brown-hamster.png", "funs")).toBe(
      "https://jutge.org/awards/little-brown-hamster.png",
    )
  })

  it("uses the type folder only for numeric catalog ids", () => {
    expect(jutgeAwardIconUrl("25", "funs")).toBe(
      "https://jutge.org/awards/funs/25.png",
    )
  })
})
