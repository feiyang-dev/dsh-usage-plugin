import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRecord, recordKey, billableTokens } from '../lib/records.js'

// 兼容性回归：旧记录（1.17.0 及更早写入）没有 recordId / pricingTime / origin /
// estimated / unit 任何一个字段。它们必须原样可读，且**不能**被补上任何假值——
// 一旦补出假值，历史口径就被污染了。
test('normalizeRecord keeps legacy records readable without inventing new fields', () => {
  const rec = normalizeRecord({
    time: 1786674996903,
    model: 'deepseek-v4-flash',
    provider: 'deepseek-official',
    inputTokens: 817,
    outputTokens: 592,
    cacheReadTokens: 270848,
    cacheWriteTokens: 0,
    reasoningTokens: 160,
    finishReason: 'stop'
  })
  assert.equal(rec.time, 1786674996903)
  assert.equal(rec.inputTokens, 817)
  assert.equal(rec.cacheReadTokens, 270848)
  assert.equal(rec.cacheWriteTokens, 0)
  assert.equal('recordId' in rec, false)
  assert.equal('pricingTime' in rec, false)
  assert.equal('origin' in rec, false)
  assert.equal('estimated' in rec, false)
  assert.equal('unit' in rec, false)
})

test('normalizeRecord drops entries without a usable timestamp', () => {
  assert.equal(normalizeRecord(null), null)
  assert.equal(normalizeRecord('nope'), null)
  assert.equal(normalizeRecord({}), null)
  assert.equal(normalizeRecord({ time: 0 }), null)
  assert.equal(normalizeRecord({ time: Number.NaN }), null)
  assert.equal(normalizeRecord({ time: -5 }), null)
})

// 这是本次修复的核心之一：DeepSeek 系 provider 不上报 cacheWriteTokens，
// 旧实现用 inputTokens 兜底，等于伪造一笔与未命中相等的缓存写入。
test('normalizeRecord never fabricates cacheWriteTokens from inputTokens', () => {
  const rec = normalizeRecord({ time: 1, model: 'm', provider: 'p', inputTokens: 1234 })
  assert.equal(rec.inputTokens, 1234)
  assert.equal(rec.cacheWriteTokens, 0)
})

test('normalizeRecord keeps a frozen unit-price snapshot', () => {
  const rec = normalizeRecord({ time: 1, unit: { hit: 0.02, miss: 1, out: 4, table: 'peakValleyV41', fx: 7.1 } })
  assert.deepEqual(rec.unit, { hit: 0.02, miss: 1, out: 4, fx: 7.1 })
})

test('normalizeRecord discards a snapshot with no usable numbers', () => {
  assert.equal('unit' in normalizeRecord({ time: 1, unit: 'nope' }), false)
  assert.equal('unit' in normalizeRecord({ time: 1, unit: {} }), false)
  assert.equal('unit' in normalizeRecord({ time: 1, unit: { hit: 'x', miss: 'y', out: 'z' } }), false)
})

test('normalizeRecord keeps host turn/step indices when they are real integers', () => {
  const rec = normalizeRecord({ time: 1, turn: 3, step: 2 })
  assert.equal(rec.turn, 3)
  assert.equal(rec.step, 2)
  assert.equal('turn' in normalizeRecord({ time: 1, turn: -1 }), false)
  assert.equal('step' in normalizeRecord({ time: 1, step: 1.5 }), false)
})

// 旧实现按毫秒去重：同一毫秒的两条不同请求会互相吞掉一条。这里锁住新规则。
test('recordKey separates two different requests inside the same millisecond', () => {
  const a = normalizeRecord({ time: 1000, model: 'm', provider: 'p', sessionId: 's', inputTokens: 1 })
  const b = normalizeRecord({ time: 1000, model: 'm', provider: 'p', sessionId: 's', inputTokens: 2 })
  assert.notEqual(recordKey(a), recordKey(b))
})

test('recordKey still collapses a genuine duplicate', () => {
  const fields = { time: 1000, model: 'm', provider: 'p', sessionId: 's', inputTokens: 1, outputTokens: 2 }
  assert.equal(recordKey(normalizeRecord(fields)), recordKey(normalizeRecord({ ...fields })))
})

test('recordKey prefers the probe UUID when present', () => {
  const a = normalizeRecord({ time: 1, recordId: 'abc', inputTokens: 1 })
  const b = normalizeRecord({ time: 2, recordId: 'abc', inputTokens: 99 })
  assert.equal(recordKey(a), recordKey(b))
})

test('recordKey uses (origin, sessionId, seq) for scanned records', () => {
  const a = normalizeRecord({ time: 1, origin: 'scan', seq: 7, sessionId: 's', inputTokens: 1 })
  const b = normalizeRecord({ time: 2, origin: 'scan', seq: 7, sessionId: 's', inputTokens: 99 })
  const c = normalizeRecord({ time: 2, origin: 'scan', seq: 8, sessionId: 's', inputTokens: 99 })
  assert.equal(recordKey(a), recordKey(b))
  assert.notEqual(recordKey(a), recordKey(c))
})

// 宿主 outputTokens 就是上游 completion_tokens，reasoning 是它的子集。
// 展示层的"总 token"若把 reasoning 再加一遍，就会比宿主状态栏大一截。
test('billableTokens sums the four disjoint buckets and excludes reasoning', () => {
  assert.equal(billableTokens({ inputTokens: 10, cacheReadTokens: 20, cacheWriteTokens: 0, outputTokens: 30, reasoningTokens: 7 }), 60)
  assert.equal(billableTokens({}), 0)
})
