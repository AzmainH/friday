import { useState } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { Pencil, Trash2, MoreVertical, Send } from 'lucide-react'
import RichTextEditor from '@/components/editor/RichTextEditor'
import {
  useIssueComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/useIssueDetail'
import { useAuthStore } from '@/stores/authStore'
import { formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/lib/cn'
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
    deleteMutation.mutate({ commentId: comment.id, issueId })
  }

  const initial = (comment.author?.display_name ?? 'U').charAt(0).toUpperCase()

  return (
    <div className="flex gap-3 py-4">
      {/* Avatar */}
      {comment.author?.avatar_url ? (
        <img
          src={comment.author.avatar_url}
          alt={comment.author?.display_name ?? 'User'}
          className="w-8 h-8 rounded-full object-cover mt-0.5 shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold mt-0.5 shrink-0">
          {initial}
        </div>
      )}

      <div className="flex-1 min-w-0">
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

          {isOwner && (
            <div className="ml-auto">
              <Menu as="div" className="relative">
                <MenuButton className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-1 w-36 origin-top-right rounded-[--radius-sm] bg-white dark:bg-dark-surface border border-surface-200 shadow-[--shadow-md] transition duration-150 data-[closed]:opacity-0 data-[closed]:scale-95"
                >
                  <MenuItem>
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setEditContent(comment.content)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-surface-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          )}
        </div>

        {isEditing ? (
          <div>
            <RichTextEditor
              content={editContent}
              onChange={setEditContent}
              minHeight={80}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending || !editContent.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-[--radius-sm] transition-colors disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 rounded-[--radius-sm] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none text-text-primary dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        )}
      </div>
    </div>
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
      <div className="p-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-3 mb-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-surface-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-[30%] bg-surface-200 rounded" />
              <div className="h-3.5 w-[80%] bg-surface-200 rounded" />
              <div className="h-3.5 w-[60%] bg-surface-200 rounded" />
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
        <p className="text-sm text-text-tertiary py-4">
          No comments yet. Be the first to comment.
        </p>
      )}

      {comments.map((comment, index) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            issueId={issueId}
            currentUserId={currentUserId}
          />
          {index < comments.length - 1 && (
            <hr className="border-surface-200" />
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
          onClick={handleSubmit}
          disabled={addComment.isPending || !newComment.trim() || newComment === '<p></p>'}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-[--radius-sm] transition-colors disabled:opacity-50 shadow-sm',
          )}
        >
          <Send className="w-4 h-4" />
          Comment
        </button>
      </div>
    </div>
  )
}
