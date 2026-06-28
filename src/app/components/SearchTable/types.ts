export interface ColumnDef {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  slot?: string
  formatter?: (row: Record<string, unknown>, col: ColumnDef, value: unknown) => string
}

export interface SearchTableProps {
  loading: boolean
  data: Record<string, unknown>[]
  columns: ColumnDef[]
  pagination: { page: number; size: number; total: number }
  selectedRows?: Record<string, unknown>[]
  selectable?: boolean
  rowKey?: string
}
