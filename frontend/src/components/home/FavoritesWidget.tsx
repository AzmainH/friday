import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Star, FolderKanban, Bug, FileText, Bookmark } from 'lucide-react'
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
  project: <FolderKanban className="w-4 h-4 text-primary-600" />,
  issue: <Bug className="w-4 h-4 text-text-secondary" />,
  wiki_page: <FileText className="w-4 h-4 text-text-secondary" />,
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

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data: res } = await client.get('/favorites')
      return res
    },
  })

  const raw = data?.data ?? data
  const favorites: FavoriteItem[] = Array.isArray(raw) ? raw : []

  return (
    <div className="h-full bg-white dark:bg-surface-100 rounded-[--radius-lg] shadow-sm border border-surface-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-5 h-5 text-primary-500 fill-primary-500" />
        <h2 className="text-lg font-semibold text-text-primary">Favorites</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full skeleton-shimmer shrink-0" />
              <div className="h-4 w-3/4 skeleton-shimmer rounded-[--radius-xs]" />
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-6">
          <Bookmark className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No favorites yet</p>
          <p className="text-xs text-text-tertiary mt-0.5">
            Star items to add them here
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {favorites.map((fav) => (
            <button
              key={fav.id}
              onClick={() => navigate(getEntityUrl(fav.entity_type, fav.entity_id))}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-[--radius-sm] hover:bg-surface-100 transition-colors duration-[--duration-fast] cursor-pointer text-left"
            >
              <span className="shrink-0">
                {ENTITY_ICONS[fav.entity_type] ?? (
                  <Bookmark className="w-4 h-4 text-text-secondary" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">
                  {fav.entity_name ?? fav.name ?? fav.entity_id}
                </p>
                <p className="text-xs text-text-tertiary capitalize">
                  {fav.entity_type}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
