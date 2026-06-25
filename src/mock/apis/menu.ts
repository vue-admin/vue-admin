import type { MockMethod } from 'vite-plugin-mock'

// Mock：模拟后端下发的菜单结构，作为动态路由契约的参考
const menus = [
  {
    path: '/',
    name: 'home',
    component: 'Home',
    meta: {
      title: '首页',
      icon: 'menu',
      showMenu: true
    }
  },
  {
    path: '/doc',
    name: 'doc',
    component: 'Documents',
    meta: {
      title: '文档',
      icon: 'document',
      showMenu: true
    }
  },
  {
    path: '/about',
    name: 'about',
    component: 'About',
    meta: {
      title: '关于',
      icon: 'InfoFilled',
      showInBreadcrumb: true,
      showMenu: false
    }
  },
  {
    path: '/user',
    name: 'userCenter',
    meta: {
      title: '用户中心',
      icon: 'location',
      showMenu: true
    },
    children: [
      {
        path: '/user/list',
        name: 'userList',
        component: 'user/List',
        meta: {
          title: '用户列表',
          showMenu: true
        }
      },
      {
        path: '/user/portrait',
        name: 'userPortrait',
        component: 'user/Portrait',
        meta: {
          title: '用户画像',
          icon: 'User',
          showMenu: true
        }
      }
    ]
  },
  {
    path: '/multi',
    name: 'multi',
    meta: {
      title: '多级菜单',
      icon: 'ForkSpoon',
      showMenu: true
    },
    children: [
      {
        path: '/multi/two',
        name: 'multiLevel2',
        component: 'multi/List',
        meta: {
          title: '二级菜单',
          showMenu: true
        },
        children: [
          {
            path: '/multi/two/list',
            name: 'multiLevel3',
            component: 'multi/List',
            meta: {
              title: '三级菜单',
              showMenu: true
            }
          }
        ]
      }
    ]
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
        component: 'system/admin/List',
        meta: {
          title: '管理员列表',
          icon: 'Avatar',
          showMenu: true
        }
      },
      {
        path: '/system/config',
        name: 'systemConfig',
        component: 'system/config/Config',
        meta: {
          title: '系统设置',
          icon: 'setting',
          showMenu: true
        }
      }
    ]
  },
  {
    path: '/404',
    name: 'notFound',
    component: 'NotFound'
  }
]

export default [
  {
    url: '/api/system/menus',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: menus
      }
    }
  }
] as MockMethod[]
