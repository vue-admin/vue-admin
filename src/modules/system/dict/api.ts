// system/dict 领域 API。
// 迁移自 src/apis/dict/index.ts。
// 统一走 @/lib/http/client 的 api 辅助函数（已解包 data）。
import { api } from '@/lib/http/client'

// 定义字典分类类型
export interface DictCategoryInfo {
  id: string
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 定义字典类型
export interface DictInfo {
  id: string
  categoryId: string
  name: string
  code: string
  description: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 定义字典项类型
export interface DictItemInfo {
  id: string
  dictId: string
  name: string
  code: string
  value: string
  sort: number
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 搜索参数类型
export interface DictCategorySearchRequest {
  keyword: string
  status: string
  page: number
  size: number
}

export interface DictSearchRequest {
  keyword: string
  categoryId: string
  status: string
  page: number
  size: number
}

export interface DictItemSearchRequest {
  keyword: string
  dictId: string
  status: string
  page: number
  size: number
}

// 创建参数类型
export interface DictCategoryCreateRequest {
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
}

export interface DictCreateRequest {
  categoryId: string
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
}

export interface DictItemCreateRequest {
  dictId: string
  name: string
  code: string
  value: string
  sort: number
  status: 'active' | 'inactive'
}

// 列表响应类型
export interface DictCategorySearchResponse {
  records: DictCategoryInfo[]
  total: number
  current: number
  size: number
}

export interface DictSearchResponse {
  records: DictInfo[]
  total: number
  current: number
  size: number
}

export interface DictItemSearchResponse {
  records: DictItemInfo[]
  total: number
  current: number
  size: number
}

// 获取字典分类列表
export const fetchDictCategoryList = (params: DictCategorySearchRequest) =>
  api.get<DictCategorySearchResponse>('/api/dict/category/list', { params })

// 获取字典分类详情
export const fetchDictCategoryDetail = (id: string) =>
  api.get<DictCategoryInfo>(`/api/dict/category/detail/${id}`)

// 创建字典分类
export const createDictCategory = (data: DictCategoryCreateRequest) =>
  api.post<DictCategoryInfo>('/api/dict/category/create', data)

// 更新字典分类
export const updateDictCategory = (id: string, data: Partial<DictCategoryCreateRequest>) =>
  api.put<DictCategoryInfo>(`/api/dict/category/update/${id}`, data)

// 删除字典分类
export const deleteDictCategory = (id: string) =>
  api.del<boolean>(`/api/dict/category/delete/${id}`)

// 批量删除字典分类
export const batchDeleteDictCategories = (ids: string[]) =>
  api.post<boolean>('/api/dict/category/batch-delete', { ids })

// 导出字典分类列表
export const exportDictCategories = () =>
  api.get<string>('/api/dict/category/export')

// 获取字典列表
export const fetchDictList = (params: DictSearchRequest) =>
  api.get<DictSearchResponse>('/api/dict/list', { params })

// 获取字典详情
export const fetchDictDetail = (id: string) =>
  api.get<DictInfo>(`/api/dict/detail/${id}`)

// 创建字典
export const createDict = (data: DictCreateRequest) =>
  api.post<DictInfo>('/api/dict/create', data)

// 更新字典
export const updateDict = (id: string, data: Partial<DictCreateRequest>) =>
  api.put<DictInfo>(`/api/dict/update/${id}`, data)

// 删除字典
export const deleteDict = (id: string) =>
  api.del<boolean>(`/api/dict/delete/${id}`)

// 批量删除字典
export const batchDeleteDicts = (ids: string[]) =>
  api.post<boolean>('/api/dict/batch-delete', { ids })

// 导出字典列表
export const exportDicts = () =>
  api.get<string>('/api/dict/export')

// 获取字典项列表
export const fetchDictItemList = (params: DictItemSearchRequest) =>
  api.get<DictItemSearchResponse>('/api/dict/item/list', { params })

// 获取字典项详情
export const fetchDictItemDetail = (id: string) =>
  api.get<DictItemInfo>(`/api/dict/item/detail/${id}`)

// 创建字典项
export const createDictItem = (data: DictItemCreateRequest) =>
  api.post<DictItemInfo>('/api/dict/item/create', data)

// 更新字典项
export const updateDictItem = (id: string, data: Partial<DictItemCreateRequest>) =>
  api.put<DictItemInfo>(`/api/dict/item/update/${id}`, data)

// 删除字典项
export const deleteDictItem = (id: string) =>
  api.del<boolean>(`/api/dict/item/delete/${id}`)

// 批量删除字典项
export const batchDeleteDictItems = (ids: string[]) =>
  api.post<boolean>('/api/dict/item/batch-delete', { ids })

// 导出字典项列表
export const exportDictItems = () =>
  api.get<string>('/api/dict/item/export')
