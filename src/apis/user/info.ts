import service from '@/apis/client/service'

export interface MenusRequest {
  userId: string
}

export interface menuItemData {
  name: string
  path: string
  component?: string
  meta?: Map<string, string> | undefined
  children?: menuItemData[]
}

export const fetchMenus = (req: MenusRequest) => {
  return service.get<menuItemData[]>('/api/system/menus', req, {
    silent: false
  })
}
