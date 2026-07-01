import { describe, it, expect, beforeAll } from 'vitest'
import { api, http } from '@/lib/http/client'
import httpAdapter from 'axios/unsafe/adapters/http.js'

// jsdom 下 axios 默认走 XHR adapter，MSW node 无法拦截；
// 强制使用 Node http adapter，使测试中的真实 HTTP 请求能被 MSW server 处理
beforeAll(() => {
  http.defaults.adapter = httpAdapter as never
})

// axios 拦截器已把 ApiResult 解包，api.* 返回的是 data 字段本身
type PageRecords<T> = {
  records: T[]
  total: number
  current: number
  size: number
}

describe('crud mock (MSW)', () => {
  it('name 过滤生效', async () => {
    const all = await api.get<PageRecords<{ name: string }>>('/api/crud', {
      params: { current: 1, size: 100 }
    })
    const filtered = await api.get<PageRecords<{ name: string }>>('/api/crud', {
      params: { current: 1, size: 100, name: '王小虎' }
    })
    // 默认数据全是"王小虎"，过滤后数量应等于全量
    expect(filtered.records.length).toBe(all.records.length)

    const none = await api.get<PageRecords<unknown>>('/api/crud', {
      params: { current: 1, size: 100, name: '不存在的名字' }
    })
    expect(none.records.length).toBe(0)
  })

  it('分页切片生效（返回数量受 size 约束）', async () => {
    const page1 = await api.get<PageRecords<unknown>>('/api/crud', {
      params: { current: 1, size: 2 }
    })
    expect(page1.records.length).toBe(2)
    expect(page1.total).toBeGreaterThanOrEqual(4)
  })
})

describe('log mock 时间范围过滤 (MSW)', () => {
  it('登录日志支持 startTime/endTime 过滤', async () => {
    const all = await api.get<PageRecords<{ loginTime: string }>>(
      '/api/system/login-log',
      { params: { page: 1, size: 100 } }
    )

    // 用一个未来的 startTime 限定，结果应为 0
    const future = await api.get<PageRecords<unknown>>('/api/system/login-log', {
      params: { page: 1, size: 100, startTime: '2099-01-01 00:00:00' }
    })
    expect(future.total).toBe(0)

    // 全量应有数据
    expect(all.total).toBeGreaterThan(0)

    // 所有 loginTime 字符串格式合法
    expect(all.records[0].loginTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('操作日志支持 startTime/endTime 过滤', async () => {
    const future = await api.get<PageRecords<unknown>>('/api/system/operation-log', {
      params: { page: 1, size: 100, startTime: '2099-01-01 00:00:00' }
    })
    expect(future.total).toBe(0)
  })
})

describe('导出 CSV 契约 (MSW)', () => {
  const cases = [
    { url: '/api/dict/categories/export', name: '字典分类' },
    { url: '/api/system/login-log/export', name: '登录日志' },
    { url: '/api/system/notice/export', name: '公告' },
    { url: '/api/role/export', name: '角色' }
  ]

  for (const c of cases) {
    it(`${c.name} 导出返回 CSV 文本（含表头+数据行）`, async () => {
      const csv = await api.get<string>(c.url)
      expect(typeof csv).toBe('string')
      // 不再是占位 'export success' 或 data URI
      expect(csv).not.toBe('export success')
      expect(csv).not.toContain('data:text/csv')
      // CSV 至少含一行表头（含逗号或单字段）+ 至少一行数据
      const lines = csv.split('\n')
      expect(lines.length).toBeGreaterThanOrEqual(2)
    })
  }
})

describe('notice mock 分类语义一致 (MSW)', () => {
  it('type 按 i%3 轮询保证三类均衡（确定性，不依赖随机分布）', async () => {
    const res = await api.get<PageRecords<{ type: string }>>('/api/system/notice', {
      params: { page: 1, size: 50 }
    })
    const types = new Set(res.records.map((r) => r.type))
    expect(types.has('announcement')).toBe(true)
    expect(types.has('notice')).toBe(true)
    expect(types.has('todo')).toBe(true)
  })

  it('各类标题含对应关键词（分类语义契约）', async () => {
    const res = await api.get<PageRecords<{ type: string; title: string }>>(
      '/api/system/notice',
      { params: { page: 1, size: 50 } }
    )

    // 每条 title 必含其 type 对应的关键词（确定性契约）
    const keyword: Record<string, string> = {
      announcement: '公告',
      notice: '通知',
      todo: '安排/待办/待审核'
    }
    for (const r of res.records) {
      const kw = keyword[r.type]
      const ok = kw.split('/').some((k) => r.title.includes(k))
      expect(ok, `${r.type} 标题"${r.title}"应含 ${kw}`).toBe(true)
    }
  })
})
