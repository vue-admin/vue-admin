import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime
} from '@/lib/format'

describe('lib/format', () => {
  describe('formatDate', () => {
    it('标准日期格式化', () => {
      const d = new Date('2026-06-29T10:30:45')
      expect(formatDate(d)).toBe('2026-06-29 10:30:45')
    })

    it('自定义 pattern', () => {
      const d = new Date('2026-06-29T10:30:45')
      expect(formatDate(d, 'YYYY/MM/DD')).toBe('2026/06/29')
    })

    it('接受字符串和数字时间戳', () => {
      expect(formatDate('2026-06-29')).toMatch(/2026-06-29/)
      expect(formatDate(Date.UTC(2026, 5, 29))).toBeTruthy()
    })

    it('空值和无效输入返回 "-"', () => {
      expect(formatDate(null)).toBe('-')
      expect(formatDate(undefined)).toBe('-')
      expect(formatDate('')).toBe('-')
      expect(formatDate('not-a-date')).toBe('-')
    })
  })

  describe('formatCurrency', () => {
    it('默认 CNY + zh-CN', () => {
      expect(formatCurrency(1234.5)).toMatch(/¥\s*1,234\.50/)
    })

    it('指定货币和地区', () => {
      expect(formatCurrency(1234.5, 'USD', 'en-US')).toMatch(/1,234\.50/)
    })

    it('接受字符串数字', () => {
      expect(formatCurrency('99.99')).toMatch(/99\.99/)
    })

    it('空值和无效返回 "-"', () => {
      expect(formatCurrency(null)).toBe('-')
      expect(formatCurrency('not-a-number')).toBe('-')
    })
  })

  describe('formatNumber', () => {
    it('默认千分位', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('指定小数位', () => {
      expect(
        formatNumber(0.1234, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      ).toBe('0.12')
    })

    it('空值返回 "-"', () => {
      expect(formatNumber(null)).toBe('-')
      expect(formatNumber('NaN')).toBe('-')
    })
  })

  describe('formatRelativeTime', () => {
    it('未来时间', () => {
      const future = new Date(Date.now() + 5 * 60_000).toISOString()
      expect(formatRelativeTime(future)).toMatch(/分钟后|分钟内|in 5 minutes/)
    })

    it('过去时间', () => {
      const past = new Date(Date.now() - 60 * 60_000).toISOString() // 1 小时前
      const result = formatRelativeTime(past)
      expect(result).toMatch(/小时前|ago/)
    })

    it('低于 1 分钟显示"刚刚"', () => {
      expect(formatRelativeTime(Date.now())).toBe('刚刚')
    })

    it('空值返回 "-"', () => {
      expect(formatRelativeTime(null)).toBe('-')
      expect(formatRelativeTime('invalid')).toBe('-')
    })
  })
})
