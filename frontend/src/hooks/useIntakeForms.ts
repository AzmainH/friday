import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormFieldOption {
  label: string
  value: string
}

export interface FormField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number' | 'email'
  label: string
  placeholder?: string
  required?: boolean
  options?: FormFieldOption[]
}

export interface IntakeForm {
  id: string
  project_id: string
  name: string
  description: string | null
  fields_schema: FormField[]
  is_active: boolean
  public_url: string | null
  created_at: string
  updated_at: string
}

export interface CreateIntakeFormInput {
  name: string
  description?: string | null
  fields_schema: FormField[]
  is_active?: boolean
}

export interface UpdateIntakeFormInput {
  name?: string
  description?: string | null
  fields_schema?: FormField[]
  is_active?: boolean
}

export interface FormSubmission {
  id: string
  form_id: string
  submitted_by_email: string | null
  submitted_by_name: string | null
  data: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  review_notes: string | null
  created_issue_id: string | null
  created_at: string
}

export interface ReviewSubmissionInput {
  decision: 'approved' | 'rejected'
  notes?: string | null
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const formKeys = {
  all: (projectId: string) => ['intake-forms', projectId] as const,
  detail: (formId: string) => ['intake-forms', 'detail', formId] as const,
  submissions: (formId: string) => ['intake-forms', 'submissions', formId] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all intake forms for a project */
export function useIntakeForms(projectId: string) {
  return useQuery<IntakeForm[]>({
    queryKey: formKeys.all(projectId),
    queryFn: async () => {
      const { data } = await client.get(`/projects/${projectId}/intake-forms`)
      return data.data ?? data
    },
    enabled: !!projectId,
  })
}

/** Fetch submissions for a specific form */
export function useFormSubmissions(formId: string) {
  return useQuery<FormSubmission[]>({
    queryKey: formKeys.submissions(formId),
    queryFn: async () => {
      const { data } = await client.get(`/intake-forms/${formId}/submissions`)
      return data.data ?? data
    },
    enabled: !!formId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new intake form */
export function useCreateForm(projectId: string) {
  const qc = useQueryClient()
  return useMutation<IntakeForm, Error, CreateIntakeFormInput>({
    mutationFn: async (body) => {
      const { data } = await client.post(`/projects/${projectId}/intake-forms`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKeys.all(projectId) })
    },
  })
}

/** Update an existing intake form */
export function useUpdateForm(projectId: string) {
  const qc = useQueryClient()
  return useMutation<IntakeForm, Error, { id: string; body: UpdateIntakeFormInput }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/intake-forms/${id}`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKeys.all(projectId) })
    },
  })
}

/** Review (approve/reject) a form submission */
export function useReviewSubmission() {
  const qc = useQueryClient()
  return useMutation<FormSubmission, Error, { submissionId: string; body: ReviewSubmissionInput }>({
    mutationFn: async ({ submissionId, body }) => {
      const { data } = await client.post(
        `/intake-submissions/${submissionId}/review`,
        body,
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intake-forms'] })
    },
  })
}
