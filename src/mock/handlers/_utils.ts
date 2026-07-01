import { HttpResponse } from 'msw'

// 成功响应：ApiResult 包装（HTTP 200 + code:0）
export const ok = <T>(data: T, msg = 'ok') =>
  HttpResponse.json({ code: 0, data, msg })

// 失败响应：过渡形态 { code:<非0>, msg, data:null }，由拦截器触发 HttpError
export const fail = (code: number, msg: string) =>
  HttpResponse.json({ code, msg, data: null })

// 将对象数组转为 CSV 文本（含表头）。字段含逗号/引号时用双引号包裹并转义。
export function toCsv(rows: object[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    const r = row as Record<string, unknown>
    lines.push(headers.map((h) => escape(r[h])).join(','))
  }
  return lines.join('\n')
}
