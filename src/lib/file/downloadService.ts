// 文件下载服务。无 Vue 依赖。
// 提供 Blob / URL / Stream 三种下载方式，统一处理文件名提取和浏览器兼容。

interface DownloadResult {
  filename: string
  size: number
}

// 从 Content-Disposition 头中提取 filename。支持 filename*=UTF-8'' 和 filename= 两种形式。
function parseFilenameFromHeader(
  disposition: string | null | undefined
): string | null {
  if (!disposition) return null
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/["']/g, ''))
    } catch {
      return utf8Match[1].trim().replace(/["']/g, '')
    }
  }
  const plainMatch = /filename="?([^";]+)"?/i.exec(disposition)
  return plainMatch?.[1]?.trim() || null
}

// 触发浏览器下载。创建临时 <a> 标签并 click。
// 通过 nextTick 回收：浏览器在事件循环下一轮才会真正发起读取，
// 此时移除 <a> 标签已不影响下载；相比固定 setTimeout 更快释放内存。
function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 下载 Blob 数据。filename 必填，避免浏览器忽略扩展名。
// 回收策略：使用 setTimeout 兜底 + 页面隐藏时立即清理（visibilitychange），
// 避免快速点击累积 blob URL 占用内存。
export function downloadBlob(blob: Blob, filename: string): DownloadResult {
  const url = URL.createObjectURL(blob)
  let revoked = false
  const revoke = () => {
    if (revoked) return
    revoked = true
    URL.revokeObjectURL(url)
    document.removeEventListener('visibilitychange', onVisibility)
  }
  const onVisibility = () => {
    if (document.hidden) revoke()
  }
  document.addEventListener('visibilitychange', onVisibility)
  try {
    triggerDownload(url, filename)
    return { filename, size: blob.size }
  } finally {
    // 兜底：1 秒后强制回收（浏览器在 1 秒内必已读完 blob）
    setTimeout(revoke, 1000)
  }
}

// 下载已有 URL（GET）。优先用 fetch 拿到 blob 以从 Content-Disposition 提取真实文件名。
export async function downloadUrl(
  url: string,
  fallbackFilename: string,
  init?: RequestInit
): Promise<DownloadResult> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`)
  }
  const filename =
    parseFilenameFromHeader(res.headers.get('Content-Disposition')) ||
    fallbackFilename
  const blob = await res.blob()
  return downloadBlob(blob, filename)
}

// 下载 ReadableStream（如大文件流式下载）。
export async function downloadStream(
  stream: ReadableStream<Uint8Array>,
  filename: string
): Promise<DownloadResult> {
  const chunks: BlobPart[] = []
  const reader = stream.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value as BlobPart)
    }
  }
  const blob = new Blob(chunks)
  return downloadBlob(blob, filename)
}

// 下载 CSV 文本。前置 BOM（\uFEFF）确保 Excel 正确识别 UTF-8，避免中文乱码。
export function downloadCsv(text: string, filename: string): DownloadResult {
  return downloadBlob(
    new Blob(['\uFEFF', text], { type: 'text/csv;charset=utf-8;' }),
    filename
  )
}
