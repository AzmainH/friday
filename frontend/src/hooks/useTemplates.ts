import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

const templateKeys = {
  all: ['templates'] as const,
  detail: (id: string) => ['templates', id] as const,
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  is_system: boolean
  template_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export function useTemplates() {
  return useQuery<ProjectTemplate[]>({
    queryKey: templateKeys.all,
    queryFn: async () => {
      const { data } = await client.get('/templates')
      // API returns cursor-paginated response with { data, pagination }
      return Array.isArray(data) ? data : data.data ?? []
    },
  })
}

export function useTemplate(id: string | undefined) {
  return useQuery<ProjectTemplate>({
    queryKey: templateKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await client.get(`/templates/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateFromTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      templateId,
      projectName,
      keyPrefix,
      description,
      workspaceId,
    }: {
      templateId: string
      projectName: string
      keyPrefix: string
      description?: string
      workspaceId?: string
    }) => {
      const { data } = await client.post('/wizard/create-project', {
        template_id: templateId,
        name: projectName,
        key_prefix: keyPrefix,
        description: description || null,
        workspace_id: workspaceId || null,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
