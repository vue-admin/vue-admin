// notice 领域 API。
import { api } from '@/lib/http/client'

export interface NoticeInfo {
  id: string
  title: string
  content: string
  type: 'announcement' | 'notice' | 'todo'
  status: 'published' | 'draft' | 'expired'
  priority: 'high' | 'medium' | 'low'
  publishTime?: string
  expireTime?: string
  publisher: string
  createTime: string
  updateTime: string
}

export interface NoticeSearchRequest {
  keyword: string
  type: string
  status: string
  page: number
  size: number
}

export interface NoticeCreateRequest {
  title: string
  content: string
  type: 'announcement' | 'notice' | 'todo'
  status: 'published' | 'draft' | 'expired'
  priority: 'high' | 'medium' | 'low'
  publishTime?: string
  expireTime?: string
}

export interface NoticeSearchResponse {
  records: NoticeInfo[]
  total: number
  current: number
  size: number
}

// 获取公告列表
export const fetchNoticeList = (params: NoticeSearchRequest) =>
  api.get<NoticeSearchResponse>('/api/system/notice', { params })

// 获取公告详情
export const fetchNoticeDetail = (id: string) =>
  api.get<NoticeInfo>(`/api/system/notice/${id}`)

// 新增公告
export const createNotice = (data: NoticeCreateRequest) =>
  api.post<NoticeInfo>('/api/system/notice', data)

// 更新公告
export const updateNotice = (id: string, data: Partial<NoticeCreateRequest>) =>
  api.put<NoticeInfo>(`/api/system/notice/${id}`, data)

// 删除公告
export const deleteNotice = (id: string) =>
  api.del<boolean>(`/api/system/notice/${id}`)

// 批量删除公告
export const batchDeleteNotices = (ids: string[]) =>
  api.del<boolean>('/api/system/notice', { data: { ids } })

// 发布公告
export const publishNotice = (id: string) =>
  api.post<NoticeInfo>(`/api/system/notice/${id}/publish`)

// 撤销公告
export const revokeNotice = (id: string) =>
  api.post<NoticeInfo>(`/api/system/notice/${id}/revoke`)

// 导出公告
export const exportNotices = () =>
  api.get<string>('/api/system/notice/export')
