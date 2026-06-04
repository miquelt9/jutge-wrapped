import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  DISTRIBUTION_DONUT_SIZE,
  DistributionDonut,
} from "@/components/DistributionDonut"
import { compilerColor } from "@/theme/jutgeColors"
import type { DistributionItem } from "@/features/wrapped/types"

type Props = {
  items: DistributionItem[]
  size?: number
}

export function CompilerDonut({
  items,
  size = DISTRIBUTION_DONUT_SIZE,
}: Props) {
  const { t } = useTranslation()
  const getColor = useCallback(
    (item: DistributionItem) => compilerColor(item.key, item.color),
    [],
  )
  const centerItems = useMemo(
    () => items.filter((i) => i.count > 0).slice(0, 3),
    [items],
  )

  return (
    <DistributionDonut
      items={items}
      size={size}
      getColor={getColor}
      centerItems={centerItems}
      formatCenterLabel={(item) => item.key}
      ariaLabel={t("donut.compilerAria")}
    />
  )
}
