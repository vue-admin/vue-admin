enum StorageType {
  l = 'localStorage',
  s = 'sessionStorage'
}

class MyStorage {
  storage: Storage

  constructor(type: StorageType) {
    this.storage =
      type === StorageType.l ? window.localStorage : window.sessionStorage
  }

  set(key: string, value: unknown) {
    const data = JSON.stringify(value)
    this.storage.setItem(key, data)
  }

  // 返回 unknown 强制调用方做类型 narrowing；具体类型由调用方断言
  get(key: string): unknown {
    const value = this.storage.getItem(key)
    if (value) {
      return JSON.parse(value)
    }
    return null
  }

  delete(key: string) {
    this.storage.removeItem(key)
  }

  clear() {
    this.storage.clear()
  }
}

const LStorage = new MyStorage(StorageType.l)
const SStorage = new MyStorage(StorageType.s)

export { LStorage, SStorage }
