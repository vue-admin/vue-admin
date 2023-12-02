import { reactive } from 'vue'
import { RouteRecordRaw } from 'vue-router'
import { fetchMenus, menuItemData } from '@/apis/user/info'

const components = import.meta.glob('@/views/**/*.vue')

const ruleForm = reactive({
  userId: ''
})

export var generateRoute = (item: menuItemData) => {
  let menu = {
    path: item.path,
    name: item.name,
    component: loadView(item.component),
    meta: item.meta,
    children: []
  } as RouteRecordRaw
  if (item.children && item.children.length > 0) {
    item.children.forEach((item1) => {
      menu.children?.push(generateRoute(item1))
    })
  }
  return menu
}

export const loadView = (view: string | undefined) => {
  if (view === undefined) return null
  try {
    return components[`/src/views/${view}.vue`]
  } catch (err) {
    return null
  }
}

const { data } = await fetchMenus(ruleForm)
let menus: RouteRecordRaw[] = []
data.forEach((item) => {
  menus.push(generateRoute(item))
})

export default menus
