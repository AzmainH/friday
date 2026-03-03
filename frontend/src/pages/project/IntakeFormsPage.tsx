import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { Plus, Copy, Pencil, FileText, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import {
  useIntakeForms,
  useCreateForm,
  useUpdateForm,
  useFormSubmissions,
  useReviewSubmission,
  type FormField,
  type IntakeForm,
  type FormSubmission,
} from '@/hooks/useIntakeForms'
import FormBuilder from '@/components/intake/FormBuilder'
import { formatDateTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Submissions sub-component
// ---------------------------------------------------------------------------

function SubmissionsTable({ formId }: { formId: string }) {
  const { data: submissions, isLoading } = useFormSubmissions(formId)
  const reviewMutation = useReviewSubmission()

  const handleReview = useCallback(
    (submissionId: string, decision: 'approved' | 'rejected') => {
      reviewMutation.mutate({ submissionId, body: { decision } })
    },
    [reviewMutation],
  )

  if (isLoading) {
    return (
      <div className="py-4 space-y-1">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
        ))}
      </div>
    )
  }

  const items = submissions ?? []

  if (items.length === 0) {
    return (
      <p className="py-4 text-sm text-text-secondary">
        No submissions yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Submitted</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Name / Email</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((sub: FormSubmission) => (
            <tr key={sub.id} className="hover:bg-surface-50 transition-colors">
              <td className="px-4 py-2 border-t border-surface-200">{formatDateTime(sub.created_at)}</td>
              <td className="px-4 py-2 border-t border-surface-200">
                {sub.submitted_by_name ?? sub.submitted_by_email ?? 'Anonymous'}
              </td>
              <td className="px-4 py-2 border-t border-surface-200">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                    sub.status === 'approved' && 'bg-green-50 border-green-200 text-green-700',
                    sub.status === 'rejected' && 'bg-red-50 border-red-200 text-red-700',
                    sub.status === 'pending' && 'bg-amber-50 border-amber-200 text-amber-700',
                  )}
                >
                  {sub.status}
                </span>
              </td>
              <td className="px-4 py-2 border-t border-surface-200">
                {sub.status === 'pending' && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Approve"
                      className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
                      onClick={() => handleReview(sub.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Reject"
                      className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => handleReview(sub.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

function Toast({ message, show, onClose }: { message: string; show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onClose, 2000)
    return () => clearTimeout(timer)
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-in fade-in slide-in-from-bottom-4">
      {message}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function IntakeFormsPage() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const { data: forms, isLoading } = useIntakeForms(projectId)
  const createMutation = useCreateForm(projectId)
  const updateMutation = useUpdateForm(projectId)

  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [editingForm, setEditingForm] = useState<IntakeForm | null>(null)
  const [editFields, setEditFields] = useState<FormField[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCreate = useCallback(() => {
    if (!createName.trim()) return
    createMutation.mutate(
      {
        name: createName.trim(),
        description: createDesc.trim() || null,
        fields_schema: [],
      },
      {
        onSuccess: () => {
          setShowCreate(false)
          setCreateName('')
          setCreateDesc('')
        },
      },
    )
  }, [createName, createDesc, createMutation])

  const handleStartEdit = useCallback((form: IntakeForm) => {
    setEditingForm(form)
    setEditFields(form.fields_schema)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!editingForm) return
    updateMutation.mutate(
      { id: editingForm.id, body: { fields_schema: editFields } },
      { onSuccess: () => setEditingForm(null) },
    )
  }, [editingForm, editFields, updateMutation])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary-500" />
          <h1 className="text-xl font-semibold text-text-primary">
            Intake Forms
          </h1>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          New Form
        </Button>
      </div>

      {/* Tabs */}
      <TabGroup>
        <TabList className="flex gap-1 border-b border-surface-200 mb-6">
          <Tab className={({ selected }) => cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
            selected
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
          )}>
            Forms
          </Tab>
          <Tab
            disabled={!selectedFormId}
            className={({ selected }) => cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
              selected
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-300',
              !selectedFormId && 'opacity-50 cursor-not-allowed',
            )}
          >
            Submissions
          </Tab>
        </TabList>

        <TabPanels>
          {/* Forms list tab */}
          <TabPanel>
            {isLoading && (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="skeleton-shimmer h-[72px] rounded-lg" />
                ))}
              </div>
            )}

            {!isLoading && forms?.length === 0 && (
              <div className="p-12 rounded-xl bg-white border border-surface-200 text-center dark:bg-dark-surface dark:border-dark-border">
                <FileText className="h-12 w-12 mx-auto text-text-secondary/40 mb-2" />
                <h3 className="text-lg font-medium text-text-secondary mb-1">
                  No intake forms yet
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Create a form to collect issue requests from external users.
                </p>
                <Button
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowCreate(true)}
                >
                  Create Form
                </Button>
              </div>
            )}

            {/* Editing a form */}
            {editingForm && (
              <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface mb-6">
                <div className="p-4">
                  <h3 className="text-base font-semibold text-text-primary mb-4">
                    Editing: {editingForm.name}
                  </h3>
                  <FormBuilder fields={editFields} onChange={setEditFields} />
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={() => setEditingForm(null)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveEdit}>
                      Save Fields
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Form cards */}
            <div className="flex flex-col gap-4">
              {forms?.map((form) => (
                <div key={form.id} className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-text-primary">
                          {form.name}
                        </h4>
                        {form.description && (
                          <p className="text-sm text-text-secondary">
                            {form.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                              form.is_active
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-surface-50 border-surface-200 text-text-secondary',
                            )}
                          >
                            {form.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-surface-200 text-text-secondary">
                            {form.fields_schema.length} field{form.fields_schema.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {form.public_url && (
                        <button
                          type="button"
                          title="Copy public URL"
                          className="p-1.5 rounded text-text-secondary hover:bg-surface-100 transition-colors"
                          onClick={() => handleCopyUrl(form.public_url!)}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Edit form fields"
                        className="p-1.5 rounded text-text-secondary hover:bg-surface-100 transition-colors"
                        onClick={() => handleStartEdit(form)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFormId(form.id)
                        }}
                      >
                        Submissions
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>

          {/* Submissions tab */}
          <TabPanel>
            {selectedFormId && (
              <div className="border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface">
                <div className="p-4">
                  <h3 className="text-base font-semibold text-text-primary mb-2">
                    Submissions
                  </h3>
                  <SubmissionsTable formId={selectedFormId} />
                </div>
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Create form dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Intake Form" size="sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Form Name</label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
              placeholder="Form name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Description (optional)</label>
            <textarea
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-dark-surface dark:border-dark-border"
              placeholder="Describe the purpose of this form"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!createName.trim()}
          >
            Create
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Copy URL toast */}
      <Toast
        message="Public URL copied to clipboard"
        show={copiedUrl}
        onClose={() => setCopiedUrl(false)}
      />
    </div>
  )
}
