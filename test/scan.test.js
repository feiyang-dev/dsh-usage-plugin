import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SCAN_ORIGIN,
  SCAN_CACHE_VERSION,
  commitScanRevisions,
  createScanCache,
  listStoredSessions,
  mergeScannedRecords,
  parseScanCache,
  probeCoveredSessions,
  pruneScanCache,
  reduceSessionEvents,
  sampleOfEvent,
  scanRecordKey,
  scanSession,
  scanSessions
} from '../lib/scan.js'

/**
 * 假持久化后端：只实现当前版本的 list() + open(id,'read') 形状。
 * 记录每次 read 的起点，用于断言"revision 未变时一次读都不发"。
 */
function fakePersistence(logs, options = {}) {
  const reads = []
  const opened = []
  const openedHandles = []
  return {
    reads,
    opened,
    openedHandles,
    async list() {
      if (options.listFails) throw new Error('list failed')
      return Object.entries(logs).map(([id, log]) => ({ header: { id, cwd: log.cwd }, revision: log.revision }))
    },
    async open(id, access) {
      if (access !== 'read') throw new Error('only read access is expected')
      if (!logs[id]) throw new Error('not found: ' + id)
      opened.push(id)
      const handle = {
        closed: false,
        async read(fromSeq) {
          reads.push({ id, fromSeq })
          if (options.readFails && options.readFails(id)) throw new Error('read failed: ' + id)
          return { eventState: 'detached', events: logs[id].events.filter((event) => event.seq >= (fromSeq || 0)) }
        },
        async close() { handle.closed = true; openedHandles.push(handle) }
      }
      return handle
    }
  }
}

/** 造一条 v3 的 assistant/message 事件。 */
function message(seq, time, turn, step, usage, provider = 'deepseek-official', model = 'deepseek-v4-pro') {
  return {
    type: 'assistant/message',
    seq,
    time,
    data: { turn, step, message: { source: { kind: 'model', provider, model } }, usage, stream: [] }
  }
}

/** 造一条 request/header 事件（provider/model 归属的回退来源）。 */
function header(seq, time, provider, model) {
  return { type: 'request/header', seq, time, data: { header: { config: { provider, model } }, reason: 'initial' } }
}

/** 造一条探针记录（实时通道写入的形状，无 origin 标记）。 */
function probeRecord(time, model, sessionId, extra = {}) {
  return {
    time, model, provider: 'deepseek-official', purpose: '', sessionId,
    inputTokens: 100, outputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 100,
    reasoningTokens: 0, finishReason: 'stop', ...extra
  }
}

test('sampleOfEvent reads both released field paths and ignores everything else', () => {
  // v1 路径：assistant/chunk 里的 usage 帧
  const chunk = {
    type: 'assistant/chunk',
    seq: 7,
    time: 1786641273990,
    data: { turn: 1, step: 1, chunk: { type: 'usage', usage: { inputTokens: 11631, outputTokens: 181, cacheReadTokens: 0, reasoningTokens: 116 } } }
  }
  // v3 路径：assistant/message 的顶层 usage
  const msg = message(9, 1786641300000, 2, 3, { inputTokens: 10, outputTokens: 20, cacheReadTokens: 30 })
  assert.deepEqual(sampleOfEvent(chunk), {
    usage: { inputTokens: 11631, outputTokens: 181, cacheReadTokens: 0, reasoningTokens: 116 },
    turn: 1,
    step: 1
  })
  assert.deepEqual(sampleOfEvent(msg).usage, { inputTokens: 10, outputTokens: 20, cacheReadTokens: 30 })
  // assistant/attempt 只有 stream，没有顶层 usage -> 不认
  assert.equal(sampleOfEvent({ type: 'assistant/attempt', seq: 1, time: 1, data: { turn: 1, step: 1, stream: [] } }), null)
  assert.equal(sampleOfEvent({ type: 'assistant/chunk', seq: 1, time: 1, data: { turn: 1, step: 1, chunk: { type: 'text', text: 'x' } } }), null)
  assert.equal(sampleOfEvent(null), null)
  assert.equal(sampleOfEvent({ type: 'assistant/message', seq: 1, time: 1, data: {} }), null)
})

test('reduceSessionEvents attributes usage to provider/model with request/header fallback', () => {
  const events = [
    header(0, 1000, 'workbuddy', 'deepseek-v4.1-flash'),
    message(1, 2000, 1, 1, { inputTokens: 100, outputTokens: 20, cacheReadTokens: 900 }, undefined, undefined),
    message(2, 3000, 1, 2, { inputTokens: 5, outputTokens: 6 }, 'siliconflow', 'deepseek-ai/deepseek-v4-pro')
  ]
  // 第二条事件的 source 有 provider/model，覆盖 fallback
  const patched = { ...events[1], data: { ...events[1].data, message: { source: { kind: 'model' } } } }
  const { records, cursor } = reduceSessionEvents([events[0], patched, events[2]], { sessionId: 's1' })
  assert.equal(cursor, 2, '游标 = 已消费的最大 seq')
  assert.equal(records.length, 2)
  // 没有 message.source.model -> 回退到最近一次 request/header
  assert.equal(records[0].provider, 'workbuddy')
  assert.equal(records[0].model, 'deepseek-v4.1-flash')
  assert.equal(records[0].sessionId, 's1')
  assert.equal(records[0].origin, SCAN_ORIGIN)
  assert.equal(records[0].turn, 1)
  assert.equal(records[0].step, 1)
  assert.equal(records[0].time, 2000)
  assert.equal(records[1].provider, 'siliconflow')
  assert.equal(records[1].model, 'deepseek-ai/deepseek-v4-pro')
})

test('cacheWriteTokens stores only the reported value (no miss fallback)', () => {
  const { records } = reduceSessionEvents([
    message(0, 1, 1, 1, { inputTokens: 500, outputTokens: 5, cacheReadTokens: 100 })
  ], { sessionId: 's' })
  assert.equal(records[0].cacheWriteTokens, 0, 'DeepSeek 系不上报 cacheWrite，记 0；兜底展示由客户端负责')
  const explicit = reduceSessionEvents([
    message(0, 1, 1, 1, { inputTokens: 500, outputTokens: 5, cacheWriteTokens: 42 })
  ], { sessionId: 's' })
  assert.equal(explicit.records[0].cacheWriteTokens, 42, '上报了就按上报值')
})

test('probe and scan source never fabricate cacheWrite from miss again', () => {
  // 回归护栏：旧版用 inputTokens 兜底伪造 cacheWrite，导致四桶合计双计未命中，
  // 「总 token」比宿主状态栏大出累计未命中数。此处直接检查源码防止复发。
  const lib = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib')
  const host = fs.readFileSync(path.join(lib, 'index.js'), 'utf8')
  const scan = fs.readFileSync(path.join(lib, 'scan.js'), 'utf8')
  assert.equal(/cacheWriteTokens\s*\|\|\s*(usage\.)?inputTokens/.test(host), false, '探针不得用未命中兜底 cacheWrite')
  assert.equal(/usage\.cacheWriteTokens\)\s*\|\|\s*num\(sample\.usage\.inputTokens\)/.test(scan), false, '扫描不得用未命中兜底 cacheWrite')
})

test('scanRecordKey keeps rescanning idempotent via turn/step', () => {
  const first = message(4, 1000, 3, 2, { inputTokens: 1 }, 'p', 'm')
  const scanned = reduceSessionEvents([first], { sessionId: 's' }).records
  assert.equal(scanRecordKey(scanned[0]), 's|slot4')

  const records = []
  const one = mergeScannedRecords(records, scanned)
  assert.deepEqual({ added: one.added, replaced: one.replaced }, { added: 1, replaced: 0 })
  // 同一段日志再扫一次：原地替换，不新增
  const again = mergeScannedRecords(records, reduceSessionEvents([first], { sessionId: 's' }).records)
  assert.deepEqual({ added: again.added, replaced: again.replaced }, { added: 0, replaced: 1 })
  assert.equal(records.length, 1)
})

test('mergeScannedRecords never overwrites a live probe record by default', () => {
  const probe = probeRecord(1_000_000, 'deepseek-v4-pro', 's1')
  const records = [probe]
  const scanned = reduceSessionEvents([
    message(0, 1_000_400, 1, 1, { inputTokens: 999, outputTokens: 99 }, 'deepseek-official', 'deepseek-v4-pro')
  ], { sessionId: 's1' }).records
  const stats = mergeScannedRecords(records, scanned)
  assert.equal(stats.added, 1, '默认模式下扫描记录作为新行追加')
  assert.equal(records.length, 2)
  assert.equal(records[0].interrupted, undefined === undefined ? records[0].interrupted : false)
  // 探针记录必须原样保留
  assert.equal(records[0].finishReason, 'stop')
  assert.equal(records.find((r) => r.origin === SCAN_ORIGIN).inputTokens, 999)
})

test('deep mode absorbs the probe row for the same call and keeps its extra fields', () => {
  const records = [probeRecord(1_000_000, 'deepseek-v4-pro', 's1', { purpose: '', inputTokens: 2112, outputTokens: 351, cacheReadTokens: 9472, cacheWriteTokens: 0, reasoningTokens: 12, usdCnyRate: 7.1, fxDate: '2026-09-01' })]
  const scanned = reduceSessionEvents([
    message(0, 1_000_400, 4, 1, { inputTokens: 2112, outputTokens: 351, cacheReadTokens: 9472, reasoningTokens: 12 }, 'deepseek-official', 'deepseek-v4-pro')
  ], { sessionId: 's1' }).records
  const stats = mergeScannedRecords(records, scanned, { deep: true })
  assert.deepEqual({ added: stats.added, replaced: stats.replaced, absorbed: stats.absorbed }, { added: 0, replaced: 0, absorbed: 1 })
  assert.equal(records.length, 1, '探针行被扫描行吸收，不产生重复')
  assert.equal(records[0].origin, SCAN_ORIGIN)
  assert.equal(records[0].inputTokens, 2112, 'token 以日志为准')
  assert.equal(records[0].usdCnyRate, 7.1, '历史汇率保留')
  assert.equal(records[0].reasoningTokens, 12)
  assert.equal(records[0].turn, 4)
})

test('deep mode still ignores a probe record for a different model', () => {
  const records = [probeRecord(1_000_000, 'deepseek-v4-flash', 's1')]
  const scanned = reduceSessionEvents([
    message(0, 1_000_400, 1, 1, { inputTokens: 5 }, 'deepseek-official', 'deepseek-v4-pro')
  ], { sessionId: 's1' }).records
  const stats = mergeScannedRecords(records, scanned, { deep: true })
  assert.equal(stats.absorbed, 0)
  assert.equal(records.length, 2)
})

test('probeCoveredSessions only reports sessions the live probe already recorded', () => {
  const covered = probeCoveredSessions([
    probeRecord(1, 'm', 's1'),
    probeRecord(2, 'm', 's1'),
    { ...probeRecord(3, 'm', 's2'), origin: SCAN_ORIGIN },
    { ...probeRecord(4, 'm', '') }
  ])
  assert.deepEqual([...covered].sort(), ['s1'])
})

test('scanSession reads incrementally and refolds only when the cursor disappears', async () => {
  const log = {
    cwd: 'D:\\Project\\Test',
    revision: 'r1',
    events: [header(0, 1000, 'p', 'm'), message(1, 2000, 1, 1, { inputTokens: 10 }), message(2, 3000, 1, 2, { inputTokens: 20 })]
  }
  const persistence = fakePersistence({ s1: log })

  // 首扫：从 seq 0 读全量
  const cache = createScanCache()
  const first = await scanSessions(persistence, {
    sessions: [{ header: { id: 's1', cwd: log.cwd }, revision: 'r1' }],
    cache,
    records: []
  })
  assert.equal(first.records.length, 2)
  assert.equal(first.stats.scanned, 1)
  commitScanRevisions(cache, first.revisions)
  assert.equal(cache.sessions.s1.seq, 2, '游标 = 已消费的最大 seq')
  assert.deepEqual(persistence.reads, [{ id: 's1', fromSeq: 0 }])
  assert.equal(persistence.openedHandles.every((h) => h.closed), true, '读句柄必须关闭')

  // revision 未变：一次读都不发
  persistence.reads.length = 0
  const second = await scanSessions(persistence, {
    sessions: [{ header: { id: 's1', cwd: log.cwd }, revision: 'r1' }],
    cache,
    records: []
  })
  assert.equal(second.stats.skipped, 1)
  assert.equal(persistence.reads.length, 0)

  // 追加两个事件后 revision 变化：只读增量
  log.events.push(message(3, 4000, 2, 1, { inputTokens: 30 }), message(4, 5000, 2, 2, { inputTokens: 40 }))
  log.revision = 'r2'
  persistence.reads.length = 0
  const third = await scanSessions(persistence, {
    sessions: [{ header: { id: 's1', cwd: log.cwd }, revision: 'r2' }],
    cache,
    records: []
  })
  assert.deepEqual(persistence.reads, [{ id: 's1', fromSeq: 2 }], '只从游标处续读')
  assert.equal(third.records.length, 2)
  assert.equal(third.records[0].inputTokens, 30)
  assert.equal(cache.sessions.s1.seq, 4, '游标推进到最后一条已消费事件')
})

test('scanSession refolds from seq 0 when the log was rewritten under the cursor', async () => {
  const log = {
    cwd: 'W',
    revision: 'r1',
    events: [header(0, 1000, 'p', 'm'), message(1, 2000, 1, 1, { inputTokens: 10 }), message(2, 3000, 1, 2, { inputTokens: 20 })]
  }
  const persistence = fakePersistence({ s1: log })
  const cache = createScanCache()
  const first = await scanSessions(persistence, { sessions: [{ header: { id: 's1', cwd: 'W' }, revision: 'r1' }], cache, records: [] })
  commitScanRevisions(cache, first.revisions)
  assert.equal(cache.sessions.s1.seq, 2)

  // 日志被重写：seq 从头开始，游标事件已不存在
  log.events = [header(0, 9000, 'p', 'm'), message(1, 9100, 1, 1, { inputTokens: 77 })]
  log.revision = 'r2'
  persistence.reads.length = 0
  const again = await scanSessions(persistence, { sessions: [{ header: { id: 's1', cwd: 'W' }, revision: 'r2' }], cache, records: [] })
  assert.deepEqual(persistence.reads.map((r) => r.fromSeq), [2, 0], '先探游标、发现断链后从 0 重读')
  assert.equal(again.records.length, 1)
  assert.equal(again.records[0].inputTokens, 77)
})

test('scanSession detects a fresh-start log as contiguous without refolding', async () => {
  // 游标 0 的会话：read(0) 返回全部事件，不能误判为"重写"
  const log = { cwd: 'W', revision: 'r', events: [message(0, 1000, 1, 1, { inputTokens: 3 })] }
  const persistence = fakePersistence({ s1: log })
  const cache = createScanCache()
  const result = await scanSessions(persistence, { sessions: [{ header: { id: 's1', cwd: 'W' }, revision: 'r' }], cache, records: [] })
  assert.deepEqual(persistence.reads.map((r) => r.fromSeq), [0])
  assert.equal(result.records.length, 1)
  assert.equal(cache.sessions.s1.seq, 0)
})

test('an unchanged revision with an empty tail keeps the cursor (no refold, no re-read)', async () => {
  const log = { cwd: 'W', revision: 'r1', events: [message(0, 1000, 1, 1, { inputTokens: 3 })] }
  const persistence = fakePersistence({ s1: log })
  const cache = createScanCache()
  const first = await scanSessions(persistence, { sessions: [{ header: { id: 's1', cwd: 'W' }, revision: 'r1' }], cache, records: [] })
  commitScanRevisions(cache, first.revisions)
  // 后端 revision 不可用（返回空串）：每轮都会进入 fold，但空增量 + 游标仍在 => 不重读
  persistence.reads.length = 0
  const second = await scanSessions(persistence, { sessions: [{ header: { id: 's1', cwd: 'W' }, revision: '' }], cache, records: [] })
  assert.deepEqual(persistence.reads.map((r) => r.fromSeq), [0], '只读游标处，不从 0 重读')
  assert.equal(second.records.length, 0)
  assert.equal(cache.sessions.s1.seq, 0)
})

test('scanSession survives a failing read without corrupting the cursor', async () => {
  const log = { cwd: 'W', revision: 'r1', events: [message(0, 1000, 1, 1, { inputTokens: 3 })] }
  const persistence = fakePersistence({ s1: log }, { readFails: () => true })
  const cache = createScanCache()
  const errors = []
  const result = await scanSessions(persistence, {
    sessions: [{ header: { id: 's1', cwd: 'W' }, revision: 'r1' }],
    cache, records: [], onError: (id, error) => errors.push([id, String(error.message)])
  })
  assert.equal(result.stats.failed, 1)
  assert.deepEqual(errors, [['s1', 'read failed: s1']])
  assert.equal(cache.sessions.s1.seq, -1, '失败不推进游标')
  assert.equal(persistence.openedHandles.every((h) => h.closed), true, '失败路径也要关闭句柄')
})

test('scanSessions filters by workspace and honours the batch limit', async () => {
  const logs = {
    a: { cwd: 'D:\\A', revision: 'ra', events: [message(0, 10, 1, 1, { inputTokens: 1 })] },
    b: { cwd: 'D:\\B', revision: 'rb', events: [message(0, 20, 1, 1, { inputTokens: 1 })] },
    c: { cwd: 'D:\\A', revision: 'rc', events: [message(0, 30, 1, 1, { inputTokens: 1 })] }
  }
  const persistence = fakePersistence(logs)
  const cache = createScanCache()
  const limited = await scanSessions(persistence, {
    sessions: Object.keys(logs).map((id) => ({ header: { id, cwd: logs[id].cwd }, revision: logs[id].revision })),
    cache, records: [], cwd: 'D:\\A', limit: 1
  })
  assert.equal(limited.stats.total, 2, '只统计同工作区的会话')
  assert.equal(limited.stats.scanned, 1)
  assert.equal(limited.stats.pending, 1, '超出批次上限的留待下一次')
  assert.equal(Object.keys(limited.revisions).length, 1, '未处理的会话不提交 revision')
})

test('scanSessions skips sessions the live probe already covers', async () => {
  const logs = {
    a: { cwd: 'W', revision: 'ra', events: [message(0, 10, 1, 1, { inputTokens: 1 })] },
    b: { cwd: 'W', revision: 'rb', events: [message(0, 20, 1, 1, { inputTokens: 1 })] }
  }
  const persistence = fakePersistence(logs)
  const result = await scanSessions(persistence, {
    sessions: [{ header: { id: 'a', cwd: 'W' }, revision: 'ra' }, { header: { id: 'b', cwd: 'W' }, revision: 'rb' }],
    cache: createScanCache(),
    records: [probeRecord(1, 'm', 'a')]
  })
  assert.equal(result.stats.covered, 1)
  assert.equal(result.stats.scanned, 1)
  assert.equal(persistence.opened.length, 1)
  assert.equal(persistence.opened[0], 'b', '只打开未被覆盖的会话')
})

test('listStoredSessions normalizes both listing shapes and degrades to list()', async () => {
  const modern = {
    async list() { return [{ header: { id: 'x' }, revision: 'r' }] }
  }
  assert.deepEqual(await listStoredSessions(modern), [{ header: { id: 'x' }, revision: 'r' }])

  // 旧版后端：裸 header + listSnapshots()
  const legacy = {
    async listSnapshots() { return [{ header: { id: 'y' }, revision: 'r2' }] },
    async list() { throw new Error('must not be called') }
  }
  assert.deepEqual(await listStoredSessions(legacy), [{ header: { id: 'y' }, revision: 'r2' }])

  // listSnapshots 抛错时降级到 list()
  const mixed = {
    async listSnapshots() { throw new Error('gone') },
    async list() { return [{ id: 'z' }] }
  }
  assert.deepEqual(await listStoredSessions(mixed), [{ header: { id: 'z' }, revision: '' }])

  const broken = { async list() { throw new Error('nope') } }
  assert.equal(await listStoredSessions(broken), null)
})

test('scan cache round-trips through disk shape and prunes vanished sessions', () => {
  const cache = createScanCache()
  cache.sessions.s1 = { revision: 'r1', seq: 42, lastRoute: { provider: 'p', model: 'm' }, lastSample: null }
  const restored = parseScanCache(JSON.parse(JSON.stringify(cache)))
  assert.deepEqual(restored, cache)
  assert.deepEqual(restored.sessions.s1.lastRoute, { provider: 'p', model: 'm' })

  // 版本不符 / 结构损坏一律退回空缓存
  assert.deepEqual(parseScanCache({ version: 999, sessions: { s1: {} } }).sessions, {})
  assert.deepEqual(parseScanCache(null).sessions, {})
  assert.deepEqual(parseScanCache({ version: SCAN_CACHE_VERSION, sessions: [] }).sessions, {})
  assert.equal(createScanCache().version, SCAN_CACHE_VERSION)

  pruneScanCache(restored, new Set(['s2']))
  assert.deepEqual(Object.keys(restored.sessions), [])
})

test('scanSession carries the route across incremental reads', async () => {
  // 第一批只有 request/header，第二批才是 usage：增量读取必须记住路由
  const log = { cwd: 'W', revision: 'r1', events: [header(0, 1000, 'workbuddy', 'deepseek-v4.1-flash')] }
  const persistence = fakePersistence({ s1: log })
  const cache = createScanCache()
  const first = await scanSessions(persistence, { sessions: [{ header: { id: 's1', cwd: 'W' }, revision: 'r1' }], cache, records: [] })
  commitScanRevisions(cache, first.revisions)
  assert.equal(first.records.length, 0)
  assert.equal(cache.sessions.s1.seq, 0)
  assert.deepEqual(cache.sessions.s1.lastRoute, { provider: 'workbuddy', model: 'deepseek-v4.1-flash' })

  // 故意不给 message.source：provider/model 只能来自上一批记住的 request/header
  const bare = message(1, 2000, 1, 1, { inputTokens: 11 })
  bare.data.message = {}
  log.events.push(bare)
  log.revision = 'r2'
  const second = await scanSessions(persistence, { sessions: [{ header: { id: 's1', cwd: 'W' }, revision: 'r2' }], cache, records: [] })
  assert.equal(second.records.length, 1)
  assert.equal(second.records[0].provider, 'workbuddy')
  assert.equal(second.records[0].model, 'deepseek-v4.1-flash')
})

test('sampleOfEvent also reads usage from assistant/attempt streams (official usageOf parity)', () => {
  // 官方 tokenUsage 投影的 usageOf：assistant/message 顶层 usage 优先，
  // 否则回退 stream 里最后一个 usage chunk（assistant/attempt 也走这条）。
  // 只做前者会漏掉"有 attempt 但顶层没有 usage"的调用，累计值偏小。
  const attempt = {
    type: 'assistant/attempt', seq: 5, time: 1000,
    data: { turn: 2, step: 1, stream: [
      { type: 'chunk', time: 1, chunk: { type: 'text', text: 'x' } },
      { type: 'chunk', time: 2, chunk: { type: 'usage', usage: { inputTokens: 100, outputTokens: 20, cacheReadTokens: 900 } } }
    ] }
  }
  const s = sampleOfEvent(attempt)
  assert.ok(s, 'assistant/attempt 应能取到 usage')
  assert.equal(s.usage.inputTokens, 100)
  assert.equal(s.usage.cacheReadTokens, 900)
  assert.equal(s.turn, 2)
  assert.equal(s.step, 1)

  // 顶层 usage 优先于 stream
  const msg = {
    type: 'assistant/message', seq: 6, time: 2000,
    data: { turn: 3, step: 1, usage: { inputTokens: 1 }, stream: [
      { type: 'chunk', chunk: { type: 'usage', usage: { inputTokens: 999 } } }
    ] }
  }
  assert.equal(sampleOfEvent(msg).usage.inputTokens, 1, '顶层 usage 优先')

  // 没有 usage 的 attempt 返回 null
  assert.equal(sampleOfEvent({ type: 'assistant/attempt', seq: 7, time: 3000, data: { turn: 1, step: 1, stream: [] } }), null)
})

test('last usage chunk in the stream wins', () => {
  // 对应官方 lastAssistantStreamChunk：取"最后一个"
  const ev = {
    type: 'assistant/attempt', seq: 8, time: 4000,
    data: { turn: 1, step: 1, stream: [
      { chunk: { type: 'usage', usage: { inputTokens: 1 } } },
      { chunk: { type: 'text', text: 'a' } },
      { chunk: { type: 'usage', usage: { inputTokens: 2 } } }
    ] }
  }
  assert.equal(sampleOfEvent(ev).usage.inputTokens, 2, '应取最后一个 usage chunk')
})
