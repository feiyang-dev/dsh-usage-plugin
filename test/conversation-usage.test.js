import test from 'node:test'
import assert from 'node:assert/strict'
import { foldConversationUsage, readConversationUsage } from '../lib/conversation-usage.js'

const message = (seq, step, usage) => ({ seq, time: 1000 + seq, type: 'assistant/message', data: { turn: 1, step, usage } })
const total = (records) => records.reduce((n, r) => n + r.inputTokens + r.cacheReadTokens + r.cacheWriteTokens + r.outputTokens, 0)

test('截图会话六步日志恢复为 89815，不受漏记和标题记录影响', async () => {
  // 来自故障会话的用量字段，不包含用户对话内容。
  const buckets = [[2129,272,9472],[1342,561,11520],[216,345,14080],[1090,157,14208],[1004,895,15232],[1054,110,16128]]
  const events = buckets.map(([inputTokens, outputTokens, cacheReadTokens], i) => message(i, i + 1, { inputTokens, outputTokens, cacheReadTokens }))
  let closed = false
  const records = await readConversationUsage({ async open(id, mode) {
    assert.equal(id, 's'); assert.equal(mode, 'read')
    return { async read(seq) { assert.equal(seq, 0); return { events } }, async close() { closed = true } }
  } }, 's')
  assert.equal(total(records), 89815)
  assert.equal(records.length, 6)
  assert.equal(closed, true)
  assert.equal(records.reduce((n, r) => n + r.cacheReadTokens, 0), 80640)
})

test('有 usage 的失败尝试在重试后另计，无 usage 的尝试不虚增', () => {
  const events = [
    { seq: 0, time: 1000, type: 'assistant/attempt', data: { turn: 1, step: 1, stream: [{ chunk: { type: 'usage', usage: { inputTokens: 100, outputTokens: 10 } } }] } },
    { seq: 1, type: 'llm/retry-started', data: { turn: 1, step: 1 } },
    { seq: 2, type: 'assistant/attempt', data: { turn: 1, step: 1, stream: [] } },
    { seq: 3, type: 'llm/retry-started', data: { turn: 1, step: 1 } },
    message(4, 1, { inputTokens: 200, outputTokens: 20 })
  ]
  assert.equal(total(foldConversationUsage(events, 's')), 330)
})

test('同一步重复结算替换，推理不双计，未知路由仍计入宿主累计', () => {
  const records = foldConversationUsage([
    message(0, 1, { inputTokens: 100, outputTokens: 10 }),
    message(1, 1, { inputTokens: 100, outputTokens: 20, reasoningTokens: 15, cacheWriteTokens: 3 }),
    message(2, 2, { inputTokens: 200, outputTokens: 30 })
  ], 's')
  assert.equal(records.length, 2)
  assert.equal(total(records), 353)
  assert.equal(records[0].model, '')
})

test('不同步骤之后返回旧步骤应新增，不全局去重', () => {
  assert.equal(total(foldConversationUsage([message(0, 1, { inputTokens: 10 }), message(1, 2, { inputTokens: 20 }), message(2, 1, { inputTokens: 30 })], 's')), 60)
})

test('无关步骤重试不关闭当前结算槽位', () => {
  assert.equal(total(foldConversationUsage([message(0, 1, { inputTokens: 10 }), { seq: 1, type: 'llm/retry-started', data: { turn: 1, step: 2 } }, message(2, 1, { inputTokens: 20 })], 's')), 20)
})

test('读取失败仍关闭句柄，不回退到不完整缓存', async () => {
  let closed = false
  await assert.rejects(readConversationUsage({ async open() { return { async read() { throw new Error('read failed') }, async close() { closed = true } } } }, 's'), /read failed/)
  assert.equal(closed, true)
  await assert.rejects(readConversationUsage(null, 's'), /不可用/)
  await assert.rejects(readConversationUsage({}, ''), /ID/)
})

test('兼容旧版读取服务，空日志是零用量而非异常', async () => {
  assert.deepEqual(await readConversationUsage({ async readFrom() { return [] } }, 's'), [])
})
