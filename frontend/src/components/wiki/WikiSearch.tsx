import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import SearchIcon from '@mui/icons-material/Search'
import ArticleIcon from '@mui/icons-material/Article'
import { useWikiSearch } from '@/hooks/useWiki'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WikiSearchProps {
  spaceId: string
  onPageSelect?: (pageId: string) => void
}

// ---------------------------------------------------------------------------
// WikiSearch
// ---------------------------------------------------------------------------

export default function WikiSearch({ spaceId, onPageSelect }: WikiSearchProps) {
  const [query, setQuery] = useState('')
  const { data: results, isLoading, isFetching } = useWikiSearch(spaceId, query)

  const searchResults = results ?? []
  const hasQuery = query.trim().length >= 2
  const showResults = hasQuery

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Search input */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search wiki pages..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: isFetching ? (
            <InputAdornment position="end">
              <CircularProgress size={16} />
            </InputAdornment>
          ) : null,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
          },
        }}
      />

      {/* Results */}
      {showResults && (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : searchResults.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No results found for &quot;{query}&quot;
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </Typography>
              </Box>
              <List disablePadding>
                {searchResults.map((result) => (
                  <ListItemButton
                    key={result.page_id}
                    onClick={() => onPageSelect?.(result.page_id)}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ArticleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {result.title}
                          </Typography>
                          {result.relevance >= 0.8 && (
                            <Chip
                              label="Best match"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        result.snippet ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              '& mark': {
                                bgcolor: 'warning.light',
                                borderRadius: 0.25,
                                px: 0.25,
                                color: 'inherit',
                              },
                            }}
                            dangerouslySetInnerHTML={{ __html: result.snippet }}
                          />
                        ) : null
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}
        </Box>
      )}
    </Box>
  )
}
