import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BudgetSummary {
  total_budget: number
  total_spent: number
  remaining: number
  percent_used: number
}

export interface CostEntry {
  id: string
  project_id: string
  category: string
  amount: number
  description: string | null
  date: string
  entry_date?: string
  issue_id: string | null
  created_at: string
}

export interface Budget {
  id: string
  project_id: string
  total_budget: number
  currency: string
  created_at: string
  updated_at: string
}

export interface CreateCostEntryInput {
  project_id: string
  category: string
  amount: number
  description?: string | null
  date: string
  issue_id?: string | null
}

export interface UpdateBudgetInput {
  id: string
  body: {
    total_budget?: number
    currency?: string
  }
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const budgetKeys = {
  all: ['budgets'] as const,
  detail: (projectId: string) => ['budgets', projectId] as const,
  summary: (projectId: string) => ['budgets', projectId, 'summary'] as const,
  costs: (projectId: string) => ['budgets', projectId, 'costs'] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useBudget(projectId: string) {
  return useQuery<Budget>({
    queryKey: budgetKeys.detail(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/budget`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useBudgetSummary(projectId: string) {
  return useQuery<BudgetSummary>({
    queryKey: budgetKeys.summary(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/budget/summary`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCostEntries(projectId: string) {
  return useQuery<CostEntry[]>({
    queryKey: budgetKeys.costs(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/costs?limit=100&include_count=false`)
      const items: CostEntry[] = data?.data ?? data
      return items.map((e: CostEntry) => ({ ...e, date: e.entry_date ?? e.date }))
    },
    enabled: !!projectId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateCostEntry() {
  const qc = useQueryClient()
  return useMutation<CostEntry, Error, CreateCostEntryInput>({
    mutationFn: async (input) => {
      const { project_id, ...body } = input
      const { data } = await client.post(`/projects/${project_id}/costs`, body)
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: budgetKeys.costs(variables.project_id) })
      qc.invalidateQueries({ queryKey: budgetKeys.summary(variables.project_id) })
    },
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation<Budget, Error, UpdateBudgetInput>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/budgets/${id}`, body)
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: budgetKeys.detail(data.project_id) })
      qc.invalidateQueries({ queryKey: budgetKeys.summary(data.project_id) })
    },
  })
}
