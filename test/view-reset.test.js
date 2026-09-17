import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * BUG 回归：点「用量」/「余额」后切走会话再切回，应回到对话界面。
 *
 * 关键：harness 的 per-session store（defineStore({ persist: "dsh.conversation" })）
 * 语义是「挂载时从 localStorage 读一次，之后每次变更写回」：
 *     const raw = localStorage.getItem(name); if (raw) store.setState(JSON.parse(raw));
 *     store.subscribe(next => localStorage.setItem(name, JSON.stringify(next)));
 * 渲染读的是**内存状态**，所以只改 localStorage 而不改内存是无效的
 * （store 下次变更还会把旧值写回）。上一版的单测正是漏了这一点才假绿。
 * 这里的断言因此聚焦"是否调用了 openView（改内存）"而不是只看存储。
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
let mounts = 0

function makeStorage(seed) {
  const data = Object.assign(Object.create(null), seed || {})
  return {
    getItem(k) { return k in data ? data[k] : null },
    setItem(k, v) { data[k] = String(v) },
    removeItem(k) { delete data[k] }
  }
}

/** 加载插件并把 conversation.view 注册项抓出来。 */
async function loadViews(storage, options) {
  const opts = options || {}
  globalThis.window = { __ModuleLoader__: null, localStorage: storage }
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true, writable: true })
  let captured = null
  window.__ModuleLoader__ = { load(d) { captured = d } }
  const url = pathToFileURL(CLIENT).href + '?mount=' + (++mounts)
  await import(url)
  const exports = captured.factory((n) => {
    if (n === 'react') return opts.react || { createElement: () => null, useEffect: () => {}, useRef: () => ({ current: null }) }
    throw new Error('unexpected require: ' + n)
  })
  const registered = []
  const ctx = {
    get(name) {
      if (name === 'slots') {
        return {
          inject(_slot, fn) { fn() },
          register(registration, component) { registered.push({ registration, component }); return () => {} },
          subscribe: () => () => {},
          entries: () => []
        }
      }
      if (name === 'sessions') return opts.sessions
      return undefined
    },
    effect(fn) { fn(); return () => {} },
    on() {},
    logger: { warn() {}, info() {} }
  }
  exports.apply(ctx)
  return { exports, registered }
}

test('the registered views expose a component factory (pluginView wiring)', async () => {
  const storage = makeStorage({})
  const { registered } = await loadViews(storage)
  assert.equal(registered.length >= 2, true, '两个 conversation.view 都应注册')
  const ids = registered.map((r) => r.registration.id)
  assert.deepEqual(ids.slice(0, 2), ['usage-cost-view', 'balance-view'])
  for (const r of registered.slice(0, 2)) {
    assert.equal(typeof r.component, 'function', r.registration.id + ' 应拿到一个组件函数')
  }
})

test('leaving the session calls openView("chat") and resets the stored preference', async () => {
  const effects = []
  const fakeReact = {
    createElement: () => null,
    useEffect(fn) { effects.push(fn); return undefined },
    useRef(initial) { return { current: initial } }
  }
  const storage = makeStorage({ 'dsh.conversation.A': JSON.stringify({ draft: 'hi', view: 'usage-cost-view', viewRequest: null }) })
  const current = { value: 'A' }
  const { registered } = await loadViews(storage, {
    react: fakeReact,
    sessions: { list: { getSnapshot: () => ({ current: current.value }) } }
  })
  const view = registered.find((r) => r.registration.id === 'usage-cost-view')
  const opened = []
  view.component({ openView: (v) => opened.push(v) })
  assert.equal(effects.length >= 2, true, '组件应声明多个 effect')

  // 切走会话：current 变 B，然后组件卸载
  current.value = 'B'
  for (const fn of effects) if (typeof fn === 'function') { const cleanup = fn(); if (typeof cleanup === 'function') cleanup() }
  assert.deepEqual(opened, ['chat'], '切走会话时应调用 openView("chat") 改内存态')
  const stored = JSON.parse(storage.getItem('dsh.conversation.A'))
  assert.equal(stored.view, 'chat', '持久化偏好也要复位')
  assert.equal(stored.draft, 'hi', '同一条存储的其它字段保留')
})

test('switching between the two plugin panels does NOT bounce back to chat', async () => {
  const effects = []
  const fakeReact = { createElement: () => null, useEffect(fn) { effects.push(fn); return undefined }, useRef(i) { return { current: i } } }
  const storage = makeStorage({ 'dsh.conversation.A': JSON.stringify({ draft: '', view: 'usage-cost-view', viewRequest: null }) })
  const { registered } = await loadViews(storage, {
    react: fakeReact,
    sessions: { list: { getSnapshot: () => ({ current: 'A' }) } }
  })
  const view = registered.find((r) => r.registration.id === 'usage-cost-view')
  const opened = []
  view.component({ openView: (v) => opened.push(v) })
  // 会话仍是 A：卸载（换页签）不应复位
  for (const fn of effects) if (typeof fn === 'function') { const c = fn(); if (typeof c === 'function') c() }
  assert.deepEqual(opened, [], '同一会话内换页签不应弹回对话')
  assert.equal(JSON.parse(storage.getItem('dsh.conversation.A')).view, 'usage-cost-view')
})

test('a built-in trajectory preference is never overwritten', async () => {
  const effects = []
  const fakeReact = { createElement: () => null, useEffect(fn) { effects.push(fn); return undefined }, useRef(i) { return { current: i } } }
  const storage = makeStorage({ 'dsh.conversation.A': JSON.stringify({ draft: '', view: 'trajectory', viewRequest: null }) })
  const current = { value: 'A' }
  const { registered } = await loadViews(storage, { react: fakeReact, sessions: { list: { getSnapshot: () => ({ current: current.value }) } } })
  const view = registered.find((r) => r.registration.id === 'usage-cost-view')
  view.component({ openView: () => {} })
  current.value = 'B'
  for (const fn of effects) if (typeof fn === 'function') { const c = fn(); if (typeof c === 'function') c() }
  assert.equal(JSON.parse(storage.getItem('dsh.conversation.A')).view, 'trajectory', '内置页签偏好必须保持原样')
})

test('missing sessions service degrades without throwing', async () => {
  const fakeReact = { createElement: () => null, useEffect(fn) { fn(); return undefined }, useRef(i) { return { current: i } } }
  const storage = makeStorage({})
  const { registered } = await loadViews(storage, { react: fakeReact, sessions: undefined })
  const view = registered.find((r) => r.registration.id === 'usage-cost-view')
  assert.doesNotThrow(() => view.component({ openView: () => {} }))
})

test('a corrupt stored preference never throws out of the component', async () => {
  const effects = []
  const fakeReact = { createElement: () => null, useEffect(fn) { effects.push(fn); return undefined }, useRef(i) { return { current: i } } }
  const storage = makeStorage({ 'dsh.conversation.A': '{not json' })
  const current = { value: 'A' }
  const { registered } = await loadViews(storage, { react: fakeReact, sessions: { list: { getSnapshot: () => ({ current: current.value }) } } })
  const view = registered.find((r) => r.registration.id === 'usage-cost-view')
  view.component({ openView: () => {} })
  current.value = 'B'
  assert.doesNotThrow(() => { for (const fn of effects) if (typeof fn === 'function') { const c = fn(); if (typeof c === 'function') c() } })
  assert.equal(storage.getItem('dsh.conversation.A'), '{not json', '解析失败时保持原样')
})

test('hiding the width handles never removes them from layout (visibility, not display)', async () => {
  // 这是布局回归的护栏：曾用 display:none + 祖先类名，导致用量/余额页布局被改动。
  // 现在的约定是只改元素自身的 inline visibility / pointer-events——
  // visibility 保留盒模型，布局与 harness 原样一致。
  const fs = await import('node:fs')
  const src = fs.readFileSync(CLIENT, 'utf8')
  assert.equal(src.includes('display:none !important'), false, '不得用 display:none 隐藏（会把盒子移出布局）')
  assert.equal(src.includes('classList.add'), false, '不得给祖先加类名（会波及容器与其它元素）')
  assert.equal(src.includes('style.visibility = "hidden"'), true, '应使用 visibility:hidden 保留盒模型')
  assert.equal(src.includes('style.pointerEvents = "none"'), true, '隐藏后应禁用指针事件')
})
