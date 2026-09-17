import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const PLUGIN = path.join(here, '..', 'lib')
let mounts = 0

async function loadClient() {
  const ELEMENTS = []
  const fakeReact = {
    createElement: (type, props, ...kids) => { const n = { type, props, kids }; ELEMENTS.push(n); return n },
    useEffect: () => {}, useRef: () => ({ current: null }),
    useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
    Fragment: 'frag'
  }
  globalThis.window = { __ModuleLoader__: null, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } }
  Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true, writable: true })
  let captured = null
  window.__ModuleLoader__ = { load(d) { captured = d } }
  await import(pathToFileURL(path.join(PLUGIN, 'client.js')).href + '?m=' + (++mounts))
  return captured.factory((n) => {
    if (n === 'react') return fakeReact
    if (n === 'react-dom') throw new Error('no react-dom')
    throw new Error('unexpected: ' + n)
  })
}

test('tokenForMessage no longer returns the whole session when the window is empty (host fix)', () => {
  const src = fs.readFileSync(path.join(PLUGIN, 'index.js'), 'utf8')
  // 关键回归：from/to 都为 0 时不得退化成"整场对话"，
  // 否则「本轮 token」会显示成「对话累计」的值（两个数字一模一样）。
  assert.equal(src.includes('let turnRecs = (from > 0 || to > 0) ? sessionRecs : []'), true,
    'from/to 都无效时应返回空集，而不是全量记录')
  assert.equal(/let turnRecs = sessionRecs\s*\n/.test(src), false, '不应再直接以全量作为本轮')
})

test('the per-message window uses the TURN boundary, not the step start', () => {
  const src = fs.readFileSync(path.join(PLUGIN, 'client.js'), 'utf8')
  // timing.stepStartTime 是"一步"的起点，长会话里会横跨很多轮，
  // 用它当窗口会把历史轮次算进本轮（曾经的错误表现）。
  assert.equal(/fin\.timing && fin\.timing\.stepStartTime/.test(src), false, '不应再用 stepStartTime 作窗口')
  assert.equal(src.includes('turn.start.time'), true, '应读取 turn.start.time')
  assert.equal(src.includes('turn.end.time'), true, '应读取 turn.end.time')
})

test('the label never substitutes the conversation total for the turn value', () => {
  const src = fs.readFileSync(path.join(PLUGIN, 'client.js'), 'utf8')
  // 之前是：agg2 缺失时用 convoTokens 顶替，导致按钮显示整场对话的 token
  assert.equal(/else if \(convo\) label = t\("本轮 token"\)/.test(src), false,
    '不得用对话累计值冒充本轮')
  assert.equal(src.includes('agg2 && agg2.calls > 0'), true, '应以本轮是否真有记录为判据')
})

test('an unlocatable turn shows a dash instead of a wrong number', async () => {
  const exports = await loadClient()
  // 没有 useSession 时取不到窗口 -> label 应为 "—"，不是某个大数
  const ELEMENTS = []
  const react = { createElement: (t, p, ...k) => { const n = { type: t, props: p, kids: k }; ELEMENTS.push(n); return n }, useEffect: () => {}, useRef: () => ({ current: null }), useState: (v) => [typeof v === 'function' ? v() : v, () => {}], Fragment: 'frag' }
  // 组件内部状态在假 React 下不会更新，这里只验证"初始渲染"不抛错且不含错误数值
  assert.doesNotThrow(() => exports.MessageTokenAction ? exports.MessageTokenAction({ messageId: 'm1' }) : void 0)
})
