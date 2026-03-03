import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import type { User } from '@/types/api'

interface MentionSuggestionProps {
  items: User[]
  command: (item: { id: string; label: string }) => void
}

export interface MentionSuggestionRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const MentionSuggestion = forwardRef<MentionSuggestionRef, MentionSuggestionProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command({ id: item.id, label: item.display_name })
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <Paper elevation={4} sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            No users found
          </Typography>
        </Paper>
      )
    }

    return (
      <Paper elevation={4} sx={{ maxHeight: 240, overflow: 'auto', minWidth: 220 }}>
        <List dense disablePadding>
          {items.map((user, index) => (
            <ListItemButton
              key={user.id}
              selected={index === selectedIndex}
              onClick={() => selectItem(index)}
              sx={{ py: 0.75 }}
            >
              <ListItemAvatar sx={{ minWidth: 36 }}>
                <Avatar
                  src={user.avatar_url ?? undefined}
                  alt={user.display_name}
                  sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                >
                  {user.display_name.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user.display_name}
                secondary={user.email}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    )
  },
)

MentionSuggestion.displayName = 'MentionSuggestion'

export default MentionSuggestion
