/**
 * 主色派生色生成器。
 *
 * Element Plus 切换 `--el-color-primary` 时不会自动重算 light-3/5/7/8/9 + dark-2
 * 派生色（按钮 hover / active / disabled、`type="primary"` 容器浅背景等都依赖这些变量）。
 * 本模块按 EP 官方 SCSS `mix($weight, $color1, $color2)` 语义在运行时算出派生色，
 * 写入 `:root` 让所有 EP 组件跟随主色。
 */

const NAMED_WEIGHTS = [3, 5, 7, 8, 9] as const

function normalizeHex(input: string): string | null {
  if (!input) return null
  let h = input.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null
  return h.toLowerCase()
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  )
}

function mix(weight: number, c1: string, c2: string): string {
  const a = hexToRgb(c1)
  const b = hexToRgb(c2)
  return rgbToHex(
    a[0] * weight + b[0] * (1 - weight),
    a[1] * weight + b[1] * (1 - weight),
    a[2] * weight + b[2] * (1 - weight),
  )
}

export function generatePrimaryColorVars(primary: string): Record<string, string> {
  const hex = normalizeHex(primary)
  if (!hex) return {}

  const vars: Record<string, string> = { primary: `#${hex}` }
  for (const w of NAMED_WEIGHTS) {
    vars[`primary-light-${w}`] = mix(w / 10, 'ffffff', hex)
  }
  vars['primary-dark-2'] = mix(0.2, '000000', hex)
  return vars
}

export function applyPrimaryColor(primary: string): void {
  const vars = generatePrimaryColorVars(primary)
  const root = document.documentElement.style
  for (const [key, value] of Object.entries(vars)) {
    root.setProperty(`--el-color-${key}`, value)
  }
}
