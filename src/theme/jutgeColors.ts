import type { ThemeId } from "@/theme/themes"

/** Jutge.org dashboard palette (style guide) */
export const JUTGE = {
  bg: "#F8F8F8",
  nav: "#222222",
  text: "#222222",
  muted: "#808080",
  border: "#dddddd",
  panel: "#ffffff",
  green: "#5cb85c",
  red: "#d9534f",
  orange: "#f0ad4e",
  blue: "#337ab7",
} as const

/** Verdict colors for wrapped charts (style guide + user mapping) */
export const VERDICT_COLORS: Record<string, string> = {
  AC: JUTGE.green,
  WA: JUTGE.red,
  CE: "#EEC900",
  EE: JUTGE.muted,
  FE: "#000000",
  IC: "#FFD700",
  PE: "#F5D547",
  SC: JUTGE.orange,
  IE: JUTGE.red,
  SE: JUTGE.red,
  NC: JUTGE.red,
  OK: JUTGE.green,
  KO: JUTGE.red,
  NT: JUTGE.muted,
}

export function verdictColor(key: string): string {
  return VERDICT_COLORS[key] ?? JUTGE.muted
}

/** Jutge API uses near-white pinks for PRO2 / Make — invisible on wrapped charts */
const COMPILER_COLOR_OVERRIDES: Record<string, string> = {
  PRO2: "#B85C6E",
  MakePRO2: "#A64D5E",
  Make: "#B85C6E",
  GCJ: "#9E6B7A",
  GDC: "#9E6B7A",
}

const LIGHT_BG_RGB: [number, number, number] = [248, 248, 248]

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.replace("#", "").trim()
  if (raw.length === 3) {
    return [
      Number.parseInt(raw[0]! + raw[0], 16),
      Number.parseInt(raw[1]! + raw[1], 16),
      Number.parseInt(raw[2]! + raw[2], 16),
    ]
  }
  if (raw.length !== 6) return null
  const n = Number.parseInt(raw, 16)
  if (Number.isNaN(n)) return null
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(
  fg: [number, number, number],
  bg: [number, number, number],
): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Darken until readable on the wrapped light background (min WCAG-ish 3:1). */
function ensureContrastOnLightBg(hex: string, minRatio = 3): string {
  const parsed = parseHex(hex)
  if (!parsed) return hex
  if (contrastRatio(parsed, LIGHT_BG_RGB) >= minRatio) return hex

  let rgb = parsed
  for (let i = 0; i < 16; i += 1) {
    rgb = [
      Math.round(rgb[0] * 0.88),
      Math.round(rgb[1] * 0.88),
      Math.round(rgb[2] * 0.88),
    ] as [number, number, number]
    if (contrastRatio(rgb, LIGHT_BG_RGB) >= minRatio) return toHex(rgb)
  }
  return toHex(rgb)
}

export function compilerColor(key: string, apiHex?: string): string {
  if (COMPILER_COLOR_OVERRIDES[key]) return COMPILER_COLOR_OVERRIDES[key]
  const base = apiHex ?? JUTGE.muted
  return ensureContrastOnLightBg(base)
}

/** Ordered palette for the compiler donut — index 0 is the dominant segment. */
export const COMPILER_DONUT_PALETTES: Record<ThemeId, readonly string[]> = {
  jutge: [
    "#5cb85c",
    "#337ab7",
    "#f0ad4e",
    "#d9534f",
    "#8e44ad",
    "#00a8ff",
    "#16a085",
  ],
  fib: [
    "#c5003e",
    "#e05a76",
    "#9c546a",
    "#5c628c",
    "#d9822b",
    "#5c8c74",
    "#7d5c8c",
  ],
  upc: [
    "#0077c8",
    "#00a896",
    "#4c609c",
    "#d9822b",
    "#2e7d32",
    "#d9534f",
    "#8e44ad",
  ],
  dark: [
    "#6dd47e",
    "#6bb3ff",
    "#ff6b6b",
    "#ffc36b",
    "#c39bd3",
    "#4db6ac",
    "#ff9f43",
  ],
}

const COMPILER_DONUT_OVERFLOW_MIX: Record<ThemeId, string> = {
  jutge: "#808080",
  fib: "#b8a0a8",
  upc: "#888888",
  dark: "#3a3a3a",
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const blend = Math.min(Math.max(t, 0), 1)
  return [
    Math.round(a[0] * (1 - blend) + b[0] * blend),
    Math.round(a[1] * (1 - blend) + b[1] * blend),
    Math.round(a[2] * (1 - blend) + b[2] * blend),
  ]
}

/**
 * Theme-aware compiler donut color by sorted rank (0 = largest slice).
 * Cycles the palette and mutes each lap so overflow compilers stay distinct.
 */
export function compilerDonutColor(theme: ThemeId, index: number): string {
  const palette = COMPILER_DONUT_PALETTES[theme]
  const lap = Math.floor(index / palette.length)
  const base = palette[index % palette.length] ?? JUTGE.muted
  if (lap === 0) return base

  const parsed = parseHex(base)
  const mixTarget = parseHex(COMPILER_DONUT_OVERFLOW_MIX[theme])
  if (!parsed || !mixTarget) return base

  const t = Math.min(0.16 + (lap - 1) * 0.12, 0.52)
  return toHex(mixRgb(parsed, mixTarget, t))
}
