/**
 * 业务枚举映射集中常量。
 *
 * 用途：消除 StatusTag 业务映射、通知优先级、角色类型等在多组件重复定义。
 * 类型策略：`type` 字段直接对齐 Element Plus 的 Tag/Alert `type` 取值。
 */

// Element Plus 组件 type 取值（el-tag / el-alert 共用）
export type EpType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

// 状态映射条目类型（与 StatusTag 内部 StatusMap 一致）
export type StatusMapEntry = Record<
  string,
  { type: EpType; text: string }
>

/** 通用启用/禁用状态 */
export const COMMON_STATUS_MAP: StatusMapEntry = {
  active: { type: 'success', text: '启用' },
  inactive: { type: 'info', text: '禁用' },
}

/** 用户角色（user List 用） */
export const ROLE_STATUS_MAP: StatusMapEntry = {
  admin: { type: 'danger', text: '管理员' },
  user: { type: 'info', text: '普通用户' },
  vip: { type: 'success', text: 'VIP 用户' },
}

/** 权限模块（permission List 用） */
export const MODULE_STATUS_MAP: StatusMapEntry = {
  system: { type: 'primary', text: '系统管理' },
  user: { type: 'info', text: '用户管理' },
  role: { type: 'warning', text: '角色管理' },
  permission: { type: 'success', text: '权限管理' },
  dict: { type: 'danger', text: '字典管理' },
  config: { type: 'info', text: '系统配置' },
}

/** 通知优先级文本（公告/通知/待办共用） */
export const PRIORITY_LABEL: Record<string, string> = {
  high: '紧急',
  medium: '重要',
  low: '普通',
}

/** 通知优先级 → el-tag type 映射 */
export const PRIORITY_TAG_TYPE: Record<string, EpType> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
}

/** 通知优先级 → el-alert type 映射 */
export const PRIORITY_ALERT_TYPE: Record<string, 'error' | 'warning' | 'info'> = {
  high: 'error',
  medium: 'warning',
  low: 'info',
}

/** 通知类型文本 */
export const NOTICE_TYPE_LABEL: Record<string, string> = {
  announcement: '公告',
  notice: '通知',
  todo: '待办',
}

/** 工具：根据优先级 code 取 label，缺省返回"普通" */
export function priorityLabel(code?: string): string {
  return PRIORITY_LABEL[code || 'low'] || '普通'
}

/** 工具：根据优先级 code 取 el-tag type */
export function priorityTagType(code?: string): EpType {
  return PRIORITY_TAG_TYPE[code || 'low'] || 'info'
}

/** 工具：根据优先级 code 取 el-alert type */
export function priorityAlertType(
  code?: string
): 'error' | 'warning' | 'info' {
  return PRIORITY_ALERT_TYPE[code || 'low'] || 'info'
}

/** 工具：根据通知 type 取 label */
export function noticeTypeLabel(code?: string): string {
  return NOTICE_TYPE_LABEL[code || 'announcement'] || '公告'
}

/** 通用启用/禁用 select 选项（FormDrawer 字段配置直接复用） */
export const COMMON_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' },
] as const

/** 用户角色 select 选项 */
export const ROLE_OPTIONS = [
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' },
  { label: 'VIP 用户', value: 'vip' },
] as const

/** 通知优先级 select 选项 */
export const PRIORITY_OPTIONS = [
  { label: '紧急', value: 'high' },
  { label: '重要', value: 'medium' },
  { label: '普通', value: 'low' },
] as const

/** 通知类型 select 选项 */
export const NOTICE_TYPE_OPTIONS = [
  { label: '公告', value: 'announcement' },
  { label: '通知', value: 'notice' },
  { label: '待办', value: 'todo' },
] as const
