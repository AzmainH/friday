import { useQuery } from '@tanstack/react-query'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Skeleton from '@mui/material/Skeleton'
import StarIcon from '@mui/icons-material/Star'
import FolderIcon from '@mui/icons-material/Folder'
import BugReportIcon from '@mui/icons-material/BugReport'
import ArticleIcon from '@mui/icons-material/Article'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import { useNavigate } from 'react-router-dom'
import client from '@/api/client'

interface FavoriteItem {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  name?: string
  entity_name?: string
  created_at: string
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  project: <FolderIcon fontSize="small" color="primary" />,
  issue: <BugReportIcon fontSize="small" color="action" />,
  wiki_page: <ArticleIcon fontSize="small" color="action" />,
}

function getEntityUrl(entityType: string, entityId: string): string {
  switch (entityType) {
    case 'project':
      return `/projects/${entityId}`
    case 'issue':
      return `/issues/${entityId}`
    case 'wiki_page':
      return `/wiki/${entityId}`
    default:
      return '/'
  }
}

export default function FavoritesWidget() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<FavoriteItem[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await client.get('/favorites')
      return data
    },
  })

  const favorites = data ?? []

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <StarIcon sx={{ color: '#ff9800' }} />
          <Typography variant="h6">Favorites</Typography>
        </Box>

        {isLoading ? (
          <Box>
            {Array.from({ length: 4 }, (_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="text" width="70%" height={22} />
              </Box>
            ))}
          </Box>
        ) : favorites.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <BookmarkIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No favorites yet
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Star items to add them here
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {favorites.map((fav) => (
              <ListItemButton
                key={fav.id}
                onClick={() => navigate(getEntityUrl(fav.entity_type, fav.entity_id))}
                sx={{ borderRadius: 1, py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {ENTITY_ICONS[fav.entity_type] ?? (
                    <BookmarkIcon fontSize="small" color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={fav.entity_name ?? fav.name ?? fav.entity_id}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                  }}
                  secondary={fav.entity_type}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    sx: { textTransform: 'capitalize' },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}
