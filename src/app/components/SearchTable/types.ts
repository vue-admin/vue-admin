export interface ColumnDef {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  slot?: string
  formatter?: (
    row: Record<string, unknown>,
    col: ColumnDef,
    value: unknown
  ) => string
  // 是否允许在列设置中隐藏；默认 true。设为 false 则该列始终显示。
  hideable?: boolean
  // 默认是否隐藏（仅初始/无缓存时生效）
  defaultHidden?: boolean
}

export interface SearchTableProps {
  loading: boolean
  data: Record<string, unknown>[]
  columns: ColumnDef[]
  pagination: { page: number; size: number; total: number }
  selectedRows?: Record<string, unknown>[]
  selectable?: boolean
  rowKey?: string
  title?: string
  treeProps?: { children?: string; hasChildren?: string }
  defaultExpandAll?: boolean
  // 列设置持久化 key（建议每个使用页唯一）。传入后列显隐将记忆到 localStorage。
  columnSettingsKey?: string
  // 是否显示列设置入口；默认 true
  showColumnSettings?: boolean
}
