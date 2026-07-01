import { describe, it, expect } from 'vitest'
// 直接 import mock 默认导出，调用 response 函数验证业务逻辑（不经 HTTP）
import crudMock from '@/mock/apis/crud'
import logMock from '@/mock/apis/log'
import dictMock from '@/mock/apis/dict'
import noticeMock from '@/mock/apis/notice'
import roleMock from '@/mock/apis/role'

// 从 MockMethod[] 中按 url+method 取出 response 函数
function findHandler(
  mock: { url: string; method: string; response: (req: unknown) => unknown }[],
  url: string,
  method = 'get',
): (req: unknown) => unknown {
  const m = mock.find((it) => it.url === url && it.method.toLowerCase() === method.toLowerCase())
  if (!m) throw new Error(`mock handler not found: ${method} ${url}`)
  return m.response
}

describe('crud mock', () => {
  const handler = findHandler(crudMock as never, '/api/crud', 'get')

  it('name 过滤生效', () => {
    const all = handler({ query: { current: 1, size: 100 } }) as {
      data: { records: { name: string }[] }
    }
    const filtered = handler({ query: { current: 1, size: 100, name: '王小虎' } }) as {
      data: { records: { name: string }[] }
    }
    // 默认数据全是"王小虎"，过滤后数量应等于全量
    expect(filtered.data.records.length).toBe(all.data.records.length)
    const none = handler({ query: { current: 1, size: 100, name: '不存在的名字' } }) as {
      data: { records: unknown[] }
    }
    expect(none.data.records.length).toBe(0)
  })

  it('分页切片生效（返回数量受 size 约束）', () => {
    const page1 = handler({ query: { current: 1, size: 2 } }) as {
      data: { records: unknown[]; total: number }
    }
    expect(page1.data.records.length).toBe(2)
    expect(page1.data.total).toBeGreaterThanOrEqual(4)
  })
})

describe('log mock 时间范围过滤', () => {
  it('登录日志支持 startTime/endTime 过滤', () => {
    const handler = findHandler(logMock as never, '/api/system/login-log', 'get')
    const all = handler({ query: { current: 1, size: 100 } }) as {
      data: { records: { loginTime: string }[]; total: number }
    }
    // 用一个未来的 endTime 限定，结果应为 0
    const future = handler({
      query: { current: 1, size: 100, startTime: '2099-01-01 00:00:00' },
    }) as { data: { total: number } }
    expect(future.data.total).toBe(0)
    // 全量应有数据
    expect(all.data.total).toBeGreaterThan(0)
    // 所有 loginTime 字符串格式合法
    expect(all.data.records[0].loginTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('操作日志支持 startTime/endTime 过滤', () => {
    const handler = findHandler(logMock as never, '/api/system/operation-log', 'get')
    const future = handler({
      query: { current: 1, size: 100, startTime: '2099-01-01 00:00:00' },
    }) as { data: { total: number } }
    expect(future.data.total).toBe(0)
  })
})

describe('导出 CSV 契约', () => {
  const cases = [
    { mock: dictMock, url: '/api/dict/categories/export', name: '字典分类' },
    { mock: logMock, url: '/api/system/login-log/export', name: '登录日志' },
    { mock: noticeMock, url: '/api/system/notice/export', name: '公告' },
    { mock: roleMock, url: '/api/role/export', name: '角色' },
  ]

  for (const c of cases) {
    it(`${c.name} 导出返回 CSV 文本（含表头+数据行）`, () => {
      const handler = findHandler(c.mock as never, c.url, 'get')
      const res = handler({}) as { data: string }
      expect(typeof res.data).toBe('string')
      // 不再是占位 'export success' 或 data URI
      expect(res.data).not.toBe('export success')
      expect(res.data).not.toContain('data:text/csv')
      // CSV 至少含一行表头（含逗号或单字段）+ 至少一行数据
      const lines = res.data.split('\n')
      expect(lines.length).toBeGreaterThanOrEqual(2)
    })
  }
})

describe('notice mock 分类语义一致', () => {
  it('type 按 i%3 轮询保证三类均衡（确定性，不依赖随机分布）', () => {
    const handler = findHandler(noticeMock as never, '/api/system/notice', 'get')
    const res = handler({ query: { page: 1, size: 50 } }) as {
      data: { records: { type: string }[] }
    }
    const types = new Set(res.data.records.map((r) => r.type))
    expect(types.has('announcement')).toBe(true)
    expect(types.has('notice')).toBe(true)
    expect(types.has('todo')).toBe(true)
  })

  it('各类标题含对应关键词（分类语义契约）', () => {
    const handler = findHandler(noticeMock as never, '/api/system/notice', 'get')
    const all = handler({ query: { page: 1, size: 50 } }) as {
      data: { records: { type: string; title: string }[] }
    }
    // 每条 title 必含其 type 对应的关键词（确定性契约）
    const keyword: Record<string, string> = {
      announcement: '公告',
      notice: '通知',
      todo: '安排/待办/待审核',
    }
    for (const r of all.data.records) {
      const kw = keyword[r.type]
      const ok = kw.split('/').some((k) => r.title.includes(k))
      expect(ok, `${r.type} 标题"${r.title}"应含 ${kw}`).toBe(true)
    }
  })
})
