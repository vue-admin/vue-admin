import { describe, it, expect, vi } from 'vitest'
import { createConfirmService } from '@/lib/confirm/confirmService'

describe('confirmService', () => {
  it('确认时返回 true', async () => {
    const messageBox = { confirm: vi.fn().mockResolvedValue(undefined) }
    const service = createConfirmService(messageBox)

    const result = await service.showConfirm('确认删除？')

    expect(result).toBe(true)
    expect(messageBox.confirm).toHaveBeenCalledWith(
      '确认删除？',
      '提示',
      expect.objectContaining({
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
    )
  })

  it('取消或关闭时返回 false', async () => {
    const messageBox = { confirm: vi.fn().mockRejectedValue(undefined) }
    const service = createConfirmService(messageBox)

    const result = await service.showConfirm('确认删除？')

    expect(result).toBe(false)
  })

  it('自定义 title 和 options 覆盖默认值', async () => {
    const messageBox = { confirm: vi.fn().mockRejectedValue(undefined) }
    const service = createConfirmService(messageBox)

    await service.showConfirm('保存？', '保存确认', { type: 'info' })

    expect(messageBox.confirm).toHaveBeenCalledWith(
      '保存？',
      '保存确认',
      expect.objectContaining({
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      })
    )
  })

  it('自定义 defaults 覆盖应用默认值', async () => {
    const messageBox = { confirm: vi.fn().mockResolvedValue(undefined) }
    const service = createConfirmService(messageBox, {
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      type: 'info',
    })

    await service.showConfirm('确认？')

    expect(messageBox.confirm).toHaveBeenCalledWith(
      '确认？',
      '提示',
      expect.objectContaining({
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        type: 'info',
      })
    )
  })
})
