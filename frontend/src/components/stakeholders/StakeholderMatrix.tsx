import { useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Label,
} from 'recharts'
import type { Stakeholder } from '@/types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StakeholderMatrixProps {
  stakeholders: Stakeholder[]
}

interface MatrixPoint {
  name: string
  role: string | null
  interest: number
  influence: number
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  payload: MatrixPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}

function MatrixTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="bg-white border border-surface-200 rounded-lg p-3 shadow-md dark:bg-dark-surface dark:border-dark-border">
      <p className="text-sm font-semibold text-text-primary">{point.name}</p>
      {point.role && (
        <p className="text-xs text-text-secondary">{point.role}</p>
      )}
      <p className="text-xs text-text-primary">
        Interest: {point.interest} / Influence: {point.influence}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom dot renderer
// ---------------------------------------------------------------------------

interface DotProps {
  cx?: number
  cy?: number
  payload?: MatrixPoint
}

function NamedDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize={11}
        fill="#333"
        fontWeight={500}
      >
        {payload.name}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StakeholderMatrix({ stakeholders }: StakeholderMatrixProps) {
  const data: MatrixPoint[] = useMemo(
    () =>
      stakeholders.map((s) => ({
        name: s.name,
        role: s.role,
        interest: s.interest_level,
        influence: s.influence_level,
      })),
    [stakeholders],
  )

  if (data.length === 0) {
    return (
      <div className="p-8 text-center border border-surface-200 rounded-lg">
        <p className="text-text-secondary">
          No stakeholders to display. Add stakeholders to see the matrix.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />

          {/* Quadrant backgrounds */}
          {/* Bottom-left: Monitor (low influence, low interest) */}
          <ReferenceArea
            x1={0}
            x2={5}
            y1={0}
            y2={5}
            fill="#e7e5e4"
            fillOpacity={0.2}
          >
            <Label value="Monitor" position="insideBottomLeft" fontSize={11} fill="#78716c" />
          </ReferenceArea>

          {/* Bottom-right: Keep Informed (high interest, low influence) */}
          <ReferenceArea
            x1={5}
            x2={10}
            y1={0}
            y2={5}
            fill="#fef3c7"
            fillOpacity={0.2}
          >
            <Label value="Keep Informed" position="insideBottomRight" fontSize={11} fill="#b45309" />
          </ReferenceArea>

          {/* Top-left: Keep Satisfied (low interest, high influence) */}
          <ReferenceArea
            x1={0}
            x2={5}
            y1={5}
            y2={10}
            fill="#ccfbf1"
            fillOpacity={0.3}
          >
            <Label value="Keep Satisfied" position="insideTopLeft" fontSize={11} fill="#0f766e" />
          </ReferenceArea>

          {/* Top-right: Manage Closely (high interest, high influence) */}
          <ReferenceArea
            x1={5}
            x2={10}
            y1={5}
            y2={10}
            fill="#dcfce7"
            fillOpacity={0.3}
          >
            <Label value="Manage Closely" position="insideTopRight" fontSize={11} fill="#15803d" />
          </ReferenceArea>

          <XAxis
            type="number"
            dataKey="interest"
            name="Interest"
            domain={[0, 10]}
            tick={{ fontSize: 12 }}
          >
            <Label value="Interest" offset={-10} position="insideBottom" fontSize={13} />
          </XAxis>

          <YAxis
            type="number"
            dataKey="influence"
            name="Influence"
            domain={[0, 10]}
            tick={{ fontSize: 12 }}
          >
            <Label value="Influence" angle={-90} position="insideLeft" fontSize={13} />
          </YAxis>

          <Tooltip content={<MatrixTooltip />} />

          <Scatter
            data={data}
            shape={<NamedDot />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
