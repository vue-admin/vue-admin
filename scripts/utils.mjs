import { access } from 'node:fs/promises'
import { dirname as pathDirname, join as pathJoin } from 'node:path'

export function dirname(path) {
  return pathDirname(path)
}

export function join(...paths) {
  return pathJoin(...paths)
}

export async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
