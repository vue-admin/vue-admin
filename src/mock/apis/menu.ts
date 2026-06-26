import type { MockMethod } from 'vite-plugin-mock'

// 全部菜单（带权限元信息）
const ALL_MENUS = [
  {
    path: '/',
    name: 'home',
    component: 'Home',
    meta: { title: '首页', icon: 'menu', showMenu: true },
  },
  {
    path: '/system',
    name: 'system',
    meta: { title: '系统管理', icon: 'setting', showMenu: true },
    children: [
      {
        path: '/system/admin',
        name: 'systemAdmin',
        component: 'system/admin/List',
        meta: {
          title: '管理员',
          icon: 'Avatar',
          showMenu: true,
          permissions: { any: ['admin:read', '*'] },
        },
      },
      {
        path: '/system/dict',
        name: 'systemDict',
        component: 'system/dict/List',
        meta: {
          title: '字典管理',
          icon: 'DataBoard',
          showMenu: true,
          permissions: { any: ['dict:read', '*'] },
        },
      },
    ],
  },
]

export default [
  {
    url: '/api/system/menus',
    method: 'get',
    response: ({ headers }: { headers: { authorization?: string } }) => {
      const auth = headers.authorization || ''
      const token = auth.replace(/^Bearer\s+/, '')
      // 简化：admin token 形如 a_admin_<ts>_<rand>，含 _admin_ 字段
      const isAdmin = token.includes('_admin_')
      const data = isAdmin ? ALL_MENUS : [ALL_MENUS[0]]
      return { code: 0, data, msg: 'ok' }
    },
  },
] as MockMethod[]
