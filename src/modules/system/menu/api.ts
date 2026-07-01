// system/menu 领域 API —— 菜单管理 CRUD。
// 与 src/mock/apis/menu.ts（用户菜单端点 /api/system/menus）不同，
// 这里是菜单管理页面的 CRUD 端点 /api/system/menu/*。
import { api } from '@/lib/http/client'

export interface MenuInfo {
  id: string
  parentId: string | null
  name: string
  path: string
  component?: string
  icon?: string
  sort: number
  status: 'active' | 'inactive'
  children?: MenuInfo[]
}

export interface MenuCreateRequest {
  parentId: string | null
  name: string
  path: string
  component?: string
  icon?: string
  sort: number
  status: 'active' | 'inactive'
}

export interface MenuSortRequest {
  draggingId: string
  targetId: string
  position: 'before' | 'after' | 'inner'
}

// 获取完整菜单树
export const fetchMenuTree = () =>
  api.get<MenuInfo[]>('/api/system/menu?view=tree')

// 创建菜单
export const createMenu = (data: MenuCreateRequest) =>
  api.post<MenuInfo>('/api/system/menu', data)

// 更新菜单
export const updateMenu = (id: string, data: Partial<MenuCreateRequest>) =>
  api.put<MenuInfo>(`/api/system/menu/${id}`, data)

// 删除菜单
export const deleteMenu = (id: string) =>
  api.del<boolean>(`/api/system/menu/${id}`)

// 拖拽排序
export const updateMenuSort = (data: MenuSortRequest) =>
  api.patch<boolean>('/api/system/menu/sort', data)
