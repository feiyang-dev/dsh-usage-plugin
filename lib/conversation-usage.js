import { reduceSessionEvents } from './scan.js'

/** 按宿主 tokenUsage 投影折叠：同一次结算可替换，重试开始后必须另计。 */
export function foldConversationUsage(events, sessionId) {
  const samples = new Map(reduceSessionEvents(events, { sessionId }).records.map((r) => [r.seq, r]))
  const records = []
  let last = null
  for (const event of events) {
    if (event.type === 'llm/retry-started') {
      if (last && last.turn === event.data.turn && last.step === event.data.step) last = null
      continue
    }
    // 与当前宿主一致，仅统计落盘的 assistant 结算，不混入标题等辅助请求。
    if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') continue
    const record = samples.get(event.seq)
    if (!record) continue
    if (last && last.turn === record.turn && last.step === record.step) {
      records[last.index] = record
    } else {
      last = { turn: record.turn, step: record.step, index: records.length }
      records.push(record)
    }
  }
  return records
}

/** 面板独立读取完整日志，不受实时探针覆盖标记、扫描游标或历史缓存缺失影响。 */
export async function readConversationUsage(persistence, sessionId) {
  if (!sessionId) throw new Error('缺少会话 ID')
  if (!persistence) throw new Error('会话持久化服务不可用')
  let handle
  try {
    let result
    if (typeof persistence.open === 'function') {
      handle = await persistence.open(sessionId, 'read')
      result = await handle.read(0)
    } else if (typeof persistence.readFrom === 'function') {
      result = await persistence.readFrom(sessionId, 0)
    } else {
      throw new Error('会话持久化服务不支持读取')
    }
    const events = Array.isArray(result) ? result : result?.events
    if (!Array.isArray(events)) throw new Error('会话日志读取结果无效')
    return foldConversationUsage(events, sessionId)
  } finally {
    if (handle) await handle.close()
  }
}
