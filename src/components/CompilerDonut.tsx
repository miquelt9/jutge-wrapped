import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  DISTRIBUTION_DONUT_SIZE,
  DistributionDonut,
} from "@/components/DistributionDonut"
import { useTheme } from "@/context/ThemeContext"
import { compilerDonutColor } from "@/theme/jutgeColors"
import type { DistributionItem } from "@/features/wrapped/types"

type Props = {
  items: DistributionItem[]
  size?: number
  displaySize?: number
  fill?: boolean
}

export function CompilerDonut({
  items: rawItems,
  size = DISTRIBUTION_DONUT_SIZE,
  displaySize,
  fill,
}: Props) {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const items = useMemo(() => {
    let rank = 0
    return rawItems.map((item) => {
      if (item.count <= 0) return item
      const color = compilerDonutColor(theme, rank)
      rank += 1
      return { ...item, color }
    })
  }, [rawItems, theme])

  const getColor = useCallback(
    (item: DistributionItem) => item.color ?? compilerDonutColor(theme, 0),
    [theme],
  )

  const centerItems = useMemo(
    () => items.filter((i) => i.count > 0).slice(0, 3),
    [items],
  )

  return (
    <DistributionDonut
      items={items}
      size={size}
      displaySize={displaySize}
      fill={fill}
      getColor={getColor}
      centerItems={centerItems}
      formatCenterLabel={(item) => item.key}
      ariaLabel={t("donut.compilerAria")}
    />
  )
}
