import { z } from 'zod'

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'url'
  | 'user'

export interface CustomFieldDefinition {
  id: string
  name: string
  field_type: CustomFieldType
  required: boolean
  options?: string[]
  default_value?: string
}

export interface CustomFieldValue {
  field_id: string
  value: unknown
}

export function buildFieldSchema(field: CustomFieldDefinition): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (field.field_type) {
    case 'text':
      schema = z.string()
      break
    case 'number':
      schema = z.coerce.number()
      break
    case 'date':
      schema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format')
      break
    case 'select':
      schema = field.options?.length
        ? z.enum(field.options as [string, ...string[]])
        : z.string()
      break
    case 'multiselect':
      schema = field.options?.length
        ? z.array(z.enum(field.options as [string, ...string[]]))
        : z.array(z.string())
      break
    case 'checkbox':
      schema = z.boolean()
      break
    case 'url':
      schema = z.string().url('Invalid URL')
      break
    case 'user':
      schema = z.string().uuid('Invalid user ID')
      break
    default:
      schema = z.string()
  }

  return field.required ? schema : schema.optional().nullable()
}

export function buildCustomFieldsSchema(
  fields: CustomFieldDefinition[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    shape[field.id] = buildFieldSchema(field)
  }
  return z.object(shape)
}

export function parseCustomFieldValue(
  field: CustomFieldDefinition,
  raw: unknown,
): unknown {
  if (raw === null || raw === undefined || raw === '') {
    return field.required ? undefined : null
  }

  switch (field.field_type) {
    case 'number':
      return Number(raw)
    case 'checkbox':
      return Boolean(raw)
    case 'multiselect':
      return Array.isArray(raw) ? raw : [raw]
    default:
      return String(raw)
  }
}
