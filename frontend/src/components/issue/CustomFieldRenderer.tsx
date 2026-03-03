import { cn } from '@/lib/cn'

interface CustomField {
  name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox' | 'url'
  options?: string[]
  value: unknown
}

interface CustomFieldRendererProps {
  field: CustomField
  onChange: (value: unknown) => void
}

const inputBase =
  'w-full px-3 py-1.5 text-sm border border-surface-200 rounded-[--radius-sm] bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors'

export default function CustomFieldRenderer({ field, onChange }: CustomFieldRendererProps) {
  const { name, field_type, options = [], value } = field

  switch (field_type) {
    case 'text':
      return (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">{name}</label>
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputBase}
          />
        </div>
      )

    case 'number':
      return (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">{name}</label>
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => {
              const num = e.target.value === '' ? null : Number(e.target.value)
              onChange(num)
            }}
            step="any"
            className={inputBase}
          />
        </div>
      )

    case 'date':
      return (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">{name}</label>
          <input
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={inputBase}
          />
        </div>
      )

    case 'select':
      return (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">{name}</label>
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={inputBase}
          >
            <option value="">None</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )

    case 'multi_select': {
      const selected = (value as string[]) ?? []

      const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
          onChange(selected.filter((v) => v !== opt))
        } else {
          onChange([...selected, opt])
        }
      }

      return (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">{name}</label>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selected.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-surface-100 text-text-primary"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() => toggleOption(v)}
                    className="ml-1 text-text-tertiary hover:text-text-primary"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="border border-surface-200 rounded-[--radius-sm] max-h-40 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = selected.includes(opt)
              return (
                <label
                  key={opt}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-surface-50 transition-colors',
                    isSelected && 'bg-primary-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(opt)}
                    className="rounded accent-primary-500"
                  />
                  <span className="text-text-primary">{opt}</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    case 'checkbox':
      return (
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded accent-primary-500"
          />
          <span className="text-sm text-text-primary">{name}</span>
        </label>
      )

    case 'url':
      return (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">{name}</label>
          <input
            type="url"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className={inputBase}
          />
        </div>
      )

    default:
      return (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">{name}</label>
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={inputBase}
          />
        </div>
      )
  }
}
