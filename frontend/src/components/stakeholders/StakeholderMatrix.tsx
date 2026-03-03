import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
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
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
        boxShadow: 2,
      }}
    >
      <Typography variant="subtitle2">{point.name}</Typography>
      {point.role && (
        <Typography variant="caption" color="text.secondary" display="block">
          {point.role}
        </Typography>
      )}
      <Typography variant="caption" display="block">
        Interest: {point.interest} / Influence: {point.influence}
      </Typography>
    </Box>
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
      <circle cx={cx} cy={cy} r={6} fill="#1976d2" stroke="#fff" strokeWidth={1.5} />
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
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">
          No stakeholders to display. Add stakeholders to see the matrix.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: 420 }}>
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
            fill="#e0e0e0"
            fillOpacity={0.2}
          >
            <Label value="Monitor" position="insideBottomLeft" fontSize={11} fill="#757575" />
          </ReferenceArea>

          {/* Bottom-right: Keep Informed (high interest, low influence) */}
          <ReferenceArea
            x1={5}
            x2={10}
            y1={0}
            y2={5}
            fill="#bbdefb"
            fillOpacity={0.2}
          >
            <Label value="Keep Informed" position="insideBottomRight" fontSize={11} fill="#1565c0" />
          </ReferenceArea>

          {/* Top-left: Keep Satisfied (low interest, high influence) */}
          <ReferenceArea
            x1={0}
            x2={5}
            y1={5}
            y2={10}
            fill="#fff9c4"
            fillOpacity={0.3}
          >
            <Label value="Keep Satisfied" position="insideTopLeft" fontSize={11} fill="#f57f17" />
          </ReferenceArea>

          {/* Top-right: Manage Closely (high interest, high influence) */}
          <ReferenceArea
            x1={5}
            x2={10}
            y1={5}
            y2={10}
            fill="#c8e6c9"
            fillOpacity={0.3}
          >
            <Label value="Manage Closely" position="insideTopRight" fontSize={11} fill="#2e7d32" />
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
    </Box>
  )
}
