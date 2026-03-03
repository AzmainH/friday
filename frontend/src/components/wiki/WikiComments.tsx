import { useState, useCallback } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { Pencil, Trash2, MoreVertical, Reply, Send } from 'lucide-react'
import { cn } from '@/lib/cn'
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

  const initials = (comment.author?.display_name ?? 'U').charAt(0).toUpperCase()

  return (
    <div className={cn(depth > 0 && 'ml-6')}>
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={comment.author?.display_name ?? 'User'}
            className="w-7 h-7 rounded-full shrink-0 mt-0.5 object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-text-primary">
              {comment.author?.display_name ?? 'Unknown user'}
            </span>
            <span className="text-xs text-text-tertiary">
              {formatRelativeTime(comment.created_at)}
            </span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-text-tertiary">(edited)</span>
            )}
            <div className="ml-auto flex items-center">
              {depth < maxNesting && (
                <button
                  type="button"
                  onClick={() => {
                    setIsReplying(!isReplying)
                    setReplyContent('')
                  }}
                  className="p-0.5 rounded hover:bg-surface-100 transition-colors text-text-secondary"
                >
                  <Reply size={16} />
                </button>
              )}
              {isOwner && (
                <Menu as="div" className="relative">
                  <MenuButton className="p-0.5 rounded hover:bg-surface-100 transition-colors text-text-secondary">
                    <MoreVertical size={16} />
                  </MenuButton>
                  <MenuItems
                    anchor="bottom end"
                    className="z-50 w-36 rounded-[var(--radius-md)] bg-white dark:bg-surface-800 shadow-lg ring-1 ring-black/5 focus:outline-none py-1"
                  >
                    <MenuItem>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text-primary data-[focus]:bg-surface-50"
                        onClick={() => {
                          setIsEditing(true)
                          setEditContent(comment.content)
                        }}
                      >
                        <Pencil size={14} className="text-text-secondary" />
                        Edit
                      </button>
                    </MenuItem>
                    <MenuItem>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 data-[focus]:bg-surface-50"
                        onClick={handleDelete}
                      >
                        <Trash2 size={14} className="text-red-500" />
                        Delete
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              )}
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <div>
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                minHeight={60}
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updateComment.isPending || !editContent.trim()}
                  className="px-3 py-1 text-sm font-medium rounded-[var(--radius-sm)] bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={updateComment.isPending}
                  className="px-3 py-1 text-sm rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-100 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          )}

          {/* Reply form */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              isReplying ? 'max-h-[500px] mt-3' : 'max-h-0',
            )}
          >
            <RichTextEditor
              content={replyContent}
              onChange={setReplyContent}
              placeholder="Write a reply..."
              minHeight={60}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleReply}
                disabled={
                  addComment.isPending || !replyContent.trim() || replyContent === '<p></p>'
                }
                className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-[var(--radius-sm)] bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
                Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false)
                  setReplyContent('')
                }}
                disabled={addComment.isPending}
                className="px-3 py-1 text-sm rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Toggle replies */}
          {hasReplies && (
            <button
              type="button"
              onClick={() => setShowReplies(!showReplies)}
              className="mt-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
            >
              {showReplies
                ? `Hide ${comment.replies!.length} ${comment.replies!.length === 1 ? 'reply' : 'replies'}`
                : `Show ${comment.replies!.length} ${comment.replies!.length === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            showReplies ? 'max-h-[9999px]' : 'max-h-0',
          )}
        >
          <div className="border-l-2 border-surface-200 ml-3">
            {comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                pageId={pageId}
                currentUserId={currentUserId}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
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
      <div className="p-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-surface-100 animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-[30%] bg-surface-100 animate-pulse rounded mb-1" />
              <div className="h-3.5 w-[80%] bg-surface-100 animate-pulse rounded mb-1" />
              <div className="h-3.5 w-[50%] bg-surface-100 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-2">
        Comments ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-text-secondary py-4">
          No comments yet. Be the first to comment.
        </p>
      )}

      {comments.map((comment, index) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            pageId={pageId}
            currentUserId={currentUserId}
            depth={0}
          />
          {index < comments.length - 1 && (
            <hr className="border-surface-200 ml-10" />
          )}
        </div>
      ))}

      <hr className="border-surface-200 my-4" />

      <h3 className="text-sm font-semibold text-text-primary mb-2">
        Add a comment
      </h3>
      <RichTextEditor
        content={newComment}
        onChange={setNewComment}
        placeholder="Write a comment..."
        minHeight={80}
      />
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={addComment.isPending || !newComment.trim() || newComment === '<p></p>'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={14} />
          Comment
        </button>
      </div>
    </div>
  )
}
