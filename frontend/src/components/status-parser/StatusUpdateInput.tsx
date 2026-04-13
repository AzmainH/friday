import { useState, type FormEvent } from 'react'
import { Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useParseStatusUpdate, type ParsedStatusUpdate } from '@/hooks/useNLStatusParser'

interface StatusUpdateInputProps {
  projectId: string
  onParsed: (result: ParsedStatusUpdate) => void
}

export default function StatusUpdateInput({ projectId, onParsed }: StatusUpdateInputProps) {
  const [text, setText] = useState('')
  const parseMutation = useParseStatusUpdate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || parseMutation.isPending) return

    parseMutation.mutate(
      { projectId, freeText: text.trim() },
      {
        onSuccess: (data) => {
          onParsed(data)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label
        htmlFor="status-update-input"
        className="text-sm font-medium text-text-primary"
      >
        Status Update
      </label>
      <textarea
        id="status-update-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Design mockups are 80% done, blocked on client feedback. Backend API is complete."
        rows={6}
        className={cn(
          'w-full resize-none rounded-lg border border-surface-200',
          'bg-white dark:bg-surface-200',
          'px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
        )}
        disabled={parseMutation.isPending}
      />

      {parseMutation.isError && (
        <p className="text-sm text-red-500">
          Failed to parse status update. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={!text.trim() || parseMutation.isPending}
        className={cn(
          'flex items-center justify-center gap-2 self-end',
          'rounded-lg px-4 py-2 text-sm font-medium',
          'bg-primary-600 text-white hover:bg-primary-700 transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        {parseMutation.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Parsing...
          </>
        ) : (
          <>
            <Send size={16} />
            Parse Update
          </>
        )}
      </button>
    </form>
  )
}
