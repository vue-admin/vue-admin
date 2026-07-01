import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  title: 'Vue Admin',
  description:
    'Vue 3 + Vite + TypeScript + Element Plus 企业级后台管理前端基座',
  lang: 'zh-CN',
  lastUpdated: true,
  // 关闭 cleanUrls：生成 /guide/xxx.html 而非 /guide/xxx，
  // 这样 nginx 无需 SPA fallback 即可直接访问静态文件
  cleanUrls: false,
  // 文档 base 可经 DOCS_BASE 覆盖：GitHub Pages 用 /vue-admin/，云主机子路径用 /docs/
  base: process.env.DOCS_BASE ?? '/vue-admin/',
  ignoreDeadLinks: true,
  head: [['meta', { name: 'theme-color', content: '#409EFF' }]],
  // docs-site 直接 import src/ 下真实组件，需配置 @ 别名指向项目 src/
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../src', import.meta.url))
      }
    },
    // vue-i18n 在 SSR 引用 Vue 编译期 feature flag，需显式定义
    define: {
      __VUE_PROD_DEVTOOLS__: false
    }
  },
  themeConfig: {
    logo: '/logo.svg',
    search: {
      provider: 'local'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '规范', link: '/guide/overview' },
      { text: '组件', link: '/components/search-table' },
      { text: 'GitHub', link: 'https://github.com/vue-admin/vue-admin' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '概览',
          items: [{ text: '演进路线', link: '/guide/overview' }]
        },
        {
          text: '快速上手',
          items: [
            { text: '快速上手', link: '/guide/getting-started' },
            { text: '云主机部署', link: '/guide/deploy' }
          ]
        },
        {
          text: '工程规范',
          items: [
            { text: '架构', link: '/guide/architecture' },
            { text: 'API 客户端', link: '/guide/api' },
            { text: '状态管理', link: '/guide/state' },
            { text: '命名约定', link: '/guide/naming' },
            { text: '模块开发', link: '/guide/module' },
            { text: '通用服务', link: '/guide/lib' }
          ]
        },
        {
          text: '开发实践',
          items: [
            { text: '新增业务模块', link: '/guide/module-development' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        },
        {
          text: '项目',
          items: [
            { text: '更新日志', link: '/guide/changelog' },
            { text: '贡献指南', link: '/guide/contributing' }
          ]
        }
      ],
      '/components/': [
        {
          text: '通用组件',
          items: [
            { text: 'SearchTable', link: '/components/search-table' },
            { text: 'FormDrawer', link: '/components/form-drawer' },
            { text: 'PageContainer', link: '/components/page-container' },
            { text: 'Selectors', link: '/components/selectors' },
            { text: 'StatusTag', link: '/components/status-tag' },
            { text: 'DictTag', link: '/components/dict-tag' },
            { text: 'ErrorBoundary', link: '/components/error-boundary' },
            { text: '通用服务', link: '/components/services' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vue-admin/vue-admin' }
    ],
    footer: {
      message: '基于 MIT 协议发布',
      copyright: 'Copyright © 2026 Vue Admin'
    },
    outline: { level: [2, 3] },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新'
  }
})
