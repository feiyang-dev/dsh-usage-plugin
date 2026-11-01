import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { defaultPricing } from '../lib/index.js'

// 渲染冒烟测试：用最小 React 替身把视图组件的返回树真正走一遍，
// 用来兜住"语法没错、渲染时才 ReferenceError/TypeError"的情况
// （纯逻辑测试只加载模块，不会执行组件函数体）。

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
let mounts = 0

const miniReact = {
  createElement(type, props) {
    return { type, props: props || {}, children: Array.prototype.slice.call(arguments, 2) }
  },
  useState(initial) { return [initial, function () {}] },
  useEffect() {},
  useLayoutEffect() {},
  useRef() { return { current: null } },
  useMemo(fn) { return fn() },
  useCallback(fn) { return fn },
  Fragment: 'Fragment'
}

async function loadClient() {
  const storage = { _d: Object.create(null), getItem(k) { return k in this._d ? this._d[k] : null }, setItem(k, v) { this._d[k] = String(v) } }
  globalThis.window = { __ModuleLoader__: null, localStorage: storage }
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'zh-CN' }, configurable: true, writable: true })
  let captured = null
  window.__ModuleLoader__ = { load(d) { captured = d } }
  await import(pathToFileURL(CLIENT).href + '?render=' + (++mounts))
  return captured.factory((name) => {
    if (name === 'react') return miniReact
    throw new Error('unexpected require: ' + name)
  })
}

// 把返回树展开成扁平文本，顺便触发所有函数组件（子组件的 props 会被真实求值）
function flatten(node, out, depth) {
  if (depth > 40) return
  if (node == null || node === false || node === true) return
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return }
  if (Array.isArray(node)) { for (const item of node) flatten(item, out, depth + 1); return }
  if (typeof node === 'function') { flatten(node({}), out, depth + 1); return }
  if (typeof node !== 'object') return
  if (typeof node.type === 'function') {
    flatten(node.type(Object.assign({}, node.props, { children: node.children })), out, depth + 1)
    return
  }
  for (const child of node.children || []) flatten(child, out, depth + 1)
}

function sampleRecord(over) {
  const base = {
    time: Date.parse('2026-11-01T02:00:00Z'),
    pricingTime: Date.parse('2026-11-01T02:00:00Z'),
    model: 'deepseek-flash',
    provider: 'deepseek-account',
    purpose: '',
    sessionId: 's1',
    origin: 'probe',
    estimated: false,
    recordId: 'r1',
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadTokens: 20000,
    cacheWriteTokens: 0,
    reasoningTokens: 120,
    finishReason: 'stop',
    interrupted: false,
    usdCnyRate: 0,
    fxDate: '',
    modelKey: 'deepseek-flash',
    baseCost: 0.01,
    peakValleyCost: 0.02,
    autoCost: 0.02,
    peak: true
  }
  return Object.assign(base, over || {})
}

function sampleDays() {
  return [{
    day: '2026-11-01', calls: 3, miss: 1000, hit: 20000, write: 0, out: 500, reason: 120,
    peakCalls: 2, offPeakCalls: 1, baseCost: 0.01, peakValleyCost: 0.02, autoCost: 0.02,
    basePeakCost: 0, baseOffPeakCost: 0, pvPeakCost: 0, pvOffPeakCost: 0,
    autoPeakCost: 0.02, autoOffPeakCost: 0
  }]
}

test('overview view renders without throwing', async () => {
  const { __views } = await loadClient()
  const out = []
  flatten(__views.OverviewView({
    records: [sampleRecord(), sampleRecord({ recordId: 'r2', provider: 'siliconflow', model: 'deepseek-ai/deepseek-v4-flash', peak: false })],
    regime: 'auto',
    toolCalls: [{ provider: 'dsh2shell-x', model: 'fake', autoCost: 0 }],
    days: sampleDays(),
    budget: { monthly: 50 },
    legacyPricingCount: 2
  }), out, 0)
  const text = out.join(' ')
  assert.match(text, /总消耗/)
  assert.match(text, /调用次数/)
  assert.match(text, /统计口径提示/)
  // 明细表格已移到「明细」页签，概览只保留趋势与结论
  assert.match(text, /消耗趋势/)
})

test('breakdown view renders both model and provider tables', async () => {
  const { __views } = await loadClient()
  const out = []
  flatten(__views.BreakdownView({
    records: [
      sampleRecord(),
      sampleRecord({ recordId: 'r2', provider: 'digitalocean', model: 'deepseek-v4-flash', peak: false, usdCnyRate: 7.1 })
    ],
    regime: 'auto'
  }), out, 0)
  const text = out.join(' ')
  // 默认按模型：出现模型名与合计行
  assert.match(text, /deepseek-flash/)
  assert.match(text, /合计/)
})

test('price view renders without throwing', async () => {
  const { __views } = await loadClient()
  const out = []
  flatten(__views.PriceView({
    pricing: defaultPricing(),
    effectiveAt: Date.parse('2026-08-17T00:00:00+08:00'),
    effectiveV41At: Date.parse('2026-09-10T12:00:00+08:00'),
    fx: { rate: 7.1, inverse: 1 / 7.1, date: '2026-10-31', source: 'Frankfurter', stale: false, error: '' },
    budget: null,
    legacyPricingCount: 0,
    pricingHistory: [{ at: Date.parse('2026-10-01T00:00:00Z'), kind: 'edit', label: '手工修改价格表', table: defaultPricing() }],
    pricingMeta: {
      sourceUrl: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing/',
      checkedAt: '2026-11-01',
      searchFetch: { pricePer1000: 5, effectiveAt: 0, counted: false },
      holidayRuleAt: Date.parse('2026-11-01T00:00:00+08:00'),
      holidays: []
    },
    onBudgetChange() {},
    onFxRefresh() {},
    onRepriceAll() {},
    onChanged() {}
  }), out, 0)
  const text = out.join(' ')
  assert.match(text, /价格来源与快照/)
  assert.match(text, /月度预算/)
  assert.match(text, /价格口径与第三方价格/)
})

test('calendar view renders without throwing', async () => {
  const { __views } = await loadClient()
  const out = []
  flatten(__views.CalendarView({
    records: [sampleRecord()],
    regime: 'auto',
    days: sampleDays()
  }), out, 0)
  const text = out.join(' ')
  assert.match(text, /本月调用|范围内调用/)
})

test('cache list view renders without throwing', async () => {
  const { __views } = await loadClient()
  const out = []
  flatten(__views.CacheListView({ records: [sampleRecord()], regime: 'auto' }), out, 0)
  assert.ok(out.length > 0)
})

// 回归：undici v7 的 request() 不再接受 maxRedirections，传了会直接抛
// "maxRedirections is not supported, use the redirect interceptor"，
// 导致余额查询、汇率刷新整体失败（1.22.0 线上回归）。
test('host code never passes maxRedirections to undici request()', async () => {
  const fsmod = await import('node:fs')
  const hostPath = path.join(here, '..', 'lib', 'index.js')
  const src = fsmod.readFileSync(hostPath, 'utf8')
  // 只查"作为请求选项传入"（`maxRedirections:`），注释里提到它不算
  assert.equal(/maxRedirections\s*:/.test(src), false, 'lib/index.js must not pass maxRedirections to undici')
})
