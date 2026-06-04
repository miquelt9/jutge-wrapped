import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  DISTRIBUTION_DONUT_SIZE,
  DistributionDonut,
} from "@/components/DistributionDonut"
import type { DistributionItem } from "@/features/wrapped/types"
import { verdictColor } from "@/theme/jutgeColors"

const CENTER_VERDICTS = ["AC", "WA", "EE"] as const

type Props = {
  items: DistributionItem[]
  size?: number
}

export function VerdictDonut({ items, size = DISTRIBUTION_DONUT_SIZE }: Props) {
  const { t } = useTranslation()
  const getColor = useCallback(
    (item: DistributionItem) => verdictColor(item.key),
    [],
  )
  const centerItems = useMemo(
    () =>
      CENTER_VERDICTS.map((key) => items.find((i) => i.key === key)).filter(
        (i): i is DistributionItem => i != null,
      ),
    [items],
  )

  return (
    <DistributionDonut
      items={items}
      size={size}
      getColor={getColor}
      centerItems={centerItems}
      ariaLabel={t("donut.verdictAria")}
    />
  )
}
