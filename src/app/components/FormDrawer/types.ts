export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'password'
  | 'treeSelect'
  | 'cascader'

export type FormDrawerMode = 'add' | 'edit' | 'view'

export interface FormFieldOption {
  label: string
  value: string | number | boolean
}

export interface FormFieldDependency {
  /** 触发字段名 */
  trigger: string
  /** 显示条件，返回 true 时字段可见 */
  show: (
    values: Record<string, unknown>,
    ctx: { mode: FormDrawerMode }
  ) => boolean
}

/** Element Plus FormItemRule 的子集，避免导入 element-plus 类型造成循环依赖 */
export interface FormFieldRule {
  required?: boolean
  message?: string
  trigger?: string | string[]
  min?: number
  max?: number
  type?: string
  pattern?: RegExp
  validator?: (
    rule: unknown,
    value: unknown,
    callback: (error?: Error) => void
  ) => void
}

export interface FormField {
  prop: string
  label: string
  type: FormFieldType
  options?: FormFieldOption[]
  /** treeSelect 字段的树形数据 */
  treeData?: TreeNodeData[]
  /** treeSelect 字段的 props 配置 */
  treeProps?: { label: string; children: string; disabled?: string }
  placeholder?: string
  default?: unknown
  span?: number
  disabled?: boolean
  /** 声明式联动：所有 dependency 的 show 都返回 true 时字段才可见 */
  dependencies?: FormFieldDependency[]
  /** field-level 校验规则，透传到 el-form-item */
  rules?: FormFieldRule[]
}

export interface TreeNodeData {
  id: string | number
  label?: string
  children?: TreeNodeData[]
  [key: string]: unknown
}

export interface FormDrawerProps {
  modelValue: boolean
  title: string
  formData: Record<string, unknown>
  fields: FormField[]
  rules?: Record<string, FormFieldRule[]>
  loading?: boolean
  width?: string
  /** 抽屉模式，view 时全字段 disabled 且 footer 仅显示关闭按钮。默认 'add' */
  mode?: FormDrawerMode
}
