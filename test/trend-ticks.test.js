import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 回归用例（采纳自 PR #18，@vb2250158）：趋势图 X 轴按固定步长取日期时，
// 窄面板下最后两个日期会重叠。现在按实测文字宽度贪心排布，且首尾日期优先。

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
let mounts = 0

async function loadCharts() {
  const storage = { _d: Object.create(null), getItem: () => null, setItem() {} }
  globalThis.window = { __ModuleLoader__: null, localStorage: storage }
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'zh-CN' }, configurable: true, writable: true })
  let captured = null
  window.__ModuleLoader__ = { load(d) { captured = d } }
  await import(pathToFileURL(CLIENT).href + '?ticks=' + (++mounts))
  const exports = captured.factory((name) => {
    if (name === 'react') return { createElement: () => null }
    throw new Error('unexpected require: ' + name)
  })
  return exports.__charts
}

// 生成以 2026-10-07 结尾、长度为 n 的连续日期序列
function series(n) {
  const end = Date.UTC(2026, 9, 7)
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end - i * 86400000)
    out.push({ key: d.toISOString().slice(0, 10), peak: 0, off: 0 })
  }
  return out
}

function layout(charts, len, width, charW) {
  const gap = Math.max(1, Math.min(14, (width - 88) / len - 2)) + 2
  const bw = gap - 2
  const x0 = 40
  return charts.trendDateTicks(series(len), x0, gap, bw, 40, width - 40, (t) => String(t).length * (charW || 7))
}

function assertSeparated(ticks, width) {
  for (const t of ticks) {
    assert.ok(t.left >= 40 - 0.001, 'tick must stay inside the plot: ' + t.text)
    assert.ok(t.right <= width - 40 + 0.001, 'tick must stay inside the plot: ' + t.text)
  }
  for (let i = 1; i < ticks.length; i++) {
    const gapPx = ticks[i].left - ticks[i - 1].right
    assert.ok(gapPx >= 8 - 0.001, 'ticks overlap (' + gapPx.toFixed(1) + 'px): ' + ticks[i - 1].text + ' / ' + ticks[i].text)
  }
}

test('30-day narrow chart keeps the endpoint dates apart', async () => {
  const charts = await loadCharts()
  const ticks = layout(charts, 30, 360)
  assert.equal(ticks[0].text, '9/8')
  assert.equal(ticks[ticks.length - 1].text, '10/7')
  assert.equal(ticks.some((t) => t.text === '10/6'), false)
  assertSeparated(ticks, 360)
})

test('every length/width/font combination stays separated', async () => {
  const charts = await loadCharts()
  for (const len of [7, 30, 90]) {
    for (const width of [120, 216, 360, 560, 880]) {
      for (const charW of [5, 7, 10]) {
        assertSeparated(layout(charts, len, width, charW), width)
      }
    }
  }
})

test('single and empty series degrade gracefully', async () => {
  const charts = await loadCharts()
  assert.equal(charts.trendDateTicks([], 40, 12, 10, 40, 320, () => 20).length, 0)
  assert.equal(charts.trendDateTicks(series(1), 40, 12, 10, 40, 320, () => 20).length, 1)
})
