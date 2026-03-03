import { create } from 'zustand'
import type { Project, Workflow, WorkflowStatus, IssueType } from '@/types/api'

interface ProjectState {
  currentProject: Project | null
  workflow: Workflow | null
  statuses: WorkflowStatus[]
  issueTypes: IssueType[]
  setCurrentProject: (project: Project | null) => void
  setWorkflow: (workflow: Workflow | null) => void
  setStatuses: (statuses: WorkflowStatus[]) => void
  setIssueTypes: (issueTypes: IssueType[]) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  workflow: null,
  statuses: [],
  issueTypes: [],
  setCurrentProject: (project) => set({ currentProject: project }),
  setWorkflow: (workflow) => set({ workflow }),
  setStatuses: (statuses) => set({ statuses }),
  setIssueTypes: (issueTypes) => set({ issueTypes }),
}))
