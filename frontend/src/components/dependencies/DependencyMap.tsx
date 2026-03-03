import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
import { cn } from '@/lib/cn'
import type { CrossProjectDependency } from '@/hooks/usePortfolio'
import { RAG_COLORS } from '@/utils/formatters'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface DependencyProject {
  id: string
  name: string
  rag_status: string
}

export interface DependencyMapProps {
  dependencies: CrossProjectDependency[]
  projects: DependencyProject[]
}

/* ------------------------------------------------------------------ */
/*  Layout helpers                                                     */
/* ------------------------------------------------------------------ */

interface NodeLayout {
  id: string
  name: string
  rag_status: string
  x: number
  y: number
  isCritical: boolean
}

interface EdgeLayout {
  source: NodeLayout
  target: NodeLayout
  label: string
  isCritical: boolean
}

const NODE_RADIUS = 30
const SVG_PADDING = 60

/**
 * Simple circular layout for the project nodes.
 * Places nodes evenly around a circle.
 */
function computeLayout(
  projects: DependencyProject[],
  dependencies: CrossProjectDependency[],
  criticalIds: Set<string>,
) {
  const count = projects.length
  if (count === 0) return { nodes: [] as NodeLayout[], edges: [] as EdgeLayout[], width: 400, height: 300 }

  const radius = Math.max(120, count * 30)
  const cx = radius + SVG_PADDING
  const cy = radius + SVG_PADDING

  const nodes: NodeLayout[] = projects.map((p, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      id: p.id,
      name: p.name,
      rag_status: p.rag_status,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      isCritical: criticalIds.has(p.id),
    }
  })

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  const edges: EdgeLayout[] = dependencies
    .map((dep) => {
      const source = nodeMap.get(dep.source_project_id)
      const target = nodeMap.get(dep.target_project_id)
      if (!source || !target) return null
      const isCritical = criticalIds.has(source.id) && criticalIds.has(target.id)
      return { source, target, label: dep.dependency_type, isCritical }
    })
    .filter(Boolean) as EdgeLayout[]

  const width = (radius + SVG_PADDING) * 2
  const height = (radius + SVG_PADDING) * 2

  return { nodes, edges, width, height }
}

/**
 * Rudimentary critical-path detection: find all projects that have
 * dependencies (either as source or target) with status != "resolved".
 * A real implementation would use topological sort and longest path.
 */
function findCriticalPathIds(deps: CrossProjectDependency[]): Set<string> {
  const ids = new Set<string>()
  for (const d of deps) {
    if (d.status !== 'resolved') {
      ids.add(d.source_project_id)
      ids.add(d.target_project_id)
    }
  }
  return ids
}

/* ------------------------------------------------------------------ */
/*  Arrow marker                                                       */
/* ------------------------------------------------------------------ */

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX={10}
      refY={5}
      markerWidth={8}
      markerHeight={8}
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DependencyMap({ dependencies, projects }: DependencyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [highlightCritical, setHighlightCritical] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const criticalIds = useMemo(() => findCriticalPathIds(dependencies), [dependencies])
  const { nodes, edges, width, height } = useMemo(
    () => computeLayout(projects, dependencies, criticalIds),
    [projects, dependencies, criticalIds],
  )

  // Track which edges connect to hovered node
  const hoveredEdges = useMemo(() => {
    if (!hoveredNode) return new Set<number>()
    const indices = new Set<number>()
    edges.forEach((e, i) => {
      if (e.source.id === hoveredNode || e.target.id === hoveredNode) {
        indices.add(i)
      }
    })
    return indices
  }, [hoveredNode, edges])

  // Compute edge endpoints offset by node radius so arrows start/end at circle border
  const computeEdgePath = useCallback(
    (source: NodeLayout, target: NodeLayout) => {
      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const offsetX = (dx / dist) * NODE_RADIUS
      const offsetY = (dy / dist) * NODE_RADIUS
      return {
        x1: source.x + offsetX,
        y1: source.y + offsetY,
        x2: target.x - offsetX,
        y2: target.y - offsetY,
      }
    },
    [],
  )

  // Force re-render on mount for SVG sizing
  const [, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (projects.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-[#6B6B6B]">No projects to display.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center mb-1 gap-2">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={highlightCritical}
            onClick={() => setHighlightCritical((v) => !v)}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              highlightCritical ? 'bg-primary-500' : 'bg-surface-300',
            )}
          >
            <span
              className={cn(
                'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                highlightCritical ? 'translate-x-[18px]' : 'translate-x-[3px]',
              )}
            />
          </button>
          <span className="text-sm text-[#6B6B6B]">
            Highlight critical path
          </span>
        </label>
        <span className="text-xs text-[#6B6B6B]">
          {dependencies.length} dependenc{dependencies.length === 1 ? 'y' : 'ies'} across{' '}
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* SVG graph */}
      <div className="overflow-x-auto overflow-y-auto max-h-[560px] border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
        <svg ref={svgRef} width={width} height={height} style={{ display: 'block' }}>
          <defs>
            <ArrowMarker id="arrow-default" color="#A3A3A3" />
            <ArrowMarker id="arrow-critical" color="#D84040" />
            <ArrowMarker id="arrow-highlight" color="#009688" />
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const { x1, y1, x2, y2 } = computeEdgePath(edge.source, edge.target)
            const isHighlighted = hoveredEdges.has(i)
            const isCrit = highlightCritical && edge.isCritical

            let stroke = '#A3A3A3'
            let markerId = 'url(#arrow-default)'
            let strokeWidth = 1.5
            if (isCrit) {
              stroke = '#D84040'
              markerId = 'url(#arrow-critical)'
              strokeWidth = 2.5
            }
            if (isHighlighted) {
              stroke = '#009688'
              markerId = 'url(#arrow-highlight)'
              strokeWidth = 2.5
            }

            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2

            return (
              <g key={`edge-${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  markerEnd={markerId}
                  opacity={hoveredNode && !isHighlighted ? 0.2 : 1}
                />
                {/* Edge label */}
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isHighlighted ? '#009688' : '#999'}
                  opacity={hoveredNode && !isHighlighted ? 0.2 : 1}
                >
                  {edge.label}
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const ragColor = RAG_COLORS[node.rag_status] ?? RAG_COLORS.none
            const dimmed = hoveredNode !== null && hoveredNode !== node.id && !hoveredEdges.size
            const isCrit = highlightCritical && node.isCritical

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
                opacity={dimmed ? 0.3 : 1}
              >
                <title>{`${node.name} (${node.rag_status})`}</title>
                {/* Critical ring */}
                {isCrit && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 4}
                    fill="none"
                    stroke="#D84040"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  fill={ragColor}
                  stroke={hoveredNode === node.id ? '#009688' : '#fff'}
                  strokeWidth={hoveredNode === node.id ? 3 : 2}
                />
                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#fff"
                >
                  {node.name.length > 8 ? node.name.slice(0, 7) + '\u2026' : node.name}
                </text>
                {/* Full name below node */}
                <text
                  x={node.x}
                  y={node.y + NODE_RADIUS + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6B6B6B"
                >
                  {node.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
