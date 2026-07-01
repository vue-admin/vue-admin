import type { RouteRecordRaw } from 'vue-router'

// 静态路由：仅保留无权限要求的入口页面
// 业务菜单（system/* 等）完全由后端 API 下发，见 src/mock/apis/menu.ts
const menus: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/modules/dashboard/views/Home.vue'),
    meta: {
      title: '首页',
      icon: 'HomeFilled',
      showMenu: true
    }
  },
  {
    path: '/crud',
    name: 'crud',
    component: () => import('@/modules/crud/views/List.vue'),
    meta: {
      title: '增删改查',
      icon: 'Document',
      showMenu: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/modules/profile/views/Profile.vue'),
    meta: {
      title: '个人中心',
      icon: 'User',
      showMenu: false
    }
  },
  {
    path: '/404',
    name: 'notFound',
    component: () => import('@/modules/about/views/NotFound.vue')
  }
]

export default menus
