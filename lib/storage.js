import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

/** 同目录临时文件写完并刷盘后替换，失败时保留原文件。 */
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

/** 只有文件确实不存在才返回空数组；解析或读取失败不得退化为空数据。 */
export async function readStoredRecords(file) {
  let text
  try { text = await fs.readFile(file, 'utf8') } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  const records = JSON.parse(text)
  if (!Array.isArray(records)) throw new Error('用量数据必须是数组')
  return records
}
