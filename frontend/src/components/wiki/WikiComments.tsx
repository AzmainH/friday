import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Collapse from '@mui/material/Collapse'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ReplyIcon from '@mui/icons-material/Reply'
import SendIcon from '@mui/icons-material/Send'
import RichTextEditor from '@/components/editor/RichTextEditor'
import {
  useWikiComments,
  useAddWikiComment,
  useUpdateWikiComment,
  useDeleteWikiComment,
} from '@/hooks/useWiki'
import type { WikiComment } from '@/hooks/useWiki'
import { useAuthStore } from '@/stores/authStore'
import { formatRelativeTime } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WikiCommentsProps {
  pageId: string
}

// ---------------------------------------------------------------------------
// Single comment item with threading
// ---------------------------------------------------------------------------

function CommentItem({
  comment,
  pageId,
  currentUserId,
  depth,
}: {
  comment: WikiComment
  pageId: string
  currentUserId: string | null
  depth: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [showReplies, setShowReplies] = useState(true)

  const updateComment = useUpdateWikiComment()
  const deleteComment = useDeleteWikiComment()
  const addComment = useAddWikiComment()

  const isOwner = currentUserId === comment.author_id
  const hasReplies = (comment.replies?.length ?? 0) > 0
  const maxNesting = 4

  const handleSaveEdit = useCallback(() => {
    updateComment.mutate(
      { commentId: comment.id, content: editContent, pageId },
      { onSuccess: () => setIsEditing(false) },
    )
  }, [comment.id, editContent, pageId, updateComment])

  const handleDelete = useCallback(() => {
    setMenuAnchor(null)
    deleteComment.mutate({ commentId: comment.id, pageId })
  }, [comment.id, pageId, deleteComment])

  const handleReply = useCallback(() => {
    if (!replyContent.trim() || replyContent === '<p></p>') return
    addComment.mutate(
      { pageId, content: replyContent, parentCommentId: comment.id },
      {
        onSuccess: () => {
          setReplyContent('')
          setIsReplying(false)
          setShowReplies(true)
        },
      },
    )
  }, [replyContent, pageId, comment.id, addComment])

  return (
    <Box sx={{ ml: depth > 0 ? 3 : 0 }}>
      <Box sx={{ display: 'flex', gap: 1.5, py: 1.5 }}>
        <Avatar
          src={comment.author?.avatar_url ?? undefined}
          alt={comment.author?.display_name ?? 'User'}
          sx={{ width: 28, height: 28, fontSize: '0.75rem', mt: 0.25 }}
        >
          {(comment.author?.display_name ?? 'U').charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
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
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
              {depth < maxNesting && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsReplying(!isReplying)
                    setReplyContent('')
                  }}
                  sx={{ p: 0.25 }}
                >
                  <ReplyIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              {isOwner && (
                <>
                  <IconButton
                    size="small"
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    sx={{ p: 0.25 }}
                  >
                    <MoreVertIcon sx={{ fontSize: 16 }} />
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
                </>
              )}
            </Box>
          </Box>

          {/* Content */}
          {isEditing ? (
            <Box>
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                minHeight={60}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveEdit}
                  disabled={updateComment.isPending || !editContent.trim()}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  onClick={() => setIsEditing(false)}
                  disabled={updateComment.isPending}
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

          {/* Reply form */}
          <Collapse in={isReplying} timeout="auto">
            <Box sx={{ mt: 1.5 }}>
              <RichTextEditor
                content={replyContent}
                onChange={setReplyContent}
                placeholder="Write a reply..."
                minHeight={60}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleReply}
                  disabled={
                    addComment.isPending || !replyContent.trim() || replyContent === '<p></p>'
                  }
                  startIcon={<SendIcon />}
                >
                  Reply
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyContent('')
                  }}
                  disabled={addComment.isPending}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Collapse>

          {/* Toggle replies */}
          {hasReplies && (
            <Button
              size="small"
              onClick={() => setShowReplies(!showReplies)}
              sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.75rem' }}
            >
              {showReplies
                ? `Hide ${comment.replies!.length} ${comment.replies!.length === 1 ? 'reply' : 'replies'}`
                : `Show ${comment.replies!.length} ${comment.replies!.length === 1 ? 'reply' : 'replies'}`}
            </Button>
          )}
        </Box>
      </Box>

      {/* Nested replies */}
      {hasReplies && (
        <Collapse in={showReplies} timeout="auto">
          <Box
            sx={{
              borderLeft: '2px solid',
              borderColor: 'divider',
              ml: 1.5,
            }}
          >
            {comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                pageId={pageId}
                currentUserId={currentUserId}
                depth={depth + 1}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// WikiComments
// ---------------------------------------------------------------------------

export default function WikiComments({ pageId }: WikiCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const { data, isLoading } = useWikiComments(pageId)
  const addComment = useAddWikiComment()
  const currentUserId = useAuthStore((s) => s.currentUserId)

  const comments = data ?? []

  const handleSubmit = useCallback(() => {
    if (!newComment.trim() || newComment === '<p></p>') return
    addComment.mutate(
      { pageId, content: newComment, parentCommentId: null },
      {
        onSuccess: () => setNewComment(''),
      },
    )
  }, [newComment, pageId, addComment])

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="30%" height={18} />
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width="50%" height={16} />
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
            pageId={pageId}
            currentUserId={currentUserId}
            depth={0}
          />
          {index < comments.length - 1 && <Divider sx={{ ml: 5 }} />}
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
