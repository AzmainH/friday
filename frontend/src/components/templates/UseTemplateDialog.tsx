import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCreateFromTemplate, type ProjectTemplate } from '@/hooks/useTemplates'
import { useOrgStore } from '@/stores/orgStore'

function generateKeyPrefix(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 5)
}

export interface UseTemplateDialogProps {
  template: ProjectTemplate | null
  open: boolean
  onClose: () => void
}

export default function UseTemplateDialog({ template, open, onClose }: UseTemplateDialogProps) {
  const navigate = useNavigate()
  const currentWorkspaceId = useOrgStore((s) => s.currentWorkspaceId)
  const createFromTemplate = useCreateFromTemplate()

  const [projectName, setProjectName] = useState('')
  const [keyPrefix, setKeyPrefix] = useState('')
  const [description, setDescription] = useState('')
  const [workspaceId, setWorkspaceId] = useState(currentWorkspaceId ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = useCallback((value: string) => {
    setProjectName(value)
    if (!keyPrefix || keyPrefix === generateKeyPrefix(projectName)) {
      setKeyPrefix(generateKeyPrefix(value))
    }
  }, [keyPrefix, projectName])

  const handleCreate = useCallback(async () => {
    if (!template) return
    if (!projectName.trim()) {
      setError('Project name is required.')
      return
    }
    if (!keyPrefix.trim()) {
      setError('Key prefix is required.')
      return
    }

    setError(null)
    try {
      const result = await createFromTemplate.mutateAsync({
        templateId: template.id,
        projectName: projectName.trim(),
        keyPrefix: keyPrefix.trim(),
        description: description.trim() || undefined,
        workspaceId: workspaceId || undefined,
      })
      const projectId = result.project_id ?? result.id
      onClose()
      navigate(`/projects/${projectId}/board`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create project. Please try again.',
      )
    }
  }, [template, projectName, keyPrefix, description, workspaceId, createFromTemplate, onClose, navigate])

  const handleClose = useCallback(() => {
    setProjectName('')
    setKeyPrefix('')
    setDescription('')
    setError(null)
    onClose()
  }, [onClose])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={template ? `Create from "${template.name}"` : 'Create from Template'}
      size="md"
    >
      <div className="space-y-4">
        {template?.description && (
          <p className="text-xs text-text-secondary">{template.description}</p>
        )}

        <Input
          label="Project Name"
          placeholder="My New Project"
          value={projectName}
          onChange={(e) => handleNameChange(e.target.value)}
          autoFocus
          required
        />

        <Input
          label="Key Prefix"
          placeholder="MNP"
          value={keyPrefix}
          onChange={(e) =>
            setKeyPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
          }
          required
          hint="Used for issue keys (e.g. PROJ-123). Max 5 characters."
          maxLength={5}
        />

        <Input
          label="Description"
          placeholder="Optional project description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Input
          label="Workspace ID"
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
          hint="Leave blank to use the current workspace."
        />

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-[--radius-sm]">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          loading={createFromTemplate.isPending}
          disabled={!projectName.trim() || !keyPrefix.trim()}
        >
          Create Project
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
