import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyPrimaryColor, generatePrimaryColorVars } from '@/lib/theme/colors'

describe('lib/theme/colors', () => {
  describe('generatePrimaryColorVars', () => {
    it('生成主色 + 6 阶派生色', () => {
      const vars = generatePrimaryColorVars('#409EFF')
      expect(Object.keys(vars).sort()).toEqual(
        [
          'primary',
          'primary-dark-2',
          'primary-light-3',
          'primary-light-5',
          'primary-light-7',
          'primary-light-8',
          'primary-light-9'
        ].sort()
      )
      expect(vars.primary.toLowerCase()).toBe('#409eff')
    })

    it('light-9 是 90% white 混色，应明显浅于主色', () => {
      const vars = generatePrimaryColorVars('#409EFF')
      // #409EFF 与 #FFFFFF 90% 混色 ≈ #ecf5ff（EP 官方 light-9）
      expect(vars['primary-light-9'].toLowerCase()).toBe('#ecf5ff')
    })

    it('dark-2 是 20% black 混色，应略暗于主色', () => {
      const vars = generatePrimaryColorVars('#409EFF')
      // EP 官方算法：mix(#409EFF, #000, 20%) ≈ #337ecc
      expect(vars['primary-dark-2'].toLowerCase()).toBe('#337ecc')
    })

    it('支持 3 位短 hex 输入', () => {
      const vars = generatePrimaryColorVars('#0ae')
      expect(vars.primary.toLowerCase()).toBe('#00aaee')
    })

    it('无效输入返回空对象且不抛异常', () => {
      expect(generatePrimaryColorVars('not-a-color')).toEqual({})
      expect(generatePrimaryColorVars('')).toEqual({})
      expect(generatePrimaryColorVars('#xyz')).toEqual({})
    })
  })

  describe('applyPrimaryColor', () => {
    beforeEach(() => {
      document.documentElement.style.cssText = ''
    })
    afterEach(() => {
      document.documentElement.style.cssText = ''
    })

    it('把派生色写入 documentElement.style', () => {
      applyPrimaryColor('#409EFF')
      const style = document.documentElement.style
      expect(style.getPropertyValue('--el-color-primary').toLowerCase()).toBe(
        '#409eff'
      )
      expect(
        style.getPropertyValue('--el-color-primary-light-9').toLowerCase()
      ).toBe('#ecf5ff')
      expect(
        style.getPropertyValue('--el-color-primary-dark-2').toLowerCase()
      ).toBe('#337ecc')
    })

    it('无效输入不抛异常、不写入任何变量', () => {
      expect(() => applyPrimaryColor('not-a-color')).not.toThrow()
      expect(
        document.documentElement.style.getPropertyValue('--el-color-primary')
      ).toBe('')
    })
  })
})
