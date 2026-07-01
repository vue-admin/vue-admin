import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Index.vue'
import nprogress from '@/lib/nprogress'
import menus from './menus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/views/Login.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      name: 'layout',
      component: Layout,
      children: menus
    },
  ]
})

router.beforeEach((to, from, next) => {
  nprogress.start()
  next()
})

router.afterEach(() => {
  nprogress.done()
})

export default router
