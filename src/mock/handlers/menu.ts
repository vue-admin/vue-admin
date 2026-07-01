import { http } from 'msw'
import { ok } from './_utils'

// 全部菜单（带权限元信息）
// 从 src/mock/apis/menu.ts 原样移植，避免两份维护
const ALL_MENUS = [
  {
    path: '/',
    name: 'home',
    component: 'dashboard/views/Home',
    meta: { title: '首页', icon: 'HomeFilled', showMenu: true }
  },
  {
    path: '/crud',
    name: 'crud',
    component: 'crud/views/List',
    meta: { title: '增删改查', icon: 'Document', showMenu: true }
  },
  {
    path: '/system',
    name: 'system',
    meta: { title: '系统管理', icon: 'Setting', showMenu: true },
    children: [
      {
        path: '/system/access',
        name: 'systemAccess',
        meta: {
          title: '访问控制',
          icon: 'UserFilled',
          showMenu: true
        },
        children: [
          {
            path: '/system/user',
            name: 'systemUser',
            component: 'system/user/views/List',
            meta: {
              title: '用户管理',
              icon: 'User',
              showMenu: true,
              permissions: { any: ['user:read', '*'] }
            }
          },
          {
            path: '/system/role',
            name: 'systemRole',
            component: 'system/role/views/List',
            meta: {
              title: '角色管理',
              icon: 'Avatar',
              showMenu: true,
              permissions: { any: ['role:read', '*'] }
            }
          },
          {
            path: '/system/dept',
            name: 'systemDept',
            component: 'system/dept/views/List',
            meta: {
              title: '部门管理',
              icon: 'OfficeBuilding',
              showMenu: true,
              permissions: { any: ['dept:read', '*'] }
            }
          },
          {
            path: '/system/permission',
            name: 'systemPermission',
            component: 'system/permission/views/List',
            meta: {
              title: '权限管理',
              icon: 'Lock',
              showMenu: true,
              permissions: { any: ['permission:read', '*'] }
            }
          },
          {
            path: '/system/menu',
            name: 'systemMenu',
            component: 'system/menu/views/List',
            meta: {
              title: '菜单管理',
              icon: 'Menu',
              showMenu: true,
              permissions: { any: ['menu:read', '*'] }
            }
          }
        ]
      },
      {
        path: '/system/config',
        name: 'systemConfig',
        meta: {
          title: '系统配置',
          icon: 'Tools',
          showMenu: true
        },
        children: [
          {
            path: '/system/dict',
            name: 'systemDict',
            component: 'system/dict/views/List',
            meta: {
              title: '字典管理',
              icon: 'DataBoard',
              showMenu: true,
              permissions: { any: ['dict:read', '*'] }
            }
          },
          {
            path: '/system/notice',
            name: 'systemNotice',
            component: 'system/notice/views/List',
            meta: {
              title: '公告管理',
              icon: 'Bell',
              showMenu: true,
              permissions: { any: ['notice:read', '*'] }
            }
          }
        ]
      },
      {
        path: '/system/log',
        name: 'systemLog',
        meta: {
          title: '日志管理',
          icon: 'Tickets',
          showMenu: true,
          permissions: { any: ['log:read', '*'] }
        },
        children: [
          {
            path: '/system/log/login',
            name: 'systemLogLogin',
            component: 'system/log/views/LoginLogList',
            meta: {
              title: '登录日志',
              icon: 'Key',
              showMenu: true,
              permissions: { any: ['log:read', '*'] }
            }
          },
          {
            path: '/system/log/operation',
            name: 'systemLogOperation',
            component: 'system/log/views/OperationLogList',
            meta: {
              title: '操作日志',
              icon: 'Operation',
              showMenu: true,
              permissions: { any: ['log:read', '*'] }
            }
          }
        ]
      }
    ]
  }
]

export const menuHandlers = [
  http.get('/api/system/menus', ({ request }) => {
    const auth = request.headers.get('authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/, '')
    // 简化：admin token 形如 a_admin_<ts>_<rand>，含 _admin_ 字段
    const isAdmin = token.includes('_admin_')
    const data = isAdmin ? ALL_MENUS : [ALL_MENUS[0]]
    return ok(data, 'ok')
  })
]
