import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// 设计规范守卫：样式对象只允许引用令牌（C / FS / G），不再出现裸色值，
// 也不允许出现重复键（同名键后者覆盖前者，"改了却不生效"是这类问题最典型的表现）。

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
const src = fs.readFileSync(CLIENT, 'utf8')

function stBlock() {
  const start = src.indexOf('var st = {')
  assert.ok(start > 0, 'var st = { not found')
  const end = src.indexOf('\n    };', start)
  assert.ok(end > start, 'end of style object not found')
  return src.slice(start, end)
}

test('the shared style object declares no raw colors', () => {
  const block = stBlock()
  const hex = block.match(/#[0-9a-fA-F]{3,8}\b/g) || []
  assert.deepEqual(hex, [], 'style object must use C.* / G.* tokens instead of raw hex colors')
})

test('the shared style object has no duplicate keys', () => {
  const block = stBlock()
  const keys = [...block.matchAll(/^ {6}([A-Za-z0-9_]+):/gm)].map((m) => m[1])
  const seen = new Set()
  const dup = []
  for (const k of keys) {
    if (seen.has(k)) dup.push(k)
    seen.add(k)
  }
  assert.deepEqual(dup, [], 'duplicate style keys: ' + dup.join(', '))
})

test('every font size goes through the FS ladder', () => {
  // 允许 BASE_FS 这个基准值本身，但组件里不允许再写 fs(13) 之类的裸数字
  const numeric = [...src.matchAll(/fs\(([0-9.]+)\)/g)].map((m) => m[1])
  assert.deepEqual(numeric, [], 'use fs(FS.xs|sm|md|lg|xl|xxl|display) instead of fs(<number>)')
})

test('design tokens exist and stay in sync', () => {
  for (const marker of ['var C = {', 'var FS = {', 'var G = {']) {
    assert.ok(src.includes(marker), 'missing token block: ' + marker)
  }
  // 语义色只允许这四类语义 + 中性线条；新增颜色必须先进 C
  for (const key of ['ok', 'warn', 'danger', 'accent', 'accentText', 'line', 'lineStrong', 'fill']) {
    assert.match(src, new RegExp('\\b' + key + ':'), 'C.' + key + ' token missing')
  }
})
