/**
 * dsh-usage-plugin — 本地持久化的写入 / 读取原语（无业务语义）。
 *
 * 用量历史是这个插件的唯一资产，而它此前有一处很危险的行为：
 * 直接 `writeFile` 覆盖 + 读取时把解析失败静默 catch 成"空数组"。
 * 一次进程崩溃或一次半截写入，就可能让整份历史被当成空数据再被覆盖回去。
 * 这里把两件事分开：
 *   - 写：临时文件 → 刷盘 → 原子 rename，失败时原文件纹丝不动。
 *   - 读：文件不存在才是空；解析失败必须抛错，由调用方决定如何处置（保留原件并报错）。
 *
 * @module dsh-usage-plugin/storage
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * 原子写入文本：同目录临时文件写完并 fsync 后 rename 覆盖目标。
 *
 * 任一环节失败都会在 finally 里清掉临时文件，并且**不触碰目标文件**——调用方
 * 因此可以安全地把"写入失败"当作可重试事件，而不是数据销毁事件。
 *
 * @param file - 目标文件绝对路径（父目录会自动创建）。
 * @param text - 要写入的完整文本。
 */
export async function atomicWriteText(file, text) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const temporary = file + '.' + randomUUID() + '.tmp'
  let handle
  try {
    handle = await fs.open(temporary, 'wx')
    await handle.writeFile(text, 'utf8')
    await handle.sync()
    await handle.close()
    handle = null
    await fs.rename(temporary, file)
  } finally {
    if (handle) await handle.close().catch(() => {})
    await fs.unlink(temporary).catch(() => {})
  }
}

/**
 * 读取用量记录数组。
 *
 * 只有"文件确实不存在"才返回空数组。解析失败、类型不对、读取被拒绝一律抛出——
 * 静默退化成空数组会让下一次写入把真实历史覆盖掉。
 *
 * @param file - 用量数据文件绝对路径。
 * @returns 记录数组（未归一化，由调用方 `normalizeRecord`）。
 * @throws 文件存在但不可读 / 不是合法 JSON / 顶层不是数组。
 */
export async function readStoredRecords(file) {
  let text
  try {
    text = await fs.readFile(file, 'utf8')
  } catch (error) {
    if (error && error.code === 'ENOENT') return []
    throw error
  }
  if (text.trim() === '') return []
  const records = JSON.parse(text)
  if (!Array.isArray(records)) throw new Error('用量数据文件的顶层必须是数组')
  return records
}
