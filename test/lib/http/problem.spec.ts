import { describe, it, expect } from 'vitest'
import { parseProblem } from '@/lib/http/problem'

describe('parseProblem', () => {
  it('规范的 RFC 7807 body 直接解析', () => {
    const body = {
      type: 'https://example.com/probs/out-of-credit',
      title: 'You do not have enough credit.',
      status: 400,
      detail: 'Your current balance is 30, but that costs 50.',
      instance: '/account/12345/msgs/abc'
    }
    const p = parseProblem(400, body)
    expect(p.type).toBe(body.type)
    expect(p.title).toBe(body.title)
    expect(p.status).toBe(400)
    expect(p.detail).toBe(body.detail)
    expect(p.instance).toBe(body.instance)
  })

  it('body 缺失字段时用兜底值', () => {
    const p = parseProblem(500, {})
    expect(p.status).toBe(500)
    expect(p.type).toBe('about:blank')
    expect(p.title).toBe('Internal Server Error')
    expect(p.detail).toBe('')
  })

  it('body 为非对象时也能解析', () => {
    const p = parseProblem(404, 'not found string')
    expect(p.status).toBe(404)
    expect(p.detail).toBe('not found string')
  })

  it('字段级 errors 保留', () => {
    const p = parseProblem(422, {
      errors: { username: ['already taken'], email: ['invalid'] }
    })
    expect(p.errors?.username).toEqual(['already taken'])
    expect(p.errors?.email).toEqual(['invalid'])
  })
})
