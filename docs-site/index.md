---
layout: home

hero:
  name: Vue Admin
  text: 企业级后台管理前端基座
  tagline: Vue 3 + Vite + TypeScript + Element Plus，约束明确，可直接投产
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/overview
    - theme: alt
      text: GitHub
      link: https://github.com/vue-admin/vue-admin

features:
  - title: 四层目录架构
    details: lib（基础设施） / app（骨架） / modules（业务领域） / shared（共享），ESLint 强制目录边界
  - title: 完整 RBAC
    details: 路由守卫 4 步 + v-permission 指令 + 服务端下发菜单 + isSuperAdmin 短路
  - title: 通用组件库
    details: SearchTable / FormDrawer / PageContainer + useCrud composable，列表/表单页零样板
  - title: 单一 HTTP 客户端
    details: RFC 7807 错误契约 + ProblemDetail + HttpError + 拦截器统一提示
  - title: 主题与国际化
    details: 主色 6 阶派生色算法 + 暗黑模式 + vue-i18n 多语言切换
  - title: 全局错误与交互
    details: ErrorBoundary + loadingService + confirmService + Vue/JS/Promise 全局错误捕获
---
