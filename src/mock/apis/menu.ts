import type { MockMethod } from 'vite-plugin-mock'

const menus = [
  {
    path: '/',
    name: 'home',
    component: 'HomeView',
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
    component: 'AboutView',
    meta: {
      title: '关于',
      icon: 'about',
      showInbreadcrumb: true,
      showMenu: false
    }
  },
  {
    path: '/user',
    name: 'user',
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
        name: 'multiTwo',
        component: 'multi/List',
        meta: {
          title: '二级菜单',
          showMenu: true
        },
        children: [
          {
            path: '/multi/two/list',
            name: 'multiTwoList',
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
    path: '/admin',
    name: 'admin',
    meta: {
      title: '管理员',
      icon: 'Avatar',
      showMenu: true
    },
    children: [
      {
        path: '/admin/list',
        name: 'adminList',
        component: 'admin/List',
        meta: {
          title: '管理员列表',
          showMenu: true
        }
      }
    ]
  },
  {
    path: '/sys',
    name: 'sys',
    component: 'Sys',
    meta: {
      title: '系统设置',
      icon: 'setting',
      showMenu: true
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: '404'
  }
]

export default [
  {
    url: '/api/system/menus', // 注意，这里只能是string格式
    method: 'get',
    response: (req) => {
      return {
        code: 0,
        data: menus
      }
    }
  }
] as MockMethod[]
