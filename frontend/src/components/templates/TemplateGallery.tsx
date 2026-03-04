import { useState, useMemo } from 'react'
import { Search, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTemplates, type ProjectTemplate } from '@/hooks/useTemplates'
import { Skeleton } from '@/components/ui/Skeleton'
import TemplateCard from './TemplateCard'

const ALL_CATEGORIES = 'All'

function getCategoryFromTemplate(template: ProjectTemplate): string {
  const data = template.template_data as Record<string, unknown>
  if (typeof data.category === 'string') return data.category
  return 'General'
}

export interface TemplateGalleryProps {
  onSelectTemplate: (template: ProjectTemplate) => void
}

export default function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const { data: templates = [], isLoading } = useTemplates()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    templates.forEach((t) => cats.add(getCategoryFromTemplate(t)))
    return [ALL_CATEGORIES, ...Array.from(cats).sort()]
  }, [templates])

  // Filter templates by search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesCategory =
        activeCategory === ALL_CATEGORIES ||
        getCategoryFromTemplate(t) === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [templates, searchTerm, activeCategory])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-text-primary mb-1">
          No templates available
        </h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Project templates haven&apos;t been created yet. You can create a project from scratch
          using the wizard, or ask your administrator to set up templates.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            'w-full rounded-[--radius-sm] border border-surface-200 bg-white pl-9 pr-3 py-2 text-sm',
            'text-text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'dark:bg-surface-100 dark:border-surface-200',
          )}
        />
      </div>

      {/* Category filter chips */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors',
                activeCategory === category
                  ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
                  : 'bg-surface-50 text-text-secondary border-surface-200 hover:bg-surface-100 dark:bg-surface-200 dark:border-surface-300',
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Template grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={onSelectTemplate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-text-secondary">
            No templates match your search. Try a different term or category.
          </p>
        </div>
      )}
    </div>
  )
}
