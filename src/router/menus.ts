const menus = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: '首页',
      icon: 'menu',
      showMenu: true
    }
  },
  {
    path: '/doc',
    name: 'doc',
    component: () => import('@/views/Documents.vue'),
    meta: {
      title: '文档',
      icon: 'document',
      showMenu: false
    }
  },
  {
    path: '/curd',
    name: '增删改查',
    meta: {
      title: '增删改查',
      icon: 'document',
      showMenu: true
    },
    children: [
      {
        path: '/crud/list',
        name: 'crudList',
        component: () => import('@/views/crud/Index.vue'),
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
    component: () => import('@/views/AboutView.vue'),
    meta: {
      title: '关于',
      icon: 'about',
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
        component: () => import('@/views/user/List.vue'),
        meta: {
          title: '用户列表',
          showMenu: true
        }
      }
    ]
  },
  {
    path: '/multi',
    name: 'multi',
    component: () => import('@/views/multi/Level1.vue'),
    meta: {
      title: '多级菜单',
      icon: 'ForkSpoon',
      showMenu: true
    },
    children: [
      {
        path: '/multi/two',
        name: 'multiTwo',
        component: () => import('@/views/multi/Level2.vue'),
        meta: {
          title: '二级菜单',
          showMenu: true
        },
        children: [
          {
            path: '/multi/two/list',
            name: 'multiTwoList',
            component: () => import('@/views/multi/Level3.vue'),
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
        name: 'admin',
        component: () => import('@/views/system/admin/List.vue'),
        meta: {
          title: '管理员',
          icon: 'Avatar',
          showMenu: true
        }
      },
      {
        path: '/system/role',
        name: 'role',
        component: () => import('@/views/system/role/List.vue'),
        meta: {
          title: '角色管理',
          icon: 'User',
          showMenu: true
        }
      },
      {
        path: '/system/permission',
        name: 'permission',
        component: () => import('@/views/system/permission/List.vue'),
        meta: {
          title: '权限管理',
          icon: 'Lock',
          showMenu: true
        }
      },
      {
        path: '/system/dict',
        name: 'dict',
        component: () => import('@/views/system/dict/List.vue'),
        meta: {
          title: '字典管理',
          icon: 'DataBoard',
          showMenu: true
        }
      },
      {
        path: '/system/config',
        name: 'sysConfig',
        component: () => import('@/views/system/config/Sys.vue'),
        meta: {
          title: '系统配置',
          icon: 'Setting',
          showMenu: true
        }
      },
      {
        path: '/system/portrait',
        name: 'systemPortrait',
        component: () => import('@/views/system/portrait/Portrait.vue'),
        meta: {
          title: '个人中心',
          icon: 'User',
          showMenu: false
        }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/404.vue')
  }
]
export default menus
