// 通用格式化工具。无 Vue 依赖，可在任意环境使用。
// 复用 Intl API，避免引入 dayjs/date-fns（按 YAGNI，待真有需求再升级）。

const DEFAULT_DATE_PATTERN = 'YYYY-MM-DD HH:mm:ss'
const DEFAULT_LOCALE = 'zh-CN'
const DEFAULT_CURRENCY = 'CNY'

type DateInput = string | number | Date | null | undefined

// 将任意日期输入标准化为 Date 对象。无效输入返回 null。
function toDate(input: DateInput): Date | null {
  if (input === null || input === undefined || input === '') return null
  const d = input instanceof Date ? input : new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

// 格式化日期。pattern 仅做轻量 token 替换；复杂需求请用 Intl.DateTimeFormat。
// 支持 token：YYYY MM DD HH mm ss
export function formatDate(
  input: DateInput,
  pattern: string = DEFAULT_DATE_PATTERN
): string {
  const d = toDate(input)
  if (!d) return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return pattern
    .replace('YYYY', String(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()))
}

// 格式化货币。默认 CNY + zh-CN。
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  if (value === null || value === undefined || value === '') return '-'
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '-'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    n
  )
}

// 格式化数字。默认千分位。
export function formatNumber(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
  locale: string = DEFAULT_LOCALE
): string {
  if (value === null || value === undefined || value === '') return '-'
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '-'
  return new Intl.NumberFormat(locale, options).format(n)
}

// 相对时间（"3 分钟前"）。低于 1 分钟显示"刚刚"。
export function formatRelativeTime(
  input: DateInput,
  locale: string = DEFAULT_LOCALE
): string {
  const d = toDate(input)
  if (!d) return '-'
  const diff = d.getTime() - Date.now()
  const absDiff = Math.abs(diff)
  if (absDiff < 60_000) return '刚刚'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  // 单位阈值（毫秒）：找到第一个 absDiff < threshold 的档位即采用该单位。
  // 计算数值时除以"低一档"的阈值，得到 1~N 之间的整数。
  const divisions: Array<{
    amount: number
    unit: Intl.RelativeTimeFormatUnit
  }> = [
    { amount: 60_000, unit: 'second' },
    { amount: 3_600_000, unit: 'minute' },
    { amount: 86_400_000, unit: 'hour' },
    { amount: 604_800_000, unit: 'day' },
    { amount: 2_592_000_000, unit: 'week' },
    { amount: 31_536_000_000, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' }
  ]
  const idx = divisions.findIndex((dv) => absDiff < dv.amount)
  const i = idx === -1 ? divisions.length - 1 : idx
  const { unit } = divisions[i]
  const lower = divisions[i - 1]
  return rtf.format(Math.round(diff / (lower?.amount ?? 1)), unit)
}
