import { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Code,
  ImageIcon,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react'
import { cn } from '@/lib/cn'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  editable?: boolean
  minHeight?: number
}

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>
}

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-2 py-1 border-b border-surface-200">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('bold') && 'bg-primary-100 text-primary-700'
        )}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('italic') && 'bg-primary-100 text-primary-700'
        )}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('strike') && 'bg-primary-100 text-primary-700'
        )}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-surface-200 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('heading', { level: 1 }) && 'bg-primary-100 text-primary-700'
        )}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('heading', { level: 2 }) && 'bg-primary-100 text-primary-700'
        )}
        title="Heading 2"
      >
        <Heading2 className="w-[15px] h-[15px]" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('heading', { level: 3 }) && 'bg-primary-100 text-primary-700'
        )}
        title="Heading 3"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-5 bg-surface-200 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('bulletList') && 'bg-primary-100 text-primary-700'
        )}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('orderedList') && 'bg-primary-100 text-primary-700'
        )}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('taskList') && 'bg-primary-100 text-primary-700'
        )}
        title="Task List"
      >
        <ListChecks className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-surface-200 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(
          'p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors',
          editor.isActive('codeBlock') && 'bg-primary-100 text-primary-700'
        )}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={addImage}
        className="p-1.5 rounded-md text-text-secondary hover:bg-surface-100 hover:text-text-primary transition-colors"
        title="Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  minHeight = 150,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  return (
    <div
      className={cn(
        'border border-surface-200 rounded-[--radius-sm] overflow-hidden',
        'focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500'
      )}
    >
      {editable && <Toolbar editor={editor} />}
      <div className="prose prose-sm max-w-none px-4 py-3" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
