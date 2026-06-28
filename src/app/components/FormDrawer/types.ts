export type FormFieldType =
  | 'input' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox'
  | 'switch' | 'date'

export interface FormFieldOption {
  label: string
  value: string | number | boolean
}

export interface FormField {
  prop: string
  label: string
  type: FormFieldType
  options?: FormFieldOption[]
  placeholder?: string
  default?: unknown
  span?: number
  disabled?: boolean
}

export interface FormDrawerProps {
  modelValue: boolean
  title: string
  formData: Record<string, unknown>
  fields: FormField[]
  rules?: Record<string, unknown>
  loading?: boolean
  width?: string
}
