import { useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useProjectDetail, useWorkflow, useIssueTypes } from '@/hooks/useProjectSettings'
import { useProjectStore } from '@/stores/projectStore'

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject)

  useProjectDetail(projectId)
  useWorkflow(projectId)
  useIssueTypes(projectId)

  useEffect(() => {
    return () => {
      setCurrentProject(null)
    }
  }, [projectId, setCurrentProject])

  return <Outlet />
}
