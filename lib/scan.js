/**
 * dsh-usage-plugin — 事后扫描（history backfill）纯逻辑层。
 *
 * 本模块不 import cordis、不碰文件系统，便于在 node:test 里用假的
 * sessionPersistence 桩直接验证增量游标、重折叠与去重规则。
 *
 * 两条数据通道（互补，互不覆盖）：
 *   1. 实时探针：lib/index.js 的 llm/stream 监听。字段最全（purpose /
 *      finishReason / reasoningTokens），但只覆盖插件生效之后发生的调用。
 *   2. 事后扫描：经 ctx.sessionPersistence 读取已落盘的事件日志，回填历史。
 *
 * 为什么走后端而不是直接读文件（实测于本机 DSH checkout + 真实日志）：
 *   日志 ~/.dsh/sessions/<workspace>/<session>/session.v3.jsonl.zstd 是**多帧
 *   zstd 拼接**（实测某会话 754161 字节含 478 帧）。Node 的
 *   zlib.zstdDecompressSync 对整文件只解得出首帧（session header，197 字节），
 *   流式解压随后报 "Unknown frame descriptor"；要直读必须自己按魔数
 *   28 B5 2F FD 切帧逐帧解压，并自行处理 v0/v1→v2→v3 事件格式迁移与断尾截断。
 *   这些全部由 dsh-session-persistence-jsonl 承担，所以这里只调服务接口。
 * 已落盘日志只追加、不重写，seq 从 0 连续（seq 即数组下标）。
 *
 * @module dsh-usage-plugin/scan
 */

/** 扫描来源标记：把回填记录与实时探针记录区分开。 */
export const SCAN_ORIGIN = 'scan'

/** 扫描缓存的磁盘版本号，结构不兼容时直接丢弃重建。 */
export const SCAN_CACHE_VERSION = 1

/** 深扫模式下去重的近似时间窗：探针记请求开始时刻，扫描记事件时刻，两者相差几秒。 */
export const OVERLAP_WINDOW_MS = 120000

/**
 * 从一条已落盘事件中提取 usage 样本。
 *
 * 两条字段路径（与 dsh-usage-stats/lib/usage.js 的 sampleOf 同口径）：
 *   - assistant/chunk，且 data.chunk.type === 'usage'：已发布的 v1 格式，
 *     其 usage chunk 在 v1→v2 迁移时被嵌入 assistant/message 的 data.stream。
 *   - assistant/message，且 data.usage：当前 v3 格式（SESSION_FORMAT_VERSION = 3）。
 *
 * 不认 assistant/attempt：它只带 stream，没有顶层 usage。
 * 也没有任何 usage 的中断调用不在这里补记 —— 那是实时探针的职责，
 * 扫描补记会凭空造出重复调用。
 *
 * @param event - 已落盘的 SessionEvent（含 seq / time / data）。
 * @returns usage / turn / step，或 null。
 */
export function sampleOfEvent(event) {
  if (!event || typeof event !== 'object') return null
  const data = event.data
  if (!data || typeof data !== 'object') return null
  if (event.type === 'assistant/chunk') {
    const chunk = data.chunk
    if (chunk && chunk.type === 'usage' && chunk.usage) {
      return { usage: chunk.usage, turn: toIndex(data.turn), step: toIndex(data.step) }
    }
    return null
  }
  if (event.type === 'assistant/message' && data.usage) {
    return { usage: data.usage, turn: toIndex(data.turn), step: toIndex(data.step) }
  }
  return null
}

/** 把 turn/step 归一为非负整数；缺失时用 -1 占位，保证同一会话内不会误合并。 */
function toIndex(value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? n : -1
}

/**
 * 事件的路由归属：provider/model。
 * 优先 assistant/message 的 data.message.source，回退 request/header 的 data.header.config。
 */
export function routeOfEvent(event) {
  const data = event && event.data
  if (!data || typeof data !== 'object') return null
  const source = data.message && data.message.source
  if (source && typeof source.model === 'string' && source.model) {
    return { provider: typeof source.provider === 'string' ? source.provider : '', model: source.model }
  }
  const config = data.header && data.header.config
  if (config && typeof config.model === 'string' && config.model) {
    return { provider: typeof config.provider === 'string' ? config.provider : '', model: config.model }
  }
  return null
}

/** 非负有限数兜底：上游缺字段时记 0，绝不让 NaN 污染合计。 */
function num(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * 一条扫描记录在 records 数组里的唯一键。
 *
 * 扫描记录用 sessionId|turn|step：同一 (turn, step) 的重复上报会原地替换
 * 而不是新增，因此重复扫描同一段日志是幂等的（无需持久化折叠状态）。
 * 拿不到 turn/step 时退化为 sessionId|seq。
 */
export function scanRecordKey(record) {
  const session = String((record && record.sessionId) || '')
  if (!session) return ''
  if (Number.isInteger(record.turn) && record.turn >= 0 && Number.isInteger(record.step) && record.step >= 0) {
    return session + '|' + record.turn + '|' + record.step
  }
  if (Number.isInteger(record.seq) && record.seq >= 0) return session + '|seq' + record.seq
  return session + '|t' + Number(record.time || 0)
}

/**
 * 把一段按 seq 升序的事件归约成 usage 记录。
 *
 * 状态由调用方跨批次保存（state.lastRoute），因此增量读取时
 * request/header 给出的 provider/model 能延续到后续批次。
 *
 * @param events - 事件数组，必须按 seq 升序。
 * @param options.sessionId - 归属会话 id。
 * @param options.state - 可变状态 { lastRoute }，跨批次复用。
 * @returns { records, cursor }，cursor 为本批已消费的最大 seq（inclusive）；
 *   空批次返回 -1，调用方据此保持原游标不变。
 */
export function reduceSessionEvents(events, options = {}) {
  const sessionId = String(options.sessionId || '')
  const state = options.state || (options.state = { lastRoute: null })
  const records = []
  // 已消费的最大 seq。游标用 inclusive 语义：读取起点是游标本身，
  // 因此"日志被重写"可以靠"游标事件是否还在"直接判定。
  let cursor = -1
  for (const event of Array.isArray(events) ? events : []) {
    if (!event || typeof event !== 'object') continue
    const seq = Number(event.seq)
    if (Number.isInteger(seq) && seq > cursor) cursor = seq
    // request/header 是这一轮请求的配置快照，供后续没有 message.source 的样本回退。
    if (event.type === 'request/header') {
      const route = routeOfEvent(event)
      if (route) state.lastRoute = route
    }
    const sample = sampleOfEvent(event)
    if (!sample) continue
    const route = routeOfEvent(event) || state.lastRoute || { provider: '', model: '' }
    // 事件自带 time（SessionFormatEvent.time 是必填毫秒时间戳）。
    const time = Number(event.time)
    records.push({
      time: Number.isFinite(time) && time > 0 ? time : Date.now(),
      model: String(route.model || ''),
      provider: String(route.provider || ''),
      // 扫描拿不到 llm/stream 的 options，用途分类与结束原因只能留空。
      purpose: '',
      sessionId,
      seq: Number.isInteger(seq) ? seq : -1,
      turn: sample.turn,
      step: sample.step,
      inputTokens: num(sample.usage.inputTokens),
      outputTokens: num(sample.usage.outputTokens),
      cacheReadTokens: num(sample.usage.cacheReadTokens),
      // DeepSeek 系 provider 不单独上报 cacheWrite；与探针保持同一兜底口径。
      cacheWriteTokens: num(sample.usage.cacheWriteTokens) || num(sample.usage.inputTokens),
      reasoningTokens: num(sample.usage.reasoningTokens),
      finishReason: '',
      interrupted: false,
      origin: SCAN_ORIGIN
    })
  }
  return { records, cursor }
}

/**
 * 合并扫描结果到现有 records。
 *
 * 三条规则：
 *   1. 扫描记录按 scanRecordKey 原地替换 -> 同一段日志重复扫描不产生副本。
 *   2. 探针记录（无 origin 标记）默认永不被扫描记录覆盖。
 *   3. 深扫模式下，同会话、同 model、时间差落在 OVERLAP_WINDOW_MS 内的探针记录
 *      视为同一次调用，由扫描记录吸收，但保留探针独有的字段。
 *
 * @param existing - 现有 records 数组（就地修改）。
 * @param incoming - 本次扫描产出的记录。
 * @param options.deep - 是否对探针已覆盖的会话做时间窗去重。
 * @returns { added, replaced, absorbed }
 */
export function mergeScannedRecords(existing, incoming, options = {}) {
  const deep = options.deep === true
  const stats = { added: 0, replaced: 0, absorbed: 0 }
  // 已有扫描记录键 -> 下标；探针记录按会话分组，供深扫做时间窗匹配。
  const scanIndex = new Map()
  const probeBySession = new Map()
  for (let i = 0; i < existing.length; i++) {
    const record = existing[i]
    if (record && record.origin === SCAN_ORIGIN) {
      const key = scanRecordKey(record)
      if (key) scanIndex.set(key, i)
      continue
    }
    const sid = String((record && record.sessionId) || '')
    if (!sid) continue
    let bucket = probeBySession.get(sid)
    if (!bucket) probeBySession.set(sid, (bucket = []))
    bucket.push(i)
  }
  for (const record of Array.isArray(incoming) ? incoming : []) {
    if (!record) continue
    const sid = String(record.sessionId || '')
    if (deep) {
      const bucket = probeBySession.get(sid)
      if (bucket && bucket.length > 0) {
        const hit = bucket.find((i) => sameCall(existing[i], record))
        if (hit !== undefined) {
          // 保留探针的 purpose / finishReason / reasoningTokens / interrupted，
          // 其余（含 turn/step/seq 与时间）以日志为准。
          const probe = existing[hit]
          existing[hit] = {
            ...record,
            purpose: probe.purpose || record.purpose,
            finishReason: probe.finishReason || record.finishReason,
            reasoningTokens: record.reasoningTokens || probe.reasoningTokens || 0,
            interrupted: !!probe.interrupted
          }
          probeBySession.set(sid, bucket.filter((i) => i !== hit))
          stats.absorbed++
          continue
        }
      }
    }
    const key = scanRecordKey(record)
    const at = key ? scanIndex.get(key) : undefined
    if (at !== undefined) {
      existing[at] = record
      stats.replaced++
      continue
    }
    if (key) scanIndex.set(key, existing.length)
    existing.push(record)
    stats.added++
  }
  existing.sort((a, b) => Number(a.time || 0) - Number(b.time || 0))
  return stats
}

/** 判断一条探针记录与一条扫描记录是否指向同一次模型调用（近似）。 */
function sameCall(probe, scanned) {
  if (!probe || typeof probe !== 'object') return false
  if (String(probe.model || '') !== String(scanned.model || '')) return false
  const a = Number(probe.time || 0)
  const b = Number(scanned.time || 0)
  if (!a || !b) return false
  return Math.abs(a - b) <= OVERLAP_WINDOW_MS
}

/**
 * 已被实时探针覆盖的会话 id 集合。默认扫描会跳过这些会话：
 * 插件生效之后的调用探针已逐条记录，再扫一遍日志必然双计
 * （探针记请求开始时刻、扫描记事件时刻，相差数秒；且探针记录没有 turn/step
 * 可供精确对齐）。跳过是零误伤的做法；需要合并时用深扫。
 */
export function probeCoveredSessions(records) {
  const ids = new Set()
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || record.origin === SCAN_ORIGIN) continue
    const sid = String(record.sessionId || '')
    if (sid) ids.add(sid)
  }
  return ids
}

/** 空扫描缓存。 */
export function createScanCache() {
  return { version: SCAN_CACHE_VERSION, sessions: {} }
}

/** 容错解析磁盘上的扫描缓存；任何异常都退回空缓存。 */
export function parseScanCache(raw) {
  const cache = createScanCache()
  if (!raw || typeof raw !== 'object' || raw.version !== SCAN_CACHE_VERSION) return cache
  const sessions = raw.sessions
  if (!sessions || typeof sessions !== 'object' || Array.isArray(sessions)) return cache
  for (const [id, entry] of Object.entries(sessions)) {
    if (!id || !entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    cache.sessions[id] = {
      revision: typeof entry.revision === 'string' ? entry.revision : '',
      // -1 表示这个会话从未被扫描过（与"扫过但还没消费任何事件"区分开）。
      seq: Number.isSafeInteger(entry.seq) && entry.seq >= -1 ? entry.seq : -1,
      // lastRoute 让增量读取时 provider/model 归属能跨批次延续。
      lastRoute: entry.lastRoute && typeof entry.lastRoute === 'object'
        ? { provider: String(entry.lastRoute.provider || ''), model: String(entry.lastRoute.model || '') }
        : null
    }
  }
  return cache
}

/** 打开一个只读句柄，兼容当前 open(id,'read') 与旧版 readFrom()。 */
async function openReader(persistence, id) {
  if (typeof persistence.open === 'function') {
    const handle = await persistence.open(id, 'read')
    return {
      async read(fromSeq) {
        const result = await handle.read(fromSeq)
        return Array.isArray(result && result.events) ? result.events : []
      },
      async close() {
        // 读句柄只占本地资源：释放失败也不能覆盖已读到的数据。
        try { await handle.close() } catch (e) {}
      }
    }
  }
  return {
    async read(fromSeq) {
      const result = await persistence.readFrom(id, fromSeq)
      return Array.isArray(result && result.events) ? result.events : []
    },
    async close() {}
  }
}

/**
 * 枚举持久化会话快照，兼容 list() 与旧版 listSnapshots()。
 * 不同版本返回形状不一致：当前是 { header, revision }，旧版是裸 header。
 * @returns 规范化后的 { header, revision } 数组；无法枚举时返回 null。
 */
export async function listStoredSessions(persistence) {
  const normalize = (entry) => ({
    header: entry && typeof entry === 'object' ? (entry.header || entry) : entry,
    revision: typeof (entry && entry.revision) === 'string' ? entry.revision : ''
  })
  if (typeof persistence.listSnapshots === 'function') {
    try { return (await persistence.listSnapshots()).map(normalize) } catch (e) { /* 降级到 list() */ }
  }
  try {
    return (await persistence.list()).map(normalize)
  } catch (e) {
    return null
  }
}

/**
 * 只扫描一个会话的增量区间。
 *
 * 折叠判定与 dsh-usage-stats 同口径：
 *   - 游标处的事件已不在返回结果里（日志被截断/重写）-> 从 seq 0 重扫。
 *   - 增量的首事件 seq 与游标不连续 -> 从 seq 0 重扫。
 *
 * 重扫不会双计：scanRecordKey 取 (sessionId, turn, step)，重扫产出的记录
 * 会在合并阶段原地替换旧记录，因此无需持久化折叠状态也能保证幂等。
 *
 * @returns { records, scanned }
 */
export async function scanSession(persistence, id, entry, options = {}) {
  const reader = await openReader(persistence, id)
  try {
    // 首次扫描（seq 为 -1）从 0 读全量；之后从游标读增量。
    const firstScan = !Number.isSafeInteger(entry.seq) || entry.seq < 0
    const cursor = firstScan ? 0 : entry.seq
    const tail = await reader.read(cursor)
    // 读取起点是闭区间，所以要滤掉游标事件本身；首次扫描不滤。
    const fresh = firstScan ? tail : tail.filter((event) => Number(event.seq) > cursor)
    // 空增量时，游标事件仍在返回结果里才算"未重写"——日志被截断/重写会让它消失。
    const contiguous = fresh.length === 0
      ? firstScan || tail.some((event) => Number(event.seq) === cursor)
      : Number(fresh[0].seq) === cursor + 1
    let events = fresh
    if (!firstScan && !contiguous) events = await reader.read(0)
    if (events.length === 0) return { records: [], scanned: false }
    const state = { lastRoute: entry.lastRoute || null }
    const result = reduceSessionEvents(events, { sessionId: id, state })
    entry.lastRoute = state.lastRoute
    entry.seq = result.cursor
    return { records: result.records, scanned: true }
  } finally {
    await reader.close()
  }
}

/**
 * 扫描一批会话，返回待合并的记录。
 *
 * @param options.sessions - { header, revision } 快照数组。
 * @param options.cache - 扫描缓存（就地更新）。
 * @param options.records - 现有全量记录，用于计算探针已覆盖的会话。
 * @param options.cwd - 只扫该工作区（会话 header.cwd 精确匹配）；为空表示全扫。
 * @param options.deep - 深扫：连探针已覆盖的会话也扫，并做时间窗去重。
 * @param options.limit - 单次最多处理的会话数，避免首扫阻塞过久。
 * @param options.onError - 单个会话读失败时的回调。
 */
export async function scanSessions(persistence, options = {}) {
  const sessions = Array.isArray(options.sessions) ? options.sessions : []
  const cache = options.cache || createScanCache()
  const covered = options.deep === true ? new Set() : probeCoveredSessions(options.records)
  const cwd = options.cwd ? String(options.cwd) : ''
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : Infinity
  const out = []
  const stats = { total: 0, scanned: 0, skipped: 0, failed: 0, covered: 0, pending: 0 }
  // 只登记本次真正读完的会话：中途失败或超限的下一轮重新处理。
  const revisions = {}
  for (const snapshot of sessions) {
    const header = snapshot && snapshot.header
    const id = String((header && header.id) || '')
    if (!id) continue
    if (cwd && String(header.cwd || '') !== cwd) continue
    stats.total++
    if (covered.has(id)) { stats.covered++; continue }
    const entry = cache.sessions[id] || (cache.sessions[id] = { revision: '', seq: -1, lastRoute: null })
    // 后端给了 revision 且与缓存一致 -> 一次读都不发。
    // 后端不给 revision（空串，例如未落盘或旧版后端）-> 每轮读游标处，
    // 靠增量结果与"游标事件是否仍在"判定未变化，成本是一次按需读取。
    if (entry.revision !== '' && snapshot.revision !== '' && snapshot.revision === entry.revision) {
      stats.skipped++
      continue
    }
    if (stats.scanned >= limit) { stats.pending++; continue }
    try {
      const result = await scanSession(persistence, id, entry, options)
      stats.scanned++
      out.push(...result.records)
      // 读完才滚动 revision；游标 entry.seq 会在下一轮从磁盘缓存恢复。
      revisions[id] = snapshot.revision
    } catch (error) {
      stats.failed++
      if (typeof options.onError === 'function') options.onError(id, error)
    }
  }
  return { records: out, stats, revisions }
}

/** 全部会话处理完后才提交 revision。 */
export function commitScanRevisions(cache, revisions) {
  for (const [id, revision] of Object.entries(revisions || {})) {
    const entry = cache.sessions[id]
    if (entry && typeof revision === 'string' && revision !== '') entry.revision = revision
  }
  return cache
}

/** 丢弃缓存中已不存在的会话，避免缓存无限增长。 */
export function pruneScanCache(cache, liveIds) {
  const keep = liveIds instanceof Set ? liveIds : new Set(liveIds || [])
  for (const id of Object.keys(cache.sessions)) if (!keep.has(id)) delete cache.sessions[id]
  return cache
}
