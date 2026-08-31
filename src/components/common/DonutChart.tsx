import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { cn } from '@/utils/cn'

export interface DonutSlice {
  name: string
  value: number
  /** Concrete CSS color (hex/rgb) — charts can't consume Tailwind classes. */
  color: string
}

interface DonutChartProps {
  data: DonutSlice[]
  centerValue?: string
  centerLabel?: string
  size?: number
  thickness?: number
  className?: string
}

/** Themed donut chart with a center stat. Renders a neutral placeholder ring when every slice is 0. */
export function DonutChart({ data, centerValue, centerLabel, size = 180, thickness = 18, className }: DonutChartProps) {
  const outer = size / 2
  const inner = outer - thickness
  const isEmpty = data.every((d) => d.value <= 0)
  // Zero-value slices still consume paddingAngle space, leaving a visible gap
  // even when only one slice actually has weight — drop them before rendering.
  const chartData = isEmpty
    ? [{ name: 'No data', value: 1, color: 'rgb(var(--color-line-strong))' }]
    : data.filter((d) => d.value > 0)
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }} role="img" aria-label={
      `${centerLabel ?? 'Chart'}: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`
    }>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={chartData.length > 1 ? 2 : 0}
            strokeWidth={0}
            cornerRadius={4}
            isAnimationActive
            animationDuration={600}
          >
            {chartData.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <RechartsTooltip
            contentStyle={{
              background: 'rgb(var(--color-card))',
              border: '1px solid rgb(var(--color-line))',
              borderRadius: 8,
              fontSize: 12,
              color: 'rgb(var(--color-ink))',
            }}
            itemStyle={{ color: 'rgb(var(--color-ink))' }}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-2xl font-bold tabular-nums tracking-tight text-ink">{centerValue}</span>}
          {centerLabel && <span className="mt-0.5 max-w-[70%] text-center text-2xs font-medium text-sub">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}
