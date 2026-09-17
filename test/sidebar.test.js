import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
let mounts = 0
let ELEMENTS = []

async function loadClient(opts) {
  const o = opts || {}
  ELEMENTS = []
  const fakeReact = {
    createElement: (type, props, ...kids) => { const n = { type, props, kids }; ELEMENTS.push(n); return n },
    useEffect: (fn) => { if (o.runEffects) fn() },
    useRef: () => ({ current: null }),
    useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
    Fragment: 'frag'
  }
  globalThis.window = { __ModuleLoader__: null, localStorage: o.storage || { _d: Object.create(null), getItem(k) { return this._d[k] ?? null }, setItem(k, v) { this._d[k] = String(v) }, removeItem(k) { delete this._d[k] } } }
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true, writable: true })
  globalThis.fetch = o.fetch || (() => Promise.resolve({ json: () => Promise.resolve({ ok: true, records: [] }) }))
  let captured = null
  window.__ModuleLoader__ = { load(d) { captured = d } }
  const url = pathToFileURL(CLIENT).href + '?mount=' + (++mounts) + '&t=' + Date.now()
  await import(url)
  return captured.factory((n) => {
    if (n === 'react') return fakeReact
    if (n === 'react-dom') throw new Error('no react-dom')
    throw new Error('unexpected require: ' + n)
  })
}

function makeCtx(opts) {
  const o = opts || {}
  const registered = []
  const state = { current: o.session === undefined ? 'session-A' : o.session }
  const ctx = {
    get(name) {
      if (name === 'slots') return {
        inject(slot, fn) { fn() },
        register(reg, comp) { registered.push({ slot: reg.name, id: reg.id, order: reg.order, component: comp }); return () => {} },
        subscribe: () => () => {}, entries: () => []
      }
      if (name === 'sessions') return { list: { getSnapshot: () => ({ current: state.current }) } }
      if (name === 'timer') return { interval: () => () => {} }
      return undefined
    },
    effect(fn) { fn(); return () => {} },
    on() {},
    logger: { warn() {}, info() {} }
  }
  return { ctx, registered }
}

test('registers the sidebar entry with its own id, labelled 余额', async () => {
  const exports = await loadClient()
  const h = makeCtx()
  exports.apply(h.ctx)
  const side = h.registered.find((r) => r.slot === 'sidebar.footer.action')
  assert.ok(side)
  assert.equal(side.id, 'usage-cost-side')
  assert.notEqual(side.id, 'cordis-panel', '不得复用内置 id')
})

test('balanceDisplayOf formats money for currency providers', async () => {
  const exports = await loadClient()
  // 后端 totalBalance 已是格式化字符串
  const v = exports.balanceDisplayOf('deepseek', { ok: true, provider: 'deepseek', providerName: 'DeepSeek', totalBalance: '288.73', currency: 'CNY' })
  assert.equal(v.amount, '¥288.73')
  assert.equal(v.provider.name, 'DeepSeek')
  const usd = exports.balanceDisplayOf('digitalocean', { ok: true, providerName: 'DigitalOcean', totalBalance: '12.50', currency: 'USD' })
  assert.equal(usd.amount, '$12.50')
  // 后端已带符号时不得重复加符号
  const signed = exports.balanceDisplayOf('deepseek', { ok: true, providerName: 'DeepSeek', totalBalance: '¥288.73', currency: 'CNY' })
  assert.equal(signed.amount, '¥288.73')
  // 缺 totalBalance 时回退到 balance
  const fallback = exports.balanceDisplayOf('deepseek', { ok: true, providerName: 'DeepSeek', balance: '5.00', currency: 'CNY' })
  assert.equal(fallback.amount, '¥5.00')
})

test('balanceDisplayOf shows the quota percent string for the token-plan provider', async () => {
  const exports = await loadClient()
  // balance.js 产出的 usedPercent 是形如 "39.7%" 的字符串
  const v = exports.balanceDisplayOf('qwen-token-plan', { ok: true, providerName: '百炼 Token Plan', usedPercent: '39.7%' })
  assert.equal(v.amount, '39.7%')
  // 数字也接受
  assert.equal(exports.balanceDisplayOf('qwen-token-plan', { ok: true, usedPercent: 37.4 }).amount, '37.4%')
  assert.equal(exports.balanceDisplayOf('qwen-token-plan', { ok: true }), null, '没有配额字段时应返回 null')
})

test('balanceDisplayOf returns null when no amount is available', async () => {
  const exports = await loadClient()
  assert.equal(exports.balanceDisplayOf('deepseek', { ok: true }), null)
  assert.equal(exports.balanceDisplayOf('deepseek', { ok: true, totalBalance: '' }), null)
})

test('probeFirstBalance picks the FIRST provider that returns a balance', async () => {
  // 探测直接查余额，用结果判定可用性（不再依赖 balanceCredentialStatus：
  // 它对 DeepSeek 这类服务商返回 ok:false，会把 DeepSeek 误跳过）。
  const asked = []
  const fetchImpl = (url, init) => {
    const body = JSON.parse(init.body)
    asked.push(body.provider)
    if (body.provider === 'siliconflow') return Promise.resolve({ json: () => Promise.resolve({ ok: false, errorCode: 'missing-credential' }) })
    if (body.provider === 'digitalocean') return Promise.resolve({ json: () => Promise.resolve({ ok: true, providerName: 'DigitalOcean', totalBalance: '7.50', currency: 'USD' }) })
    return Promise.resolve({ json: () => Promise.resolve({ ok: true, providerName: 'DeepSeek', totalBalance: '288.73', currency: 'CNY' }) })
  }
  const exports = await loadClient({ fetch: fetchImpl })
  const hit = await exports.probeFirstBalance(['deepseek', 'siliconflow', 'digitalocean'])
  assert.equal(hit.provider.id, 'deepseek', '第一个查得到的即命中')
  assert.equal(hit.amount, '¥288.73')
  assert.deepEqual(asked, ['deepseek'], '命中后不应继续查询后面的服务商')
})

test('probeFirstBalance skips providers whose balance query fails', async () => {
  const asked = []
  const fetchImpl = (url, init) => {
    const body = JSON.parse(init.body)
    asked.push(body.provider)
    if (body.provider === 'deepseek') return Promise.resolve({ json: () => Promise.resolve({ ok: false, errorCode: 'missing-credential' }) })
    return Promise.resolve({ json: () => Promise.resolve({ ok: true, providerName: 'SiliconFlow', totalBalance: '3.00', currency: 'CNY' }) })
  }
  const exports = await loadClient({ fetch: fetchImpl })
  const hit = await exports.probeFirstBalance(['deepseek', 'siliconflow'])
  assert.equal(hit.provider.id, 'siliconflow', '失败的要跳过，取下一个')
  assert.deepEqual(asked, ['deepseek', 'siliconflow'])
})

test('probeFirstBalance returns null when every provider fails', async () => {
  const fetchImpl = () => Promise.resolve({ json: () => Promise.resolve({ ok: false, errorCode: 'missing-credential' }) })
  const exports = await loadClient({ fetch: fetchImpl })
  assert.equal(await exports.probeFirstBalance(['deepseek', 'siliconflow']), null)
})


test('openBalanceView uses the captured openView handle to switch the session', async () => {
  const storage = { _d: Object.create(null), getItem(k) { return this._d[k] ?? null }, setItem(k, v) { this._d[k] = String(v) }, removeItem(k) { delete this._d[k] } }
  const exports = await loadClient({ storage })
  const h = makeCtx()
  exports.apply(h.ctx)
  // 宿主渲染 conversation.view 时注入 openView —— 触发捕获
  const view = h.registered.find((r) => r.slot === 'conversation.view')
  const opened = []
  view.component({ openView: (v, focus) => opened.push([v, focus]) })
  // 现在点击侧边栏
  const ok = exports.openBalanceView('session-A')
  assert.equal(ok, true, '有句柄时应即时切换')
  assert.deepEqual(opened, [['balance-view', 'usage-plugin:open-balance']])
  // 同时要落持久化偏好，保证下次进入该会话直接在余额页
  assert.equal(JSON.parse(storage.getItem('dsh.conversation.session-A')).view, 'balance-view')
})

test('openBalanceView ignores a handle captured for another session', async () => {
  const storage = { _d: Object.create(null), getItem(k) { return this._d[k] ?? null }, setItem(k, v) { this._d[k] = String(v) }, removeItem(k) { delete this._d[k] } }
  const exports = await loadClient({ storage })
  const h = makeCtx({ session: 'session-A' })
  exports.apply(h.ctx)
  const view = h.registered.find((r) => r.slot === 'conversation.view')
  const opened = []
  view.component({ openView: (v) => opened.push(v) })   // 句柄属于 session-A
  const ok = exports.openBalanceView('session-B')      // 却想切 session-B
  assert.equal(ok, false, '不应把别的会话切走')
  assert.deepEqual(opened, [])
  // 但偏好仍要写入目标会话
  assert.equal(JSON.parse(storage.getItem('dsh.conversation.session-B')).view, 'balance-view')
})

test('openBalanceView falls back to persisting the preference when no handle exists', async () => {
  const storage = { _d: Object.create(null), getItem(k) { return this._d[k] ?? null }, setItem(k, v) { this._d[k] = String(v) }, removeItem(k) { delete this._d[k] } }
  const exports = await loadClient({ storage })
  const h = makeCtx()
  exports.apply(h.ctx)
  // 未渲染任何 conversation.view => 没有 openView 句柄，应退化为写偏好
  const ok = exports.openBalanceView('session-A')
  assert.equal(ok, false, '没有句柄时应返回 false')
  const stored = JSON.parse(storage.getItem('dsh.conversation.session-A'))
  assert.equal(stored.view, 'balance-view', '应把偏好写成余额视图')
})

test('the entry label is the fixed 余额 text, not the provider name', async () => {
  const exports = await loadClient()
  // 测试环境为英文，t("余额") 解析为 "Balance"；关键是"固定文案"而非服务商名。
  ELEMENTS.length = 0
  exports.SidebarUsageEntry({ wide: true })
  const texts = ELEMENTS.map((e) => (e.kids || []).filter((k) => typeof k === 'string')).flat()
  assert.deepEqual(texts, ['Balance'], '标签应固定为「余额」，实际: ' + JSON.stringify(texts))
  const btn = ELEMENTS.find((e) => e.props && e.props.className === 'dsh-usage-sideBtn')
  assert.ok(btn, '应有按钮')
  assert.ok(String(btn.props.title).includes('Balance'), '悬停提示应包含余额文案')
})

test('the entry switches views on double click, not on single click', async () => {
  const exports = await loadClient()
  const calls = []
  ELEMENTS.length = 0
  exports.SidebarUsageEntry({ wide: true, openBalanceView: () => calls.push('called') })
  const btn = ELEMENTS.find((e) => e.props && e.props.className === 'dsh-usage-sideBtn')
  assert.equal(btn.props.onClick, undefined, '不应再绑定单击（避免误触切走视图）')
  assert.equal(typeof btn.props.onDoubleClick, 'function', '应绑定双击')
  btn.props.onDoubleClick()
  assert.deepEqual(calls, ['called'])
})

test('double click is safe when the host provides no navigation callback', async () => {
  const exports = await loadClient()
  ELEMENTS.length = 0
  exports.SidebarUsageEntry({ wide: true })
  const btn = ELEMENTS.find((e) => e.props && e.props.className === 'dsh-usage-sideBtn')
  assert.doesNotThrow(() => btn.props.onDoubleClick())
})

test('sidebar provider preference defaults to auto and rejects unknown values', async () => {
  const storage = { _d: Object.create(null), getItem(k) { return this._d[k] ?? null }, setItem(k, v) { this._d[k] = String(v) }, removeItem(k) { delete this._d[k] } }
  const exports = await loadClient({ storage })
  assert.equal(exports.readSidebarProviderPref(), 'auto', '默认应为自动')
  assert.equal(exports.writeSidebarProviderPref('siliconflow'), 'siliconflow')
  assert.equal(exports.readSidebarProviderPref(), 'siliconflow', '应可读回')
  assert.equal(exports.writeSidebarProviderPref('not-a-provider'), 'auto', '未知值应回落到自动')
  assert.equal(exports.readSidebarProviderPref(), 'auto')
})

test('changing the preference notifies subscribers so the entry refreshes', async () => {
  const exports = await loadClient()
  const seen = []
  const unsub = exports.subscribeSidebarProviderPref((v) => seen.push(v))
  exports.writeSidebarProviderPref('digitalocean')
  exports.writeSidebarProviderPref('auto')
  unsub()
  exports.writeSidebarProviderPref('deepseek')
  assert.deepEqual(seen, ['digitalocean', 'auto'], '退订后不应再收到通知')
})

test('a fixed preference queries only that provider', async () => {
  const asked = []
  const fetchImpl = (url, init) => {
    const body = JSON.parse(init.body)
    asked.push(body.provider)
    return Promise.resolve({ json: () => Promise.resolve({ ok: true, providerName: body.provider, totalBalance: '1.00', currency: 'CNY' }) })
  }
  const exports = await loadClient({ fetch: fetchImpl })
  exports.writeSidebarProviderPref('digitalocean')
  const hit = await exports.probeFirstBalance([exports.readSidebarProviderPref()])
  assert.equal(hit.provider.id, 'digitalocean')
  assert.deepEqual(asked, ['digitalocean'], '固定选择时只查该服务商')
})
