/** 记录归一化不猜测历史错误；缓存写入仅由真实日志或明确迁移证据修正。 */
export function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null
  const time = Number(raw.time)
  if (!Number.isFinite(time) || time <= 0) return null
  const rec = { time }
  for (const key of ['model', 'provider', 'purpose', 'sessionId', 'finishReason', 'fxDate']) rec[key] = String(raw[key] || '')
  for (const key of ['inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens', 'usdCnyRate']) {
    const n = Number(raw[key])
    rec[key] = Number.isFinite(n) && n > 0 ? n : 0
  }
  rec.interrupted = !!raw.interrupted
  for (const key of ['origin', 'recordId']) if (typeof raw[key] === 'string' && raw[key]) rec[key] = raw[key]
  for (const key of ['seq', 'turn', 'step', 'slotSeq']) if (Number.isSafeInteger(raw[key]) && raw[key] >= 0) rec[key] = raw[key]
  if (Number.isFinite(raw.pricingTime) && raw.pricingTime > 0) rec.pricingTime = raw.pricingTime
  return rec
}

/** 新探针使用 UUID；旧记录用完整身份与用量指纹，不能只按毫秒去重。 */
export function recordKey(r) {
  if (r.recordId) return 'id:' + r.recordId
  if (r.origin === 'scan' && Number.isSafeInteger(r.seq)) return JSON.stringify(['scan', r.sessionId, r.seq])
  return JSON.stringify([r.sessionId || '', r.time, r.provider, r.model, r.purpose || '',
    r.inputTokens || 0, r.outputTokens || 0, r.cacheReadTokens || 0, r.cacheWriteTokens || 0,
    r.reasoningTokens || 0, r.finishReason || '', !!r.interrupted])
}
