import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EVMData {
  project_id: string
  bac: number
  pv: number
  ev: number
  ac: number
  sv: number
  cv: number
  spi: number
  cpi: number
  eac: number
  etc: number
  vac: number
  tcpi: number
  percent_complete: number
  planned_percent: number
  total_issues: number
  done_issues: number
  total_milestones: number
  completed_milestones: number
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const evmKeys = {
  project: (projectId: string) => ['evm', 'project', projectId] as const,
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useProjectEVM(projectId: string | undefined) {
  return useQuery<EVMData>({
    queryKey: evmKeys.project(projectId ?? ''),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/evm`)
      return data
    },
    enabled: !!projectId,
  })
}
