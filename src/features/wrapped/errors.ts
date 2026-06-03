import i18n from "@/i18n/config"
import type { MappedApiError } from "@/api/client"
import { formatPeriodLabel, type WrappedPeriod } from "./period"

export function wrappedRangeLabel(period: WrappedPeriod): string {
  if (period.start && period.end) {
    return i18n.t("period.through", { start: period.start, end: period.end })
  }
  return formatPeriodLabel(period)
}

export function invalidRangeMessage(period: WrappedPeriod): string {
  return i18n.t("errors.invalidRange", {
    start: period.start ?? "",
    end: period.end ?? "",
  })
}

export function emptyRangeMessage(
  period: WrappedPeriod,
  context: "live" | "snapshot",
  hasSubmissionList: boolean,
): string {
  const label = wrappedRangeLabel(period)
  if (context === "snapshot" && !hasSubmissionList) {
    return i18n.t("errors.emptyRangeSnapshot", { label })
  }
  return i18n.t("errors.emptyRange", { label })
}

export function liveLoadFailureMessage(allSubmissionsCount: number): string {
  if (allSubmissionsCount === 0) {
    return i18n.t("errors.loadFailureEmpty")
  }
  return i18n.t("errors.loadFailure")
}

export function translateApiError(error: MappedApiError): string {
  if (error.kind === "network") return i18n.t("errors.network")
  if (error.kind === "unknown" && error.message === "An unexpected error occurred.") {
    return i18n.t("errors.unexpected")
  }
  return error.message
}
