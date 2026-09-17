import test from 'node:test'
import assert from 'node:assert/strict'
import { promises as fs, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { normalizeRecord, recordKey } from '../lib/records.js'
import { atomicWriteText, readStoredRecords } from '../lib/storage.js'
import { reduceSessionEvents, mergeScannedRecords, probeCoveredSessions, enrichBillingMetadata,
  scanSession, parseScanCache, createScanCache } from '../lib/scan.js'

const usage = { inputTokens: 100, outputTokens: 10, cacheReadTokens: 20, cacheWriteTokens: 0, reasoningTokens: 3 }
const event = (seq, step = 1, u = usage) => ({ seq, time: 2000 + seq, type: 'assistant/message',
  data: { turn: 1, step, usage: u, message: { source: { provider: 'p', model: 'm' } } } })
const probe = (extra = {}) => ({ time: 1000, sessionId: 's', provider: 'p', model: 'm', purpose: '', ...usage, ...extra })
const scan = (events) => reduceSessionEvents(events, { sessionId: 's' }).records
const total = (rs) => rs.reduce((n, r) => n + r.inputTokens + r.outputTokens + r.cacheReadTokens + r.cacheWriteTokens, 0)

test('扫描身份与结算槽位经过落盘归一化后保持，不误判为探针', () => {
  const before = scan([event(8)])[0]
  const after = normalizeRecord(JSON.parse(JSON.stringify(before)))
  for (const key of ['origin', 'seq', 'turn', 'step', 'slotSeq']) assert.equal(after[key], before[key])
  assert.equal(probeCoveredSessions([after]).size, 0)
})

test('同毫秒不同会话、同会话不同调用和不同 UUID 都保持独立', () => {
  const records = [probe(), probe({ sessionId: 'other' }), probe({ outputTokens: 20 }), probe({ recordId: 'a' }), probe({ recordId: 'b' })]
  assert.equal(new Set(records.map(normalizeRecord).map(recordKey)).size, records.length)
  assert.equal(recordKey(normalizeRecord(records[0])), recordKey(normalizeRecord({ ...records[0] })))
})

test('真实缓存写入恰好等于未命中数也不会在重启时被清零', () => {
  for (const provider of ['deepseek', 'buddy', 'anthropic', 'unknown']) {
    assert.equal(normalizeRecord(probe({ provider, cacheWriteTokens: 100 })).cacheWriteTokens, 100)
  }
})

test('重复结算和重复深扫均不会追加副本，费用元数据仍保留', () => {
  const records = [probe({ usdCnyRate: 7.1, fxDate: '2026-09-01' })]
  const incoming = scan([event(1), event(2)])
  mergeScannedRecords(records, incoming, { deep: true })
  assert.equal(records.length, 1)
  assert.equal(records[0].usdCnyRate, 7.1)
  mergeScannedRecords(records, incoming, { deep: true })
  assert.equal(records.length, 1)
  assert.equal(records[0].pricingTime, 1000)
  assert.equal(records[0].fxDate, '2026-09-01')
})

test('标题、不同路由或不同用量不会被错误吸收', () => {
  for (const extra of [{ purpose: 'session-title' }, { provider: 'another' }, { outputTokens: 99 }]) {
    const original = probe(extra), records = [{ ...original }]
    mergeScannedRecords(records, scan([event(1)]), { deep: true })
    assert.equal(records.length, 2)
    assert.deepEqual(records.find((r) => !r.origin), original)
  }
})

test('多个候选同值请求不会再追加扫描副本，也不会猜测历史汇率', () => {
  const records = [probe({ recordId: 'a', usdCnyRate: 7 }), probe({ recordId: 'b', usdCnyRate: 8 })]
  const result = mergeScannedRecords(records, scan([event(1)]), { deep: true })
  assert.equal(records.length, 2)
  assert.equal(result.ambiguous, 1)
  assert.equal(enrichBillingMetadata(scan([event(1)]), records)[0].usdCnyRate, undefined)
})

test('失败重试跨扫描批次及缓存重载累计，重复扫描仍幂等', async () => {
  const events = [event(1)]
  const persistence = { async open() { return { async read(seq) { return { events: events.filter((e) => e.seq >= seq) } }, async close() {} } } }
  let cache = createScanCache()
  cache.sessions.s = { seq: -1, revision: '', lastRoute: null }
  const records = []
  mergeScannedRecords(records, (await scanSession(persistence, 's', cache.sessions.s)).records)
  cache = parseScanCache(JSON.parse(JSON.stringify(cache)))
  events.push({ seq: 2, type: 'llm/retry-started', data: { turn: 1, step: 1 } }, event(3, 1, { ...usage, inputTokens: 200 }))
  mergeScannedRecords(records, (await scanSession(persistence, 's', cache.sessions.s)).records)
  assert.equal(records.length, 2)
  assert.equal(total(records), 360)
  mergeScannedRecords(records, (await scanSession(persistence, 's', cache.sessions.s, { deep: true })).records)
  assert.equal(records.length, 2)
  assert.equal(total(records), 360)
})

test('增量重复结算跨重启仍替换同一槽位，不误算为新请求', async () => {
  const state = {}, records = []
  mergeScannedRecords(records, reduceSessionEvents([event(1)], { sessionId: 's', state }).records)
  mergeScannedRecords(records, reduceSessionEvents([event(2, 1, { ...usage, outputTokens: 20 })], { sessionId: 's', state: JSON.parse(JSON.stringify(state)) }).records)
  assert.equal(records.length, 1)
  assert.equal(records[0].outputTokens, 20)
})

test('面板恢复原汇率、日期和计费起点，保持日志结算时间供本轮筛选', () => {
  const before = probe({ usdCnyRate: 7.1, fxDate: '2026-09-01' })
  const after = enrichBillingMetadata(scan([event(1)]), [before])[0]
  assert.equal(after.usdCnyRate, 7.1)
  assert.equal(after.pricingTime, before.time)
  assert.equal(after.time, 2001)
})

test('宿主实际费用函数使用已保存汇率，不随当前汇率变化；无历史汇率不伪算', () => {
  const source = readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
  const body = source.slice(source.indexOf('      function costFor('), source.indexOf('      // 过滤内部/占位调用'))
  const FX = { rate: 8 }
  const costFor = new Function('FX', 'DIGITALOCEAN_PRICING', body + ';return costFor')(FX,
    { flash: { cacheHit: 1, cacheMiss: 2, output: 3 } })
  const original = probe({ provider: 'digitalocean', model: 'flash', usdCnyRate: 7.1 })
  const scanned = { ...scan([event(1)])[0], provider: 'digitalocean', model: 'flash' }
  const enriched = enrichBillingMetadata([scanned], [original])[0]
  const expected = costFor(original, 'auto')
  FX.rate = 9
  assert.equal(costFor(enriched, 'auto'), expected)
  assert.equal(costFor(scanned, 'auto'), 0)
})

// 执行宿主实际初始化函数，隔离文件目录与其余宿主服务，验证失败路径而非只检查源码文本。
function hostInitializer(records) {
  const source = readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
  const body = source.slice(source.indexOf('      async function tryInitWithRoot'), source.indexOf('      async function migrateLegacy'))
  return new Function('records', 'readStoredRecords', 'nfsWriteText', 'normalizeRecord', 'recordKey', 'path', `
    const normPath = x => x, joinPath = path.join, MAX_RECORDS = 100000, msg = String;
    const scanState = {}, loadPricing = async () => {}, loadBudget = async () => {};
    let root, dataPath, pricingPath, budgetPath, persistOk, persistError;
    ${body}; return tryInitWithRoot;
  `)(records, readStoredRecords, atomicWriteText, normalizeRecord, recordKey, path)
}

test('损坏 JSON 或错误结构初始化失败，原始文件字节保持不变', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dsh-storage-test-'))
  try {
    const file = path.join(root, 'dsh-usage', 'usage-records.json')
    for (const original of ['{broken', '{"records":[]}']) {
      await atomicWriteText(file, original)
      const result = await hostInitializer([])(root)
      assert.equal(result.ok, false)
      assert.equal(result.fatal, true)
      assert.equal(await fs.readFile(file, 'utf8'), original)
    }
  } finally { await fs.rm(root, { recursive: true }) }
})

test('真实宿主加载保留同毫秒记录与扫描身份，原子替换后没有临时残留', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dsh-storage-test-'))
  try {
    const file = path.join(root, 'dsh-usage', 'usage-records.json')
    const expected = [probe(), probe({ sessionId: 'other' }), ...scan([event(1)])]
    await atomicWriteText(file, JSON.stringify(expected))
    const records = []
    assert.equal((await hostInitializer(records)(root)).ok, true)
    assert.equal(records.length, 3)
    assert.equal((await readStoredRecords(file)).filter((r) => r.origin === 'scan').length, 1)
    assert.deepEqual(await fs.readdir(path.dirname(file)), ['usage-records.json'])
  } finally { await fs.rm(root, { recursive: true }) }
})

test('原子替换失败保留既有目标，不留下临时文件', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dsh-storage-test-'))
  try {
    const target = path.join(root, 'existing-directory')
    await fs.mkdir(target)
    await fs.writeFile(path.join(target, 'keep'), 'original')
    await assert.rejects(atomicWriteText(target, 'new'))
    assert.equal(await fs.readFile(path.join(target, 'keep'), 'utf8'), 'original')
    assert.deepEqual(await fs.readdir(root), ['existing-directory'])
  } finally { await fs.rm(root, { recursive: true }) }
})
