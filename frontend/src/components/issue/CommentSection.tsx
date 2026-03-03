import { useState } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SendIcon from '@mui/icons-material/Send'
import RichTextEditor from '@/components/editor/RichTextEditor'
import {
  useIssueComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/useIssueDetail'
import { useAuthStore } from '@/stores/authStore'
import { formatRelativeTime } from '@/utils/formatters'
import type { IssueComment } from '@/types/api'

interface CommentSectionProps {
  issueId: string
}

function CommentItem({
  comment,
  issueId,
  currentUserId,
}: {
  comment: IssueComment
  issueId: string
  currentUserId: string | null
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const updateMutation = useUpdateComment()
  const deleteMutation = useDeleteComment()

  const isOwner = currentUserId === comment.author_id

  const handleSaveEdit = () => {
    updateMutation.mutate(
      { commentId: comment.id, content: editContent, issueId },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  const handleDelete = () => {
    setMenuAnchor(null)
    deleteMutation.mutate({ commentId: comment.id, issueId })
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, py: 2 }}>
      <Avatar
        src={comment.author?.avatar_url ?? undefined}
        alt={comment.author?.display_name ?? 'User'}
        sx={{ width: 32, height: 32, fontSize: '0.8rem', mt: 0.25 }}
      >
        {(comment.author?.display_name ?? 'U').charAt(0).toUpperCase()}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" fontWeight={600}>
            {comment.author?.display_name ?? 'Unknown user'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatRelativeTime(comment.created_at)}
          </Typography>
          {comment.updated_at !== comment.created_at && (
            <Typography variant="caption" color="text.secondary">
              (edited)
            </Typography>
          )}
          {isOwner && (
            <Box sx={{ ml: 'auto' }}>
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null)
                    setIsEditing(true)
                    setEditContent(comment.content)
                  }}
                >
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        {isEditing ? (
          <Box>
            <RichTextEditor
              content={editContent}
              onChange={setEditContent}
              minHeight={80}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending || !editContent.trim()}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              '& p': { my: 0.25 },
              '& p:first-of-type': { mt: 0 },
              '& p:last-of-type': { mb: 0 },
              fontSize: '0.875rem',
            }}
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        )}
      </Box>
    </Box>
  )
}

export default function CommentSection({ issueId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const { data, isLoading } = useIssueComments(issueId)
  const addComment = useAddComment()
  const currentUserId = useAuthStore((s) => s.currentUserId)

  const comments = data?.data ?? []

  const handleSubmit = () => {
    if (!newComment.trim() || newComment === '<p></p>') return
    addComment.mutate(
      { issueId, content: newComment },
      {
        onSuccess: () => setNewComment(''),
      },
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="80%" height={18} />
              <Skeleton variant="text" width="60%" height={18} />
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Comments ({comments.length})
      </Typography>

      {comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No comments yet. Be the first to comment.
        </Typography>
      )}

      {comments.map((comment, index) => (
        <Box key={comment.id}>
          <CommentItem
            comment={comment}
            issueId={issueId}
            currentUserId={currentUserId}
          />
          {index < comments.length - 1 && <Divider />}
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Add a comment
      </Typography>
      <RichTextEditor
        content={newComment}
        onChange={setNewComment}
        placeholder="Write a comment..."
        minHeight={80}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={addComment.isPending || !newComment.trim() || newComment === '<p></p>'}
          startIcon={<SendIcon />}
        >
          Comment
        </Button>
      </Box>
    </Box>
  )
}
