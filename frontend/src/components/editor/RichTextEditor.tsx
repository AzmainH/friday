import { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import ChecklistIcon from '@mui/icons-material/Checklist'
import CodeIcon from '@mui/icons-material/Code'
import ImageIcon from '@mui/icons-material/Image'
import TitleIcon from '@mui/icons-material/Title'

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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.25,
        px: 1,
        py: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Tooltip title="Bold">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBold().run()}
          color={editor.isActive('bold') ? 'primary' : 'default'}
        >
          <FormatBoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Italic">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          color={editor.isActive('italic') ? 'primary' : 'default'}
        >
          <FormatItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Strikethrough">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          color={editor.isActive('strike') ? 'primary' : 'default'}
        >
          <StrikethroughSIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Heading 1">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          color={editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'}
        >
          <TitleIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Heading 2">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          color={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
          sx={{ '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}
        >
          <TitleIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Heading 3">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          color={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'}
          sx={{ '& .MuiSvgIcon-root': { fontSize: '0.9rem' } }}
        >
          <TitleIcon />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Bullet List">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          color={editor.isActive('bulletList') ? 'primary' : 'default'}
        >
          <FormatListBulletedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Ordered List">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          color={editor.isActive('orderedList') ? 'primary' : 'default'}
        >
          <FormatListNumberedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Task List">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          color={editor.isActive('taskList') ? 'primary' : 'default'}
        >
          <ChecklistIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Code Block">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          color={editor.isActive('codeBlock') ? 'primary' : 'default'}
        >
          <CodeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Image">
        <IconButton size="small" onClick={addImage}>
          <ImageIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
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
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
        },
        '& .tiptap': {
          minHeight,
          px: 2,
          py: 1.5,
          outline: 'none',
          '& p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
            pointerEvents: 'none',
            float: 'left',
            height: 0,
          },
          '& h1': { fontSize: '1.75rem', fontWeight: 700, mt: 2, mb: 1 },
          '& h2': { fontSize: '1.4rem', fontWeight: 600, mt: 1.5, mb: 0.75 },
          '& h3': { fontSize: '1.15rem', fontWeight: 600, mt: 1, mb: 0.5 },
          '& p': { my: 0.5 },
          '& ul, & ol': { pl: 3 },
          '& ul[data-type="taskList"]': {
            listStyle: 'none',
            pl: 0,
            '& li': {
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              '& label': { mt: 0.25 },
            },
          },
          '& pre': {
            bgcolor: 'action.hover',
            borderRadius: 1,
            p: 1.5,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            overflow: 'auto',
          },
          '& code': {
            bgcolor: 'action.hover',
            borderRadius: 0.5,
            px: 0.5,
            py: 0.25,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 1,
          },
          '& mark': {
            bgcolor: 'warning.light',
            borderRadius: 0.25,
            px: 0.25,
          },
        },
      }}
    >
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </Box>
  )
}
