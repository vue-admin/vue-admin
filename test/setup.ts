import { config } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { i18n } from '@/lib/i18n'

// 全局注册 Element Plus + i18n，让所有测试中 EP 组件与 useI18n() 可解析
config.global.plugins = [
  [ElementPlus, {}],
  i18n
]
