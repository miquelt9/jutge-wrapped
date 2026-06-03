import type { TFunction } from "i18next"

export function formatSubmissions(t: TFunction, count: number): string {
  return t("submission", { count })
}

export function formatDays(t: TFunction, count: number): string {
  return t("day", { count })
}
