import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
let mounts = 0
let captured = null

/** 加载插件，返回 exports / 发出的请求 / 渲染出的元素。 */
async function loadClient() {
  const ELEMENTS = []
  const effects = []
  const stateSets = []
  const fakeReact = {
    createElement: (type, props, ...kids) => { const n = { type, props, kids }; ELEMENTS.push(n); return n },
    // 记录 effect 但不立即执行，便于观察"没有窗口时"的行为
    useEffect: (fn) => { effects.push(fn) },
    useRef: () => ({ current: null }),
    useState: (v) => {
      const cur = typeof v === 'function' ? v() : v
      return [cur, (nv) => stateSets.push(nv)]
    },
    Fragment: 'frag'
  }
  globalThis.window = { __ModuleLoader__: null, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true, writable: true })
  const calls = []
  globalThis.fetch = (url, init) => {
    calls.push(JSON.parse(init.body))
    return Promise.resolve({ json: () => Promise.resolve({ ok: true, records: [], aggregate: { calls: 0 }, conversation: { calls: 0 } }) })
  }
  window.__ModuleLoader__ = { load(d) { captured = d } }
  await import(pathToFileURL(CLIENT).href + '?m=' + (++mounts))
  const exports = captured.factory((n) => {
    if (n === 'react') return fakeReact
    if (n === 'react-dom') throw new Error('no react-dom')
    throw new Error('unexpected: ' + n)
  })
  return { exports, calls, effects, stateSets, ELEMENTS }
}

/** 造一个含目标消息的 chat 快照（字段与官方 node.data.finalNode / location.turn 一致）。 */
function chatSnapshot(messageId, turnStartTime, turnEndTime, msgTime) {
  const node = {
    key: 'k1',
    data: { finalNode: { messageId, time: msgTime } },
    location: { kind: 'turn', turn: { turn: 1, start: { time: turnStartTime }, end: { time: turnEndTime } } }
  }
  return { nodes: new Map([['k1', node]]), order: ['k1'] }
}

test('the component reads nodes through useChat, never useSession', async () => {
  const { exports, effects } = await loadClient()
  const snap = chatSnapshot('msg-1', 1000000, 1060000, 1060000)
  let used = null
  exports.MessageTokenAction({
    messageId: 'msg-1', sessionId: 'sess-1',
    useChat: (sel) => { used = 'useChat'; return sel(snap) },
    useSession: () => { throw new Error('useSession 不该用于读取节点') }
  })
  assert.equal(used, 'useChat', '必须用 useChat 读节点')
  assert.ok(effects.length > 0, '应声明 effect')
})

test('the request window is the TURN range, not the whole session', async () => {
  const { exports, calls, effects } = await loadClient()
  const snap = chatSnapshot('msg-1', 1000000, 1060000, 1060000)
  exports.MessageTokenAction({
    messageId: 'msg-1', sessionId: 'sess-1',
    useChat: (sel) => sel(snap)
  })
  // 执行 effect（真实 React 会在挂载后调用）
  for (const fn of effects) { const c = fn(); if (typeof c === 'function') void c }
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(calls.length, 1, '应发出一次 tokenForMessage 请求')
  assert.equal(calls[0].from, 1000000, 'from 应为轮次开始时间')
  assert.equal(calls[0].to, 1060000, 'to 应为轮次结束时间')
  assert.equal(calls[0].sessionId, 'sess-1')
})

test('without a resolvable window no request is sent (no stuck loading)', async () => {
  const { exports, calls, effects } = await loadClient()
  // useChat 返回的节点里没有目标消息 -> 窗口取不到
  exports.MessageTokenAction({
    messageId: 'missing', sessionId: 'sess-1',
    useChat: (sel) => sel(chatSnapshot('other', 1, 2, 2))
  })
  for (const fn of effects) { const c = fn(); if (typeof c === 'function') void c }
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(calls.length, 0, '取不到窗口时不应发请求（避免无意义的查询）')
})

test('a node exposing finalNode on the node itself also works', async () => {
  const { exports, calls, effects } = await loadClient()
  const node = { key: 'k', messageId: 'msg-2', time: 5000, location: { kind: 'turn', turn: { start: { time: 4000 }, end: { time: 5000 } } } }
  exports.MessageTokenAction({
    messageId: 'msg-2', sessionId: 's1',
    useChat: (sel) => sel({ nodes: new Map([['k', node]]) })
  })
  for (const fn of effects) { const c = fn(); if (typeof c === 'function') void c }
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].from, 4000)
  assert.equal(calls[0].to, 5000)
})
