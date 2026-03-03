import { useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import InputBase from '@mui/material/InputBase'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import SearchIcon from '@mui/icons-material/Search'
import BugReportIcon from '@mui/icons-material/BugReport'
import FolderIcon from '@mui/icons-material/Folder'
import CommentIcon from '@mui/icons-material/Comment'
import ArticleIcon from '@mui/icons-material/Article'
import HistoryIcon from '@mui/icons-material/History'
import { useSearchStore } from '@/stores/searchStore'
import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch'

const ENTITY_TYPE_LABELS: Record<string, string> = {
  issue: 'Issues',
  project: 'Projects',
  comment: 'Comments',
  wiki_page: 'Wiki',
}

const ENTITY_TYPE_ICONS: Record<string, React.ReactNode> = {
  issue: <BugReportIcon fontSize="small" />,
  project: <FolderIcon fontSize="small" />,
  comment: <CommentIcon fontSize="small" />,
  wiki_page: <ArticleIcon fontSize="small" />,
}

const SECTION_ORDER = ['issue', 'project', 'comment', 'wiki_page']

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem('friday-recent-searches')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== query)
    recent.unshift(query)
    localStorage.setItem('friday-recent-searches', JSON.stringify(recent.slice(0, 5)))
  } catch {
    // ignore storage errors
  }
}

function getEntityUrl(result: SearchResult): string {
  switch (result.entity_type) {
    case 'issue':
      return `/issues/${result.entity_id}`
    case 'project':
      return `/projects/${result.entity_id}`
    case 'comment':
      return `/comments/${result.entity_id}`
    case 'wiki_page':
      return `/wiki/${result.entity_id}`
    default:
      return result.url ?? '/'
  }
}

export default function CommandPalette() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const isOpen = useSearchStore((s) => s.isOpen)
  const query = useSearchStore((s) => s.query)
  const selectedIndex = useSearchStore((s) => s.selectedIndex)
  const open = useSearchStore((s) => s.open)
  const close = useSearchStore((s) => s.close)
  const setQuery = useSearchStore((s) => s.setQuery)
  const moveUp = useSearchStore((s) => s.moveUp)
  const moveDown = useSearchStore((s) => s.moveDown)
  const reset = useSearchStore((s) => s.reset)

  const { grouped, isSearching, total } = useGlobalSearch(query)

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    const items: SearchResult[] = []
    for (const type of SECTION_ORDER) {
      if (grouped[type]) {
        items.push(...grouped[type])
      }
    }
    // Include any types not in SECTION_ORDER
    for (const type of Object.keys(grouped)) {
      if (!SECTION_ORDER.includes(type)) {
        items.push(...grouped[type])
      }
    }
    return items
  }, [grouped])

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          close()
        } else {
          open()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, open, close])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (query.length >= 2) {
        addRecentSearch(query)
      }
      reset()
      navigate(getEntityUrl(result))
    },
    [query, reset, navigate],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (selectedIndex < flatResults.length - 1) {
            moveDown()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          moveUp()
          break
        case 'Enter':
          e.preventDefault()
          if (flatResults[selectedIndex]) {
            handleSelect(flatResults[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          reset()
          break
      }
    },
    [selectedIndex, flatResults, moveUp, moveDown, handleSelect, reset],
  )

  const handleRecentClick = (search: string) => {
    setQuery(search)
  }

  const recentSearches = getRecentSearches()
  const showRecents = query.length < 2 && recentSearches.length > 0
  const showResults = query.length >= 2

  // Track running index across sections for keyboard navigation
  let runningIndex = 0

  return (
    <Dialog
      open={isOpen}
      onClose={reset}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '15%',
          m: 0,
          borderRadius: 2,
          maxHeight: '60vh',
        },
      }}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {isSearching ? (
          <CircularProgress size={20} />
        ) : (
          <SearchIcon sx={{ color: 'text.secondary' }} />
        )}
        <InputBase
          inputRef={inputRef}
          autoFocus
          fullWidth
          placeholder="Search issues, projects, wiki..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ fontSize: '1rem' }}
        />
        <Chip
          label="ESC"
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem', height: 22 }}
        />
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        {showRecents && (
          <Box sx={{ p: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Recent searches
            </Typography>
            <List dense sx={{ mt: 0.5 }}>
              {recentSearches.map((search) => (
                <ListItemButton
                  key={search}
                  onClick={() => handleRecentClick(search)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <HistoryIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText primary={search} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}

        {showResults && total === 0 && !isSearching && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No results found for &quot;{query}&quot;
            </Typography>
          </Box>
        )}

        {showResults && total > 0 && (
          <List dense sx={{ py: 1 }}>
            {SECTION_ORDER.map((type) => {
              const results = grouped[type]
              if (!results || results.length === 0) return null

              const sectionStartIndex = runningIndex
              const section = (
                <Box key={type}>
                  {sectionStartIndex > 0 && <Divider />}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 0.5,
                      display: 'block',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {ENTITY_TYPE_LABELS[type] ?? type}
                  </Typography>
                  {results.map((result) => {
                    const itemIndex = runningIndex
                    runningIndex++
                    return (
                      <ListItemButton
                        key={`${result.entity_type}-${result.entity_id}`}
                        selected={selectedIndex === itemIndex}
                        onClick={() => handleSelect(result)}
                        sx={{ mx: 1, borderRadius: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {ENTITY_TYPE_ICONS[result.entity_type] ?? (
                            <SearchIcon fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={result.title}
                          secondary={result.subtitle}
                          primaryTypographyProps={{ noWrap: true }}
                          secondaryTypographyProps={{ noWrap: true }}
                        />
                        {selectedIndex === itemIndex && (
                          <Chip
                            label="ENTER"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20, ml: 1 }}
                          />
                        )}
                      </ListItemButton>
                    )
                  })}
                </Box>
              )
              return section
            })}
          </List>
        )}

        {!showRecents && !showResults && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Start typing to search...
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
