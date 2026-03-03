import { lazy, Suspense, useState, type SyntheticEvent } from 'react'
import { useParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Paper from '@mui/material/Paper'
import LockIcon from '@mui/icons-material/Lock'
import { useProjectDetail, useProjectMembers } from '@/hooks/useProjectSettings'
import { useAuthStore } from '@/stores/authStore'

// Lazy-load each settings tab for code splitting
const GeneralSettings = lazy(() => import('@/components/settings/GeneralSettings'))
const MemberSettings = lazy(() => import('@/components/settings/MemberSettings'))
const IssueTypeSettings = lazy(() => import('@/components/settings/IssueTypeSettings'))
const CustomFieldSettings = lazy(() => import('@/components/settings/CustomFieldSettings'))
const LabelSettings = lazy(() => import('@/components/settings/LabelSettings'))
const WorkflowEditor = lazy(() => import('@/components/settings/WorkflowEditor'))

interface TabPanelProps {
  children: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </Box>
  )
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  }
}

const TAB_LABELS = [
  'General',
  'Members',
  'Issue Types',
  'Custom Fields',
  'Labels',
  'Workflow',
]

function TabFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress />
    </Box>
  )
}

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [tab, setTab] = useState(0)
  const currentUserId = useAuthStore((s) => s.currentUserId)

  const { data: project, isLoading: projectLoading } = useProjectDetail(projectId)
  const { data: members = [] } = useProjectMembers(projectId)

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setTab(newValue)
  }

  // Check if current user is an admin of this project
  const currentMember = members.find((m) => m.user_id === currentUserId)
  const isAdmin = currentMember?.role === 'admin'
  const hasCheckedAccess = !projectLoading && members.length > 0

  if (!projectId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">No project ID provided.</Alert>
      </Container>
    )
  }

  if (projectLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // Show access warning for non-admins (but still allow viewing for graceful UX)
  if (hasCheckedAccess && !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <LockIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Admin Access Required
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You need admin permissions on this project to access settings.
            Contact your project lead to request access.
          </Typography>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {project?.name ?? 'Project'} Settings
      </Typography>

      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Project settings tabs"
          >
            {TAB_LABELS.map((label, idx) => (
              <Tab key={label} label={label} {...a11yProps(idx)} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ px: 3 }}>
          <Suspense fallback={<TabFallback />}>
            <TabPanel value={tab} index={0}>
              <GeneralSettings projectId={projectId} />
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <MemberSettings projectId={projectId} />
            </TabPanel>
            <TabPanel value={tab} index={2}>
              <IssueTypeSettings projectId={projectId} />
            </TabPanel>
            <TabPanel value={tab} index={3}>
              <CustomFieldSettings projectId={projectId} />
            </TabPanel>
            <TabPanel value={tab} index={4}>
              <LabelSettings projectId={projectId} />
            </TabPanel>
            <TabPanel value={tab} index={5}>
              <WorkflowEditor projectId={projectId} />
            </TabPanel>
          </Suspense>
        </Box>
      </Paper>
    </Container>
  )
}
