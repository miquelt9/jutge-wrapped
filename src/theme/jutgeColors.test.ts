import { describe, expect, it } from "vitest"
import {
  COMPILER_DONUT_PALETTES,
  compilerDonutColor,
} from "@/theme/jutgeColors"

describe("compilerDonutColor", () => {
  it("returns the first palette color for rank 0", () => {
    expect(compilerDonutColor("fib", 0)).toBe(COMPILER_DONUT_PALETTES.fib[0])
  })

  it("cycles the palette when there are more compilers than colors", () => {
    const paletteLen = COMPILER_DONUT_PALETTES.fib.length
    const firstLap = compilerDonutColor("fib", paletteLen)
    const secondLap = compilerDonutColor("fib", paletteLen * 2)

    expect(firstLap).not.toBe(COMPILER_DONUT_PALETTES.fib[0])
    expect(secondLap).not.toBe(firstLap)
    expect(secondLap).not.toBe(COMPILER_DONUT_PALETTES.fib[0])
  })
})
