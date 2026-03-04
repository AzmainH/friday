import { cn } from '@/lib/cn'
import type { RiskMatrixCell } from '@/hooks/useRisks'

const probabilityLevels = ['very_high', 'high', 'medium', 'low', 'very_low'] as const // top to bottom
const impactLevels = ['very_low', 'low', 'medium', 'high', 'very_high'] as const // left to right

const levelLabel: Record<string, string> = {
  very_low: 'Very Low',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very High',
}

// Score mapping: probability_score * impact_score
const scoreMap: Record<string, number> = {
  very_low: 1,
  low: 2,
  medium: 3,
  high: 4,
  very_high: 5,
}

function getCellColor(probability: string, impact: string, count: number): string {
  if (count === 0) return 'bg-surface-50 dark:bg-surface-100'
  const score = scoreMap[probability] * scoreMap[impact]
  if (score <= 4) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  if (score <= 9) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
  if (score <= 15) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
  return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
}

interface RiskHeatMapProps {
  cells: RiskMatrixCell[]
  onCellClick?: (probability: string, impact: string) => void
}

export default function RiskHeatMap({ cells, onCellClick }: RiskHeatMapProps) {
  // Build a lookup map
  const cellMap = new Map<string, number>()
  for (const cell of cells) {
    cellMap.set(`${cell.probability}:${cell.impact}`, cell.count)
  }

  return (
    <div>
      <div className="flex items-end mb-1">
        <div className="w-20" />
        <p className="flex-1 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Impact
        </p>
      </div>
      <div className="flex">
        {/* Y-axis label */}
        <div className="flex flex-col items-center justify-center w-5 mr-1">
          <span
            className="text-xs font-semibold text-text-secondary uppercase tracking-wider"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Probability
          </span>
        </div>

        <div className="flex-1">
          {/* Column headers */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
            <div />
            {impactLevels.map((level) => (
              <div
                key={level}
                className="text-[10px] font-medium text-text-secondary text-center truncate px-0.5"
              >
                {levelLabel[level]}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {probabilityLevels.map((prob) => (
            <div key={prob} className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
              <div className="text-[10px] font-medium text-text-secondary flex items-center justify-end pr-2 truncate">
                {levelLabel[prob]}
              </div>
              {impactLevels.map((imp) => {
                const count = cellMap.get(`${prob}:${imp}`) ?? 0
                return (
                  <button
                    key={`${prob}:${imp}`}
                    onClick={() => onCellClick?.(prob, imp)}
                    className={cn(
                      'aspect-square rounded-[--radius-sm] flex items-center justify-center text-sm font-semibold transition-all',
                      'hover:ring-2 hover:ring-primary-500/40 cursor-pointer min-h-[36px]',
                      getCellColor(prob, imp, count),
                      count === 0 && 'text-text-tertiary',
                    )}
                  >
                    {count > 0 ? count : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
