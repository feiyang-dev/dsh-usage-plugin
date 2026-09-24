import test from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { atomicWriteText, readStoredRecords } from '../lib/storage.js'

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'dsh-usage-storage-'))
}

test('readStoredRecords returns an empty array only for a missing file', async () => {
  const dir = await tempDir()
  assert.deepEqual(await readStoredRecords(path.join(dir, 'usage-records.json')), [])
})

// 这是本次修复的核心之一：损坏的文件以前会被静默当成空数组，然后被空数据覆盖，
// 整份历史就此消失。现在必须抛错，由调用方保留原件。
test('readStoredRecords throws on a corrupt file instead of pretending it is empty', async () => {
  const dir = await tempDir()
  const file = path.join(dir, 'usage-records.json')
  await fs.writeFile(file, '{ this is not json', 'utf8')
  await assert.rejects(() => readStoredRecords(file))
})

test('readStoredRecords rejects a non-array top level', async () => {
  const dir = await tempDir()
  const file = path.join(dir, 'usage-records.json')
  await fs.writeFile(file, '{"records":[]}', 'utf8')
  await assert.rejects(() => readStoredRecords(file))
})

test('readStoredRecords treats an empty file as no data', async () => {
  const dir = await tempDir()
  const file = path.join(dir, 'usage-records.json')
  await fs.writeFile(file, '', 'utf8')
  assert.deepEqual(await readStoredRecords(file), [])
})

test('atomicWriteText creates the parent directory and replaces the target', async () => {
  const dir = await tempDir()
  const file = path.join(dir, 'nested', 'deeper', 'usage-records.json')
  await atomicWriteText(file, '[1]')
  await atomicWriteText(file, '[1,2]')
  assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), [1, 2])
})

test('atomicWriteText leaves no temporary files behind', async () => {
  const dir = await tempDir()
  const file = path.join(dir, 'usage-records.json')
  await atomicWriteText(file, '[1]')
  await atomicWriteText(file, '[2]')
  assert.deepEqual(await fs.readdir(dir), ['usage-records.json'])
})

// 写入失败必须是"什么都没发生"，而不是"目标文件被截断"——这正是原子写的意义。
test('a failed atomic write leaves the existing file untouched', async () => {
  const dir = await tempDir()
  const blocker = path.join(dir, 'blocker')
  await fs.writeFile(blocker, 'keep-me', 'utf8')
  // 父级是一个普通文件 → mkdir 必然失败
  const target = path.join(blocker, 'usage-records.json')
  await assert.rejects(() => atomicWriteText(target, '[1]'))
  assert.equal(await fs.readFile(blocker, 'utf8'), 'keep-me')
})
