import { cn } from '@/lib/cn'
import { Bot, User } from 'lucide-react'

interface AIChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export default function AIChatMessage({ role, content, timestamp }: AIChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-2.5 mb-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5',
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-[#009688] text-white',
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary-600 text-white rounded-tr-none'
            : 'bg-surface-100 dark:bg-surface-200 text-text-primary rounded-tl-none',
        )}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {timestamp && (
          <div
            className={cn(
              'text-[10px] mt-1',
              isUser ? 'text-white/60' : 'text-text-tertiary',
            )}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}
