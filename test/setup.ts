import { config } from '@vue/test-utils'
import ElementPlus from 'element-plus'

// 全局注册 Element Plus，让所有测试中 EP 组件可解析
config.global.plugins = [[ElementPlus, {}]]
