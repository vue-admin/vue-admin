import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/',
      name: 'layout',
      component: Layout,
      children: [
        {
          path: '/',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
        },
        {
          path: '/user',
          name: 'user',
          children: [
            {
              path: '/user/list',
              name: 'userList',
              component: () => import('@/views/user/List.vue'),
            },
            {
              path: '/user/portrait',
              name: 'userPortrait',
              component: () => import('@/views/user/Portrait.vue'),
            },
          ]
        },
        {
          path: '/404',
          name: 'NotFound',
          component: () => import('@/views/404.vue'),
        },
      ]
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/404'
    },
  ]
})

export default router
