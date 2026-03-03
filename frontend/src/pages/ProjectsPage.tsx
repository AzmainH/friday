import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import FolderIcon from '@mui/icons-material/Folder'
import client from '@/api/client'
import { RAG_COLORS, formatDate, formatPercent } from '@/utils/formatters'

interface Project {
  id: string
  name: string
  key_prefix: string
  description: string | null
  status: string
  rag_status: string
  lead_id: string | null
  start_date: string | null
  target_end_date: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'default'> = {
  active: 'primary',
  planning: 'warning',
  completed: 'success',
}

export default function ProjectsPage() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: res } = await client.get('/projects', {
        params: { workspace_id: 'default', include_count: true },
      })
      const items = res?.data ?? res
      return Array.isArray(items) ? items : []
    },
  })

  const projects: Project[] = data ?? []

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/projects/new')}
        >
          Create Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load projects: {(error as Error).message}
        </Alert>
      )}

      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }, (_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={6} sx={{ borderRadius: 1, mb: 1.5 }} />
                  <Skeleton variant="text" width="80%" height={18} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : projects.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <FolderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first project to start tracking issues, sprints, and milestones.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
          >
            Create Your First Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => {
            const ragColor = RAG_COLORS[project.rag_status] ?? RAG_COLORS.none
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                <Card
                  sx={{
                    height: '100%',
                    borderLeft: '4px solid',
                    borderColor: ragColor,
                    transition: 'box-shadow 0.2s, transform 0.15s',
                    '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/projects/${project.id}/board`)}
                    sx={{ height: '100%' }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1 }}>
                          {project.name}
                        </Typography>
                        <Chip
                          label={project.status}
                          size="small"
                          color={STATUS_COLORS[project.status] ?? 'default'}
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>

                      <Typography variant="caption" color="primary" fontWeight={600}>
                        {project.key_prefix}
                      </Typography>

                      {project.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {project.description}
                        </Typography>
                      )}

                      <Box sx={{ mt: 1.5, display: 'flex', gap: 2 }}>
                        {project.start_date && (
                          <Typography variant="caption" color="text.secondary">
                            Start: {formatDate(project.start_date)}
                          </Typography>
                        )}
                        {project.target_end_date && (
                          <Typography variant="caption" color="text.secondary">
                            Target: {formatDate(project.target_end_date)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Container>
  )
}
