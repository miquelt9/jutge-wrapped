import { describe, expect, it } from "vitest"
import { detectBrowserLanguage } from "./config"

describe("detectBrowserLanguage", () => {
  it("prefers the first supported locale from the browser list", () => {
    expect(detectBrowserLanguage(["es-ES", "ca-ES", "en-US"])).toBe("ca")
    expect(detectBrowserLanguage(["en-GB", "ca"])).toBe("en")
  })

  it("matches primary language tags", () => {
    expect(detectBrowserLanguage(["ca-ES"])).toBe("ca")
    expect(detectBrowserLanguage(["en-US"])).toBe("en")
  })

  it("falls back to English when no supported locale is found", () => {
    expect(detectBrowserLanguage(["es-ES", "fr-FR"])).toBe("en")
    expect(detectBrowserLanguage([])).toBe("en")
  })
})
