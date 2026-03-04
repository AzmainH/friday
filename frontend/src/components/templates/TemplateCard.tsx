import {
  Folder,
  Code,
  Megaphone,
  Rocket,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ProjectTemplate } from '@/hooks/useTemplates'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Software Development': <Code className="h-8 w-8" />,
  Marketing: <Megaphone className="h-8 w-8" />,
  'Product Launch': <Rocket className="h-8 w-8" />,
  General: <LayoutGrid className="h-8 w-8" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Software Development': 'text-blue-500',
  Marketing: 'text-purple-500',
  'Product Launch': 'text-orange-500',
  General: 'text-emerald-500',
}

function getCategoryFromTemplate(template: ProjectTemplate): string {
  const data = template.template_data as Record<string, unknown>
  if (typeof data.category === 'string') return data.category
  return 'General'
}

export interface TemplateCardProps {
  template: ProjectTemplate
  onSelect: (template: ProjectTemplate) => void
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const category = getCategoryFromTemplate(template)
  const icon = CATEGORY_ICONS[category] ?? <Folder className="h-8 w-8" />
  const colorClass = CATEGORY_COLORS[category] ?? 'text-text-secondary'

  return (
    <div
      className={cn(
        'border border-surface-200 rounded-[--radius-md] bg-white dark:bg-dark-surface p-4',
        'hover:shadow-md transition-all duration-200 cursor-pointer',
        'flex flex-col gap-3',
      )}
      onClick={() => onSelect(template)}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2 rounded-[--radius-sm] bg-surface-50 dark:bg-surface-200', colorClass)}>
          {icon}
        </div>
        {category !== 'General' && (
          <Badge variant="default" size="sm">
            {category}
          </Badge>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <h4 className="text-sm font-semibold text-text-primary mb-1 truncate">
          {template.name}
        </h4>
        <p className="text-xs text-text-secondary line-clamp-2">
          {template.description ?? 'No description provided.'}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation()
          onSelect(template)
        }}
      >
        Use Template
      </Button>
    </div>
  )
}
