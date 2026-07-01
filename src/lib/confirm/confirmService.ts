import { ElMessageBox } from 'element-plus'
import type { ElMessageBoxOptions } from 'element-plus'

export interface ConfirmDefaults {
  confirmButtonText?: string
  cancelButtonText?: string
  type?: 'success' | 'warning' | 'info' | 'error'
}

export interface ConfirmService {
  showConfirm(
    message: string,
    title?: string,
    options?: Omit<Partial<ElMessageBoxOptions>, 'message' | 'title'>
  ): Promise<boolean>
}

export function createConfirmService(
  messageBox: Pick<typeof ElMessageBox, 'confirm'> = ElMessageBox,
  defaults: ConfirmDefaults = {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }
): ConfirmService {
  const showConfirm = async (
    message: string,
    title = '提示',
    options?: Omit<Partial<ElMessageBoxOptions>, 'message' | 'title'>
  ): Promise<boolean> => {
    try {
      await messageBox.confirm(message, title, {
        confirmButtonText: defaults.confirmButtonText,
        cancelButtonText: defaults.cancelButtonText,
        type: defaults.type,
        ...options
      })
      return true
    } catch {
      return false
    }
  }

  return { showConfirm }
}

export const confirmService = createConfirmService()
