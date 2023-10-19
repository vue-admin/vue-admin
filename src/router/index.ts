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
          meta: {
            title: '首页',
            showInbreadcrumb: false
          }
        },
        {
          path: '/doc',
          name: 'doc',
          component: () => import('@/views/Documents.vue'),
          meta: {
            title: '文档',
            showInbreadcrumb: true
          }
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
          meta: {
            title: '关于',
            showInbreadcrumb: true
          }
        },
        {
          path: '',
          name: 'user',
          meta: {
            title: '用户中心',
            showInbreadcrumb: true
          },
          children: [
            {
              path: '/user/list',
              name: 'userList',
              component: () => import('@/views/user/List.vue'),
              meta: {
                title: '用户列表',
                showInbreadcrumb: true
              }
            },
            {
              path: '/user/portrait',
              name: 'userPortrait',
              component: () => import('@/views/user/Portrait.vue'),
              meta: {
                title: '用户画像',
                showInbreadcrumb: true
              }
            }
          ]
        },
        {
          path: '',
          name: 'merchant',
          meta: {
            title: '商家',
            showInbreadcrumb: true
          },
          children: [
            {
              path: '/merchant/list',
              name: 'merchantList',
              component: () => import('@/views/merchant/List.vue'),
              meta: {
                title: '商家列表',
                showInbreadcrumb: true
              }
            }
          ]
        },
        {
          path: '',
          name: 'admin',
          meta: {
            title: '管理员',
            showInbreadcrumb: true
          },
          children: [
            {
              path: '/admin/list',
              name: 'adminList',
              component: () => import('@/views/admin/List.vue'),
              meta: {
                title: '管理员列表',
                showInbreadcrumb: true
              }
            }
          ]
        },
        {
          path: '/sys',
          name: 'sys',
          component: () => import('@/views//Sys.vue'),
          meta: {
            title: '系统设置',
            showInbreadcrumb: true
          }
        },
        {
          path: '/404',
          name: 'NotFound',
          component: () => import('@/views/404.vue')
        }
      ]
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/404',
      meta: {
        showInbreadcrumb: false
      }
    }
  ]
})

export default router
