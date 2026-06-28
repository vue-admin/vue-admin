import type { RouteRecordRaw } from 'vue-router'

const menus: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/modules/dashboard/views/Home.vue'),
    meta: {
      title: '首页',
      icon: 'menu',
      showMenu: true
    }
  },
  {
    path: '/doc',
    name: 'doc',
    component: () => import('@/modules/docs/views/Documents.vue'),
    meta: {
      title: '文档',
      icon: 'document',
      showMenu: false
    }
  },
  {
    path: '/crud',
    name: 'crud',
    meta: {
      title: '增删改查',
      icon: 'document',
      showMenu: true
    },
    children: [
      {
        path: '/crud/list',
        name: 'crudList',
        component: () => import('@/modules/crud/views/Index.vue'),
        meta: {
          title: '列表',
          showMenu: true
        }
      }
    ]
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/modules/about/views/About.vue'),
    meta: {
      title: '关于',
      icon: 'InfoFilled',
      showMenu: false
    }
  },
  {
    path: '/system',
    name: 'system',
    meta: {
      title: '系统管理',
      icon: 'setting',
      showMenu: true
    },
    children: [
      {
        path: '/system/admin',
        name: 'systemAdmin',
        component: () => import('@/modules/system/views/admin/List.vue'),
        meta: {
          title: '管理员',
          icon: 'Avatar',
          showMenu: true
        }
      },
      {
        path: '/system/user',
        name: 'systemUser',
        component: () => import('@/modules/system/user/views/List.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          showMenu: true
        }
      },
      {
        path: '/system/role',
        name: 'systemRole',
        component: () => import('@/modules/system/views/role/List.vue'),
        meta: {
          title: '角色管理',
          icon: 'User',
          showMenu: true
        }
      },
      {
        path: '/system/permission',
        name: 'systemPermission',
        component: () => import('@/modules/system/views/permission/List.vue'),
        meta: {
          title: '权限管理',
          icon: 'Lock',
          showMenu: true
        }
      },
      {
        path: '/system/dict',
        name: 'systemDict',
        component: () => import('@/modules/system/views/dict/List.vue'),
        meta: {
          title: '字典管理',
          icon: 'DataBoard',
          showMenu: true
        }
      }
    ]
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
    component: () => import('@/app/views/NotFound.vue')
  }
]

export default menus
