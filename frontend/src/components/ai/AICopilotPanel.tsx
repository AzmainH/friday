import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import { X, Sparkles, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAIChat } from '@/hooks/useAI'
import AIChatMessage from './AIChatMessage'
import AIQuickActions from './AIQuickActions'

interface AICopilotPanelProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AICopilotPanel({ isOpen, onClose, projectId }: AICopilotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm Friday, your AI project management assistant. Ask me anything about your project, or use the quick actions below to get started.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatMutation = useAIChat(projectId)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback(
    (messageText: string) => {
      if (!messageText.trim() || chatMutation.isPending) return

      const userMessage: ChatMessage = {
        role: 'user',
        content: messageText.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')

      chatMutation.mutate(messageText.trim(), {
        onSuccess: (data) => {
          const aiMessage: ChatMessage = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, aiMessage])
        },
        onError: () => {
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.',
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, errorMessage])
        },
      })
    },
    [chatMutation],
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleQuickAction = (message: string) => {
    sendMessage(message)
  }

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[400px] z-50',
          'bg-white dark:bg-surface-100 border-l border-surface-200',
          'shadow-xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#009688]" />
            <h2 className="text-sm font-semibold text-text-primary">Friday AI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[--radius-sm] text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
            aria-label="Close AI panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="border-b border-surface-200 shrink-0">
          <AIQuickActions onAction={handleQuickAction} disabled={chatMutation.isPending} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {messages.map((msg, i) => (
            <AIChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}

          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#009688] text-white shrink-0">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <div className="bg-surface-100 dark:bg-surface-200 rounded-lg rounded-tl-none px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-surface-200 p-3 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Friday anything..."
              rows={1}
              className={cn(
                'flex-1 resize-none rounded-lg border border-surface-200 bg-white dark:bg-surface-200',
                'px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                'max-h-24 overflow-y-auto',
              )}
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
                'bg-primary-600 text-white hover:bg-primary-700 transition-colors',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
