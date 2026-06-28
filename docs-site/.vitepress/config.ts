import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue Admin',
  description: 'Vue 3 + Vite + TypeScript + Element Plus 企业级后台管理前端基座',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  base: '/vue-admin/',
  ignoreDeadLinks: true,
  head: [
    ['meta', { name: 'theme-color', content: '#409EFF' }],
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '规范', link: '/guide/overview' },
      { text: '组件', link: '/components/search-table' },
      { text: 'GitHub', link: 'https://github.com/vue-admin/vue-admin' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '概览',
          items: [
            { text: '演进路线', link: '/guide/overview' },
          ],
        },
        {
          text: '工程规范',
          items: [
            { text: '架构', link: '/guide/architecture' },
            { text: 'API 客户端', link: '/guide/api' },
            { text: '状态管理', link: '/guide/state' },
            { text: '命名约定', link: '/guide/naming' },
          ],
        },
      ],
      '/components/': [
        {
          text: '通用组件',
          items: [
            { text: 'SearchTable', link: '/components/search-table' },
            { text: 'FormDrawer', link: '/components/form-drawer' },
            { text: 'PageContainer', link: '/components/page-container' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vue-admin/vue-admin' },
    ],
    footer: {
      message: '基于 MIT 协议发布',
      copyright: 'Copyright © 2026 Vue Admin',
    },
    outline: { level: [2, 3] },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新',
  },
})
