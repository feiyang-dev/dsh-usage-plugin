import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 回归用例：用量日历把每月 1 号画在了错误的星期列上（整体左移一格）。
// 原因是 monthOffset 用 bjStartMs() 取"北京零点"对应的**时刻**、再 getUTCDay() 读星期：
// 那个时刻在 UTC 上是前一天 16:00，读出来的是前一天的星期。
// 星期几属于日历日期，必须直接用 UTC 日期算，不做时区平移。

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
let mounts = 0

const fakeRequire = (n) => {
  if (n === 'react') return { createElement: () => null }
  throw new Error('unexpected require: ' + n)
}

async function loadClient() {
  const storage = { _d: Object.create(null), getItem(k) { return k in this._d ? this._d[k] : null }, setItem(k, v) { this._d[k] = String(v) } }
  globalThis.window = { __ModuleLoader__: null, localStorage: storage }
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'zh-CN' }, configurable: true, writable: true })
  let captured = null
  window.__ModuleLoader__ = { load(d) { captured = d } }
  await import(pathToFileURL(CLIENT).href + '?calendar=' + (++mounts))
  const exports = captured.factory(fakeRequire)
  return exports.__i18n
}

test('the 1st of a month lands in the weekday column of its Beijing date', async () => {
  const i = await loadClient()
  // 2026-11-01 是周日 → 周一起始的日历里占最后一格（下标 6）
  assert.equal(i.monthOffset(2026, 10), 6)
  // 2026-10-01 是周四 → 下标 3
  assert.equal(i.monthOffset(2026, 9), 3)
  // 2026-01-01 是周四
  assert.equal(i.monthOffset(2026, 0), 3)
})

test('every day of every 2026 month maps to its real weekday column', async () => {
  const i = await loadClient()
  for (let m = 0; m < 12; m++) {
    const offset = i.monthOffset(2026, m)
    const n = i.monthDays(2026, m)
    for (let d = 1; d <= n; d++) {
      const col = (offset + d - 1) % 7
      const real = (new Date(Date.UTC(2026, m, d)).getUTCDay() + 6) % 7
      assert.equal(col, real, '2026-' + (m + 1) + '-' + d + ' column')
    }
  }
})

test('February length follows the leap-year rule', async () => {
  const i = await loadClient()
  assert.equal(i.monthDays(2026, 1), 28)
  assert.equal(i.monthDays(2028, 1), 29)
})
