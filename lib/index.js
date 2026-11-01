/**
 * dsh-usage-plugin — HOST half.
 *
 * Permanent Cordis plugin for a DeepSeek Harness web/desktop profile:
 *  - listens to `llm/stream`, records every model call's token usage,
 *    cache-hit/miss counts and finish reason;
 *  - persists records to a FIXED dedicated data directory (see resolveDataRoot),
 *  - serves a JSON API at `POST /usage/api` for the client half.
 *
 * The apply body is instrumented: every step is appended to a diagnostics
 * buffer and flushed to `dsh-usage-boot.log` (resolved relative to the fs
 * provider cwd) so activation failures are visible without app logs.
 *
 * Cross-platform note: path handling uses node:path (join / dirname) with the
 * host platform's separator, so the plugin works on Windows, macOS and Linux.
 */
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { promises as fsp, existsSync } from 'node:fs'
import {
  getBalanceProvider,
  matchesModelProvider,
  parseBalanceResponse,
  providerList,
  missingCredentialError,
  resolveBalanceEndpoint
} from './balance.js'
import { normalizeRecord, recordKey } from './records.js'
import { atomicWriteText, readStoredRecords } from './storage.js'

// 插件自身版本号：直接读 package.json，不在代码里再写死一份——否则发版时
// 很容易出现"面板显示 1.18.0、实际跑的是 1.20.0"这种排查事故。
// 客户端顶部用它展示当前运行的版本。
const PKG_META = (() => {
  try {
    return createRequire(import.meta.url)('../package.json') || {}
  } catch (e) {
    return {}
  }
})()
export const PLUGIN_VERSION = String(PKG_META.version || '')
export const PLUGIN_NAME = String(PKG_META.name || '')

// 周末统一按空闲价计费规则生效时间：北京时间 2026-08-23 00:00（周日）。
// 生效前（含周末）仍按原峰谷分段计费；生效后周末（周六、周日）全天统一按空闲价，工作日仍按峰谷分段。
export const WEEKEND_FLAT_AT = Date.parse('2026-08-23T00:00:00+08:00')

// 法定节假日规则生效时刻：北京时间 2026-11-01 00:00。
// 官方价目页（2026-11-01 核对）写明高峰时段是「周一至周五（不含中国法定节假日）」，
// 此前本插件只处理了周末、没处理节假日。为了**不改写历史账单**，这条规则只对
// 该时刻之后的调用生效；此前已产生的记录继续按当时实现的规则计费。
export const HOLIDAY_RULE_AT = Date.parse('2026-11-01T00:00:00+08:00')

// 国务院办公厅《关于 2026 年部分节假日安排的通知》公布的放假日期（含调休连休段）。
// 只列「放假」日；调休上班的周末（如 2/14、5/9）按官方口径仍属周末 → 空闲价。
export const HOLIDAYS_2026 = Object.freeze([
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-09-25', '2026-09-26', '2026-09-27',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'
])

/** 把 ts 换算成北京时间的 `YYYY-MM-DD`（节假日表用这个键）。 */
export function bjDayKeyOf(ts) {
  const d = new Date(Number(ts) + 8 * 3600 * 1000)
  const pad = (n) => (n < 10 ? '0' : '') + n
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())
}

/**
 * 高峰时段判定。
 *
 * 规则（官方价目页）：
 *   - 2026-08-23 起：周末（周六、周日）全天按空闲价；
 *   - 2026-11-01 起：法定节假日全天按空闲价（`holidays` 为北京日期键集合）；
 *   - 其余时间按北京时间 9:00–12:00、14:00–18:00 为高峰。
 *
 * 星期取自平移后的北京时间（ts + 8h），避免 UTC 日历与北京日历在 16:00–24:00 UTC 段错位。
 * 导出为独立函数，供 test/period.test.js 做回归测试（issue #9）。
 *
 * @param ts - 计费时刻（毫秒）。
 * @param holidays - 可选，法定节假日日期键（Set 或数组），如 `new Set(['2027-01-01'])`。
 */
export function isPeakAt(ts, holidays) {
  const d = new Date(ts + 8 * 3600 * 1000)
  const wd = d.getUTCDay() // 0=周日 1=周一 … 6=周六
  if (ts >= WEEKEND_FLAT_AT && (wd === 0 || wd === 6)) return false
  if (ts >= HOLIDAY_RULE_AT && holidays) {
    const key = bjDayKeyOf(ts)
    const isHoliday = typeof holidays.has === 'function' ? holidays.has(key) : Array.isArray(holidays) && holidays.indexOf(key) >= 0
    if (isHoliday) return false
  }
  const t = d.getUTCHours() * 60 + d.getUTCMinutes()
  return (t >= 9 * 60 && t < 12 * 60) || (t >= 14 * 60 && t < 18 * 60)
}

// 官方价格表分段生效时间（北京时间）：
//  - 2026-08-17 00:00：旧基础价（base）→ 第一版峰谷价（peakValley）。
//  - 2026-09-10 12:00：DeepSeek V4.1 Flash 调价生效，峰谷价切换到新版
//    （peakValleyV41：deepseek-flash 单价下调；deepseek-v4-pro 价格不变）。
// 导出为独立常量，供 test/pricing.test.js 做回归测试。
export const PEAK_VALLEY_AT = Date.parse('2026-08-17T00:00:00+08:00')
export const V41_EFFECTIVE_AT = Date.parse('2026-09-10T12:00:00+08:00')

// ── DeepSeek 官方价格表（单位：元 / 百万 tokens）──────────────────────
// 按生效时间分三段：
//   base          —— 旧基础价（2026-08-17 00:00 之前）
//   peakValley    —— 第一版峰谷价（2026-08-17 00:00 ~ 2026-09-10 12:00）
//   peakValleyV41 —— DeepSeek V4.1 Flash 调价后的峰谷价（2026-09-10 12:00 起）
// 模型档位按官方新命名归并：
//   deepseek-flash   ← deepseek-flash / deepseek-v4-flash / deepseek-v4-flash-vision-exp
//   deepseek-v4-pro  ← deepseek-v4-pro（V4 Pro 计价方式不变）
// 导出为工厂函数：每次 apply() 取一份独立副本，价格可被 loadPricing / setPrices 单独改写。
export const PRICE_REGIMES = ['base', 'peakValley', 'peakValleyV41']
export const PRICE_MODELS = ['deepseek-flash', 'deepseek-v4-pro']
export function defaultPricing() {
  return {
    base: {
      'deepseek-flash': { cacheHit: 0.02, cacheMiss: 1.0, output: 2.0 },
      'deepseek-v4-pro': { cacheHit: 0.025, cacheMiss: 3.0, output: 6.0 }
    },
    peakValley: {
      'deepseek-flash': {
        offPeak: { cacheHit: 0.05, cacheMiss: 1.5, output: 4.5 },
        peak: { cacheHit: 0.1, cacheMiss: 3.0, output: 9.0 }
      },
      'deepseek-v4-pro': {
        offPeak: { cacheHit: 0.15, cacheMiss: 4.5, output: 13.5 },
        peak: { cacheHit: 0.3, cacheMiss: 9.0, output: 27.0 }
      }
    },
    peakValleyV41: {
      'deepseek-flash': {
        offPeak: { cacheHit: 0.02, cacheMiss: 1.0, output: 4.0 },
        peak: { cacheHit: 0.04, cacheMiss: 2.0, output: 8.0 }
      },
      'deepseek-v4-pro': {
        offPeak: { cacheHit: 0.15, cacheMiss: 4.5, output: 13.5 },
        peak: { cacheHit: 0.3, cacheMiss: 9.0, output: 27.0 }
      }
    }
  }
}

// 模型 → 计费档位。官方新命名 deepseek-flash 与两个旧名
// （deepseek-v4-flash / deepseek-v4-flash-vision-exp，仍可调用且已路由到
// V4.1 Flash 并按 Flash 单价计费）统一归并到 deepseek-flash 档位。
export function modelKeyOf(model) {
  const m = String(model || '').toLowerCase()
  if (m.indexOf('vision') >= 0) return 'deepseek-flash'
  if (m.indexOf('flash') >= 0) return 'deepseek-flash'
  if (m.indexOf('pro') >= 0) return 'deepseek-v4-pro'
  return 'unknown'
}

/**
 * 该 provider id 是否走 DeepSeek 官方价目。
 *
 * 官方一直在往 provider id 里加后缀：`deepseek`、`deepseek-official`，桌面端
 * 官方账号那一路叫 `deepseek-account`（issue #19）。此前这里用两个字面量做白名单，
 * 于是 `deepseek-account` 的每一条记录都被判成"未知 provider"：费用恒为 ¥0，
 * 也从不冻结单价（概览页的"历史价格提示"条数等于记录总数）。
 *
 * 统一按前缀判定后，任何 `deepseek-*` 都按 DeepSeek 官方价目计费；第三方
 * （siliconflow / digitalocean / amd / 千问）在各自分支里先行返回，不受影响。
 *
 * @param id - 记录或请求里的 provider id。
 * @returns 是否按 DeepSeek 官方价目计费。
 */
export function isDeepseekProvider(id) {
  const p = String(id || '').trim().toLowerCase()
  return p === 'deepseek' || p.indexOf('deepseek-') === 0
}

// 某时刻生效的峰谷价表：V4.1 调价前用第一版，调价后用新版。
export function peakValleyTableOf(pricing, ts) {
  return ts >= V41_EFFECTIVE_AT ? pricing.peakValleyV41 : pricing.peakValley
}

/**
 * 用"记录自带的冻结单价"算一笔费用（元）。纯函数，导出以便直接单测。
 *
 * 这是"改价格表不改写历史"这条规则的核心：入参只有记录自己的快照和四桶用量，
 * 完全读不到当前价格表，因此同一份记录在任何时刻、任何价格表下都得到同一个金额。
 *
 * @param unit - 冻结单价 `{ hit, miss, out }`（元 / 百万 tokens）。
 * @param hit - 缓存命中 token。
 * @param miss - 未命中输入 token。
 * @param out - 输出 token。
 * @returns 费用（元）；没有可用快照时返回 null，由调用方回落到当前价格表。
 */
export function costFromUnit(unit, hit, miss, out) {
  if (!unit || typeof unit !== 'object') return null
  // 至少要有一个可用的单价才算"有快照"；缺的按 0 处理（与 normalizeRecord 的
  // 接受规则一致，避免同一份数据在两处得到不同的"是否有快照"判断）。
  const hasAny = [unit.hit, unit.miss, unit.out].some((n) => Number.isFinite(n))
  if (!hasAny) return null
  return (Number(hit || 0) * (Number(unit.hit) || 0)
    + Number(miss || 0) * (Number(unit.miss) || 0)
    + Number(out || 0) * (Number(unit.out) || 0)) / 1e6
}

export default {
  inject: ['fs', 'webServer', 'subprocess', 'credentials', 'settings', 'sandboxPolicy', 'agents'],
  apply(ctx) {
    const diag = { ok: true, steps: [], error: null }
    const push = (s) => { try { diag.steps.push(String(s)) } catch (e) {} }
    const flushDiag = () => {
      try {
        const fs = ctx.get('fs')
        if (fs && typeof fs.resolve === 'function' && typeof fs.writeText === 'function') {
          fs.resolve('dsh-usage-boot.log')
            .then((target) => fs.writeText(target, JSON.stringify({ time: Date.now(), ...diag }, null, 2)))
            .catch(() => {})
        }
      } catch (e) {}
    }
    try {
      push('apply-start')

      const records = []
      const MAX_RECORDS = 100000

      // 本实例私有的价格表副本（模块级 defaultPricing() 定义见文件顶部）。
      const PRICING = defaultPricing()
      const DEFAULT_PRICING = JSON.parse(JSON.stringify(PRICING))
      // 一条记录在其发生时刻应使用的峰谷价表：V4.1 调价前用第一版，调价后用新版。
      function peakValleyTableAt(ts) {
        return peakValleyTableOf(PRICING, ts)
      }
      const SILICONFLOW_PRICING = {
        'deepseek-ai/deepseek-v4-flash': { cacheHit: 0.02, cacheMiss: 1.0, output: 2.0 },
        'deepseek-ai/deepseek-v4-pro': { cacheHit: 1.0, cacheMiss: 12.0, output: 24.0 },
        'deepseek-ai/deepseek-v3.2': { cacheHit: 0.4, cacheMiss: 4.0, output: 6.0 },
        'pro/deepseek-ai/deepseek-v3.2': { cacheHit: 0.4, cacheMiss: 4.0, output: 6.0 },
        'qwen/qwen3.6-27b': { cacheHit: 3.0, cacheMiss: 3.0, output: 18.0 }
      }
      const DIGITALOCEAN_PRICING = {
        flash: { cacheHit: 0.028, cacheMiss: 0.112, output: 0.224 },
        pro: { cacheHit: 0.348, cacheMiss: 1.392, output: 2.784 },
        v32: { cacheHit: 0.15, cacheMiss: 0.425, output: 1.36 }
      }
      let FX = { rate: 0, inverse: 0, date: '', queriedAt: 0, source: 'Frankfurter', stale: false, error: '' }
      // 第一版峰谷价生效时间：北京时间 2026-08-17 00:00（模块级常量，见文件顶部）。
      // 在此之前的调用按旧价格表（基础价 base）计费；之后按峰谷价计费，
      // 2026-09-10 12:00 起再切到 V4.1 调价后的峰谷价表（见 peakValleyTableAt）。
      const EFFECTIVE_AT = PEAK_VALLEY_AT

      // 法定节假日：默认用内置的 2026 年放假日期，可在 pricing.json 里用
      // `holidays: ["2027-01-01", ...]` 覆盖——官方公布新一年安排后不必升级插件。
      let HOLIDAYS = new Set(HOLIDAYS_2026)
      // 高峰/空闲判定使用模块级 isPeakAt（含周末 / 节假日规则与生效时间保护；
      // 实现见文件顶部导出，供回归测试）
      const isPeak = (ts) => isPeakAt(ts, HOLIDAYS)

      // 模型 → 计费档位（纯函数，实现见文件顶部 modelKeyOf 导出）。
      const modelKey = modelKeyOf

      /**
       * 取"此刻生效"的三个单价，供记录落库时冻结使用（元 / 百万 tokens）。
       *
       * 为什么必须在记录里冻结：价格表是可实时修改的（`setPrices` 接口或直接改
       * `pricing.json`）。若历史费用始终用"当前价"重算，用户改一次价就会把所有
       * 过去的消耗都改写成新价——而那些调用的真实账单早已按当时的价结清。
       * 冻结快照后，改价只影响"之后产生的记录"；要重算历史必须显式发起。
       *
       * @param model - 模型名（可含 provider 前缀）。
       * @param provider - provider id。
       * @param at - 计费时刻（毫秒）。
       * @returns `{ hit, miss, out, table }`；该 provider/模型没有可信价目时返回 null。
       */
      function unitSnapshotOf(model, provider, at) {
        const prov = String(provider || '').trim().toLowerCase()
        const mdl = String(model || '').trim().toLowerCase()
        if (prov === 'siliconflow') {
          const p = SILICONFLOW_PRICING[mdl]
          return p ? { hit: p.cacheHit, miss: p.cacheMiss, out: p.output, table: 'siliconflow' } : null
        }
        if (prov === 'digital-ocean' || prov === 'digitalocean') {
          let p = null
          if (mdl.indexOf('v3.2') >= 0 || mdl.indexOf('v3-2') >= 0) p = DIGITALOCEAN_PRICING.v32
          else if (mdl.indexOf('pro') >= 0) p = DIGITALOCEAN_PRICING.pro
          else if (mdl.indexOf('flash') >= 0) p = DIGITALOCEAN_PRICING.flash
          return p ? { hit: p.cacheHit, miss: p.cacheMiss, out: p.output, table: 'digitalocean' } : null
        }
        if (!isDeepseekProvider(prov)) return null
        const mk = modelKey(mdl)
        if (at < EFFECTIVE_AT) {
          const p = PRICING.base[mk]
          return p ? { hit: p.cacheHit, miss: p.cacheMiss, out: p.output, table: 'base' } : null
        }
        const table = peakValleyTableAt(at)[mk]
        if (!table) return null
        const p = isPeak(at) ? table.peak : table.offPeak
        return {
          hit: p.cacheHit,
          miss: p.cacheMiss,
          out: p.output,
          table: at >= V41_EFFECTIVE_AT ? 'peakValleyV41' : 'peakValley'
        }
      }

      // Third-party providers are priced only when a verified provider/model
      // mapping exists. Unknown mappings deliberately remain zero rather than
      // inheriting DeepSeek prices from a similar model name.
      function costFor(rec, regime) {
        const provider = String(rec.provider || '').trim().toLowerCase()
        const model = String(rec.model || '').trim().toLowerCase()
        const hit = rec.cacheReadTokens || 0
        const miss = rec.inputTokens || 0
        const out = rec.outputTokens || 0

        // auto 档 = 实际计费口径：记录自带冻结单价时一律用它，历史费用不随价格表
        // 变化。旧记录（无快照）退回下面的"按当前价格表计算"分支，由 UI 提示。
        if (regime === 'auto') {
          const frozen = costFromUnit(rec.unit, hit, miss, out)
          if (frozen !== null) {
            if (provider === 'digital-ocean' || provider === 'digitalocean') {
              const fxRate = Number((rec.unit && rec.unit.fx) || rec.usdCnyRate || FX.rate || 0)
              return fxRate > 0 ? frozen * fxRate : 0
            }
            return frozen
          }
        }

        if (provider === 'siliconflow') {
          const p = SILICONFLOW_PRICING[model]
          if (!p) return 0
          return (hit * p.cacheHit + miss * p.cacheMiss + out * p.output) / 1e6
        }

        if (provider === 'digital-ocean' || provider === 'digitalocean') {
          let p = null
          if (model.indexOf('v3.2') >= 0 || model.indexOf('v3-2') >= 0) p = DIGITALOCEAN_PRICING.v32
          else if (model.indexOf('pro') >= 0) p = DIGITALOCEAN_PRICING.pro
          else if (model.indexOf('flash') >= 0) p = DIGITALOCEAN_PRICING.flash
          if (!p) return 0
          const rate = Number(rec.usdCnyRate || FX.rate || 0)
          if (!(rate > 0)) return 0
          return ((hit * p.cacheHit + miss * p.cacheMiss + out * p.output) / 1e6) * rate
        }

        if (provider === 'amd' || provider === 'amd-gpu-cloud' || provider === 'alibaba' || provider === 'aliyun' || provider === 'qwen') return 0
        if (!isDeepseekProvider(provider)) return 0

        const mk = modelKey(rec.model)
        // 取价时刻：优先 pricingTime（记录产生时冻结的计费时刻）。旧记录没有该字段，
        // 自动退回 time，行为不变。这样历史 / 回填 / 导入的记录不会被后续调价改写费用。
        const pricedAt = rec.pricingTime || rec.time
        // base：固定按旧基础价；auto：记录发生在 2026-08-17 之前的按旧基础价，
        // 之后按该时刻对应的峰谷价表（peakValley / peakValleyV41）。
        if (regime === 'base' || (regime === 'auto' && pricedAt < EFFECTIVE_AT)) {
          const p = PRICING.base[mk]
          if (!p) return 0
          return (hit * p.cacheHit + miss * p.cacheMiss + out * p.output) / 1e6
        }
        const pv = peakValleyTableAt(pricedAt)[mk]
        if (!pv) return 0
        const p = isPeak(pricedAt) ? pv.peak : pv.offPeak
        return (hit * p.cacheHit + miss * p.cacheMiss + out * p.output) / 1e6
      }

      // 过滤内部/占位调用（如 harness 内部 dsh2shell-* + model "fake"）：
      // 这些不是用户调用的 API 服务商，不出现在用量明细 / 消耗明细 / 日历统计里。
      function isRealCall(rec) {
        const model = String(rec.model || '').trim().toLowerCase()
        const provider = String(rec.provider || '').trim().toLowerCase()
        if (!model || model === 'fake' || model === 'unknown') return false
        if (!provider || provider === 'unknown') return false
        // 内部 agent/工具路由（dsh2shell-* 等）不计入用户可见明细
        if (provider.indexOf('dsh') === 0) return false
        return true
      }

      /**
       * 搜索后端调用的输入侧 token **下限**估算。
       *
       * 只从"插件确实看得到"的东西推：请求体本身（prompt 文本 + tools 定义）。
       * 这是下限而不是估计值——搜索后端会在服务端把检索结果注入上下文，并可能
       * 自行多轮生成，这些 token 在插件侧完全不可观测，所以真实输入一定不小于
       * 这里的值。输出侧一律记 0，不编数字。
       *
       * @param body - `web/deepseek-search-llm-request` 事件里的请求体。
       * @returns 估算的下限 token 数。
       */
      function estimateSearchInputTokens(body) {
        let text = ''
        try { text = JSON.stringify(body || {}) } catch (e) { return 0 }
        return Math.ceil(text.length / 4)
      }

      /**
       * 记录一次 DeepSeek 搜索后端（`web_search`）调用：只计次 + 输入下限。
       *
       * 为什么只能这样：`web-search-deepseek` 用原生 fetch 直连
       * `api.deepseek.com/anthropic/v1/messages`，刻意绕开 `ctx.llm`，而且上游
       * 只把请求写进 session（`web/deepseek-search-llm-request`），响应的 usage
       * 被整个丢弃（其 `AnthropicResponse` 类型里根本没有 usage 字段）。这部分
       * 真实计费没有任何数据源可以取到，因此记录一律带 `estimated: true`，
       * 由 UI 与导出显式区分，绝不当成实测值。
       *
       * @param session - 触发该请求的会话。
       * @param event - 已落盘的 session 事件。
       */
      function recordSearchBackendCall(session, event) {
        const data = (event && event.data) || {}
        const endpoint = String(data.endpoint || '')
        // 只认 DeepSeek 官方端点：其它 endpoint 的价目无从得知，不臆测。
        if (endpoint.indexOf('api.deepseek.com') < 0) return
        const body = (data && data.body) || {}
        const model = String(body.model || '')
        const tools = Array.isArray(body.tools) ? body.tools : []
        const maxUses = Number(tools[0] && tools[0].max_uses)
        const at = Number(event.time) || Date.now()
        const sessionId = String((session && session.id) || '')
        records.push({
          recordId: randomUUID(),
          time: at,
          pricingTime: at,
          model,
          provider: 'deepseek-official',
          purpose: 'web-search',
          sessionId,
          inputTokens: estimateSearchInputTokens(body),
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          reasoningTokens: 0,
          finishReason: '',
          origin: 'search-backend',
          estimated: true,
          maxTokens: Number(body.max_tokens) || 0,
          maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : 0,
          usdCnyRate: 0,
          fxDate: ''
        })
        const snapshot = unitSnapshotOf(model, 'deepseek-official', at)
        if (snapshot) records[records.length - 1].unit = snapshot
        if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS)
        ensureSessionRoot().then(persistNow).catch(() => {})
      }

      // 把一条记录投影为 API 响应形状（供 list / tokenForMessage 共用，含成本与峰谷判定）。
      // origin：'probe'（实时探针，上游实测）/ 'search-backend'（DeepSeek 搜索后端，
      // 上游未持久化 usage，仅计次，费用为下限估算）。estimated 为 true 时，
      // token 与费用都不是上游实测值，UI 与导出必须显式区分。
      // 投影缓存：projectRecord 每条记录要算 3 次费用（base / peakValley / auto），
      // 100k 条就是 30 万次计算，而客户端每次刷新都会重新拉一次 list。价格表、
      // 汇率、记录内容任一变化都会 bump projectionVersion，缓存整体失效——不做
      // 逐条失效，避免漏掉某条路径导致金额显示成旧值。
      let projectionVersion = 0
      const projectionCache = new WeakMap()
      const invalidateProjection = () => { projectionVersion++ }

      function projectRecord(r) {
        const cached = projectionCache.get(r)
        if (cached && cached.version === projectionVersion) return cached.out
        const out = projectRecordUncached(r)
        projectionCache.set(r, { version: projectionVersion, out })
        return out
      }

      function projectRecordUncached(r) {
        const pricedAt = r.pricingTime || r.time
        return {
          time: r.time, pricingTime: pricedAt,
          model: r.model, provider: r.provider, purpose: r.purpose, sessionId: r.sessionId || '',
          origin: r.origin || 'probe', estimated: r.estimated === true, recordId: r.recordId || '',
          inputTokens: r.inputTokens, outputTokens: r.outputTokens,
          cacheReadTokens: r.cacheReadTokens, cacheWriteTokens: r.cacheWriteTokens,
          reasoningTokens: r.reasoningTokens, finishReason: r.finishReason,
          interrupted: !!r.interrupted,
          usdCnyRate: r.usdCnyRate || 0, fxDate: r.fxDate || '',
          modelKey: modelKey(r.model),
          baseCost: costFor(r, 'base'), peakValleyCost: costFor(r, 'peakValley'), autoCost: costFor(r, 'auto'),
          peak: isPeak(pricedAt)
        }
      }

      /**
       * 清掉全部记录的冻结单价快照，返回受影响条数。
       *
       * 这是**唯一**会改写历史费用的入口，必须由用户显式触发（"用当前价格表重算
       * 全部历史"）。日常改价格表只影响之后产生的记录，不会回头改写过去。
       */
      function dropUnitSnapshots() {
        let n = 0
        for (const r of records) {
          if (r.unit) { delete r.unit; n++ }
        }
        if (n > 0) invalidateProjection()
        return n
      }

      // 对已投影的记录做聚合（对话累计 / 本轮明细共用）。
      function computeAgg(items) {
        const agg = { calls: items.length, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, peakCost: 0, offCost: 0, baseCost: 0, totalCost: 0, hitRate: 0 }
        let firstTime = 0, lastTime = 0
        for (const it of items) {
          agg.input += it.inputTokens; agg.output += it.outputTokens
          agg.cacheRead += it.cacheReadTokens; agg.cacheWrite += it.cacheWriteTokens
          agg.reasoning += it.reasoningTokens
          if (it.peak) agg.peakCost += it.peakValleyCost; else agg.offCost += it.peakValleyCost
          agg.baseCost += it.baseCost; agg.totalCost += it.autoCost
          if (!firstTime || it.time < firstTime) firstTime = it.time
          if (it.time > lastTime) lastTime = it.time
        }
        const denom = agg.cacheRead + agg.input
        agg.hitRate = denom > 0 ? (agg.cacheRead / denom * 100) : 0
        agg.time = { start: firstTime, end: lastTime }
        return agg
      }

      const msg = (e) => String((e && e.message) || e)
      const fail = (message) => ({ ok: false, error: message })
      const pad2 = (n) => (n < 10 ? '0' : '') + n
      const fmtInt = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      const fmtTime = (ts) => {
        const d = new Date(ts + 8 * 3600 * 1000)
        return `${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
      }
      const fmtMoney = (n) => {
        if (!n) return '0.0000'
        if (n < 0.0001) return n.toExponential(2)
        if (n < 1) return n.toFixed(4)
        return n.toFixed(2)
      }
      const IS_WIN = typeof process !== 'undefined' && process.platform === 'win32'
      const IS_MAC = typeof process !== 'undefined' && process.platform === 'darwin'
      const normPath = (p) => {
        const s = String(p == null ? '' : p)
        return IS_WIN ? s.replace(/\//g, '\\') : s
      }
      const joinPath = (...parts) => path.join(...parts.map((p) => String(p == null ? '' : p)))
      // 插件自身持久化统一走宿主进程的 node:fs（不经 ctx.fs 沙箱），
      // 因此可稳定写入工作区之外的系统目录，切换工作区也不会丢失历史。
      // 写入必须是原子的（临时文件 → fsync → rename）：半截写入不会覆盖掉
      // 真实历史，失败时原文件保持不动，下一次写入仍可重试。
      const nfsWriteText = atomicWriteText
      const nfsReadText = async (filePath) => fsp.readFile(filePath, 'utf8')
      const nfsExists = (filePath) => { try { return existsSync(filePath) } catch (e) { return false } }
      const stamp = () => {
        const d = new Date()
        return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
      }

      function bjKey(ts) {
        const d = new Date(Number(ts) + 8 * 3600 * 1000)
        return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
      }

      /**
       * 按北京自然日聚合。
       *
       * 入参是**已投影**的记录（`projectRecord` 的结果），直接复用其中的
       * `baseCost` / `peakValleyCost` / `autoCost` / `peak`。
       *
       * 以前这里再遍历一遍原始记录、每条又算三次费用，与 `projectRecord` 完全重复：
       * 100k 条记录每次刷新要做 60 万次费用计算，这就是"用量查询偶尔很慢"的主因之一。
       */
      function buildDays(items) {
        const map = {}
        for (const it of items) {
          const key = bjKey(it.time)
          let d = map[key]
          if (!d) {
            d = {
              day: key, calls: 0, miss: 0, hit: 0, write: 0, out: 0, reason: 0,
              peakCalls: 0, offPeakCalls: 0, baseCost: 0, peakValleyCost: 0, autoCost: 0,
              basePeakCost: 0, baseOffPeakCost: 0,
              pvPeakCost: 0, pvOffPeakCost: 0,
              autoPeakCost: 0, autoOffPeakCost: 0
            }
            map[key] = d
          }
          d.calls++
          d.miss += it.inputTokens || 0
          d.hit += it.cacheReadTokens || 0
          d.write += it.cacheWriteTokens || 0
          d.out += it.outputTokens || 0
          d.reason += it.reasoningTokens || 0
          const cBase = it.baseCost || 0
          const cPv = it.peakValleyCost || 0
          const cAuto = it.autoCost || 0
          if (it.peak) {
            d.peakCalls++
            d.basePeakCost += cBase
            d.pvPeakCost += cPv
            d.autoPeakCost += cAuto
          } else {
            d.offPeakCalls++
            d.baseOffPeakCost += cBase
            d.pvOffPeakCost += cPv
            d.autoOffPeakCost += cAuto
          }
          d.baseCost += cBase
          d.peakValleyCost += cPv
          d.autoCost += cAuto
        }
        const days = []
        for (const k in map) days.push(map[k])
        days.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0))
        return days
      }

      const fs = ctx.get('fs')
      push('fs=' + (fs ? 'present' : 'undefined'))
      let root = ''
      let dataPath = ''
      let pricingPath = ''
      let pricingHistoryPath = ''
      let budgetPath = ''
      // 价格表历史：每次改价 / 重置都在这里留一份完整快照（只增不改）。
      // `pricing.json` 只保存"当前表"，没有它就无法回答"上周是按什么价算的"。
      let pricingHistory = []
      let budget = null // { monthly: number|null } — 月度预算（元），null 表示未设置
      let persistOk = false
      let persistError = ''
      let initPromise = null
      let writeChain = Promise.resolve()
      let cachedPolicy = null

      const dirs = () => ({
        data: joinPath(root, 'dsh-usage'),
        csv: joinPath(root, 'dsh-usage', 'csv'),
        json: joinPath(root, 'dsh-usage', 'json'),
        images: joinPath(root, 'dsh-usage', 'images')
      })

      function currentAgent() {
        try {
          const agents = ctx.get('agents')
          if (agents && typeof agents.currentInitiator === 'function') return agents.currentInitiator()
        } catch (e) {}
        return undefined
      }

      function sessionPolicy() {
        if (cachedPolicy) return cachedPolicy
        try {
          const agent = currentAgent()
          const sp = ctx.get('sandboxPolicy')
          if (sp && typeof sp.resolve === 'function' && agent && agent.session) {
            const policy = sp.resolve({ session: agent.session })
            if (policy && policy.workspaceRoot) {
              cachedPolicy = policy
              return policy
            }
          }
        } catch (e) {}
        return undefined
      }

      // SSE 实时推送：数据变化（新记录写入 / 导入 / 清除等）时通知订阅者。
      // 订阅端点 /usage/api/events。无订阅者时是 no-op，插件独立使用不受影响。
      const sseClients = new Set()
      function notifyChanged() {
        if (sseClients.size === 0) return
        const payload = 'data: {"type":"changed","at":' + Date.now() + '}\n\n'
        for (const res of sseClients) {
          try { res.write(payload) } catch (e) { sseClients.delete(res) }
        }
      }

      function persistNow() {
        if (!dataPath || !persistOk) return Promise.resolve()
        const text = JSON.stringify(records)
        writeChain = writeChain.then(() => nfsWriteText(dataPath, text)).then(() => { notifyChanged() }).catch(() => {})
        return writeChain
      }

      function persistPricing() {
        if (!pricingPath || !persistOk) return Promise.resolve()
        return nfsWriteText(pricingPath, JSON.stringify(PRICING)).catch(() => {})
      }

      function persistPricingHistory() {
        if (!pricingHistoryPath || !persistOk) return Promise.resolve()
        return nfsWriteText(pricingHistoryPath, JSON.stringify(pricingHistory)).catch(() => {})
      }

      /**
       * 追加一条价格表快照（只增不改）。
       *
       * 与旧的 `pricing.json`（"当前表"）互补：
       *   - `pricing.json` 决定**之后**产生的记录用哪套价；
       *   - `pricing-history.json` 记录**曾经**用过哪几套价，供用户在价格页回看。
       * 记录本身的冻结单价的机制不变，因此历史费用依旧不会被改写。
       *
       * @param kind - 'baseline'（首次建表）/ 'edit'（手工改价）/ 'reset'（恢复默认）。
       * @param label - 展示用说明。
       */
      function appendPricingHistory(kind, label) {
        const entry = {
          at: Date.now(),
          kind,
          label: String(label || ''),
          table: JSON.parse(JSON.stringify(PRICING)),
          holidays: Array.from(HOLIDAYS)
        }
        const last = pricingHistory[pricingHistory.length - 1]
        // 内容与上一条完全一致就不重复记录（例如点了保存但没改任何数字）。
        if (last && JSON.stringify(last.table) === JSON.stringify(entry.table)) return last
        pricingHistory.push(entry)
        if (pricingHistory.length > 200) pricingHistory.splice(0, pricingHistory.length - 200)
        persistPricingHistory()
        return entry
      }

      async function loadPricingHistory() {
        if (!pricingHistoryPath) return
        try {
          const data = JSON.parse(await nfsReadText(pricingHistoryPath))
          if (Array.isArray(data)) {
            pricingHistory = data.filter((e) => e && typeof e === 'object' && e.table && typeof e.table === 'object')
          }
        } catch (e) {}
      }

      function persistBudget() {
        if (!budgetPath || !persistOk) return Promise.resolve()
        return nfsWriteText(budgetPath, JSON.stringify(budget)).catch(() => {})
      }

      async function loadBudget() {
        if (!budgetPath) return
        try {
          const data = JSON.parse(await nfsReadText(budgetPath))
          if (!data || typeof data !== 'object') return
          const m = Number(data.monthly)
          budget = { monthly: Number.isFinite(m) && m >= 0 ? m : null }
        } catch (e) {}
      }

      async function loadPricing() {
        if (!pricingPath) return
        try {
          const data = JSON.parse(await nfsReadText(pricingPath))
          if (!data || typeof data !== 'object') return
          for (const regime of PRICE_REGIMES) {
            const src = data[regime]
            const dst = PRICING[regime]
            if (!src || typeof src !== 'object' || !dst) continue
            for (const mk of PRICE_MODELS) {
              const row = src[mk]
              if (!row || typeof row !== 'object' || !dst[mk]) continue
              for (const k of ['cacheHit', 'cacheMiss', 'output']) {
                const v = Number(row[k])
                if (Number.isFinite(v) && v >= 0) dst[mk][k] = v
              }
            }
          }
          // 法定节假日可在 pricing.json 里覆盖（官方公布新一年安排后不必升级插件）。
          // 只接受 `YYYY-MM-DD` 形状的字符串，其余一律忽略，避免脏数据影响计费。
          if (Array.isArray(data.holidays)) {
            const keys = data.holidays.map((v) => String(v || '').trim()).filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))
            if (keys.length > 0) HOLIDAYS = new Set(keys)
          }
        } catch (e) {}
      }

      // normalizeRecord / recordKey 来自 lib/records.js（纯逻辑层，可单测）。
      // 去重按"记录身份"而不是"毫秒"：同一毫秒的两条不同请求不能互相覆盖。

      /**
       * 把无法解析的用量文件改名保留，返回保留后的完整路径（失败返回空串）。
       *
       * 只在"文件存在但读不出来"时调用。目的不是丢弃，而是**保留证据 + 让插件继续可用**：
       * 文件名带 ISO 时间戳，用户可以在数据目录里找到它并人工抢救。
       */
      async function quarantineCorruptFile(file) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-')
        const kept = file + '.corrupt-' + stamp + '.json'
        await fsp.rename(file, kept)
        return kept
      }

      async function tryInitWithRoot(candidate) {
        const tryPath = joinPath(normPath(candidate), 'dsh-usage', 'usage-records.json')
        try {
          const arr = await readStoredRecords(tryPath)
          if (arr.length > 0) {
            const existing = {}
            for (let i = 0; i < records.length; i++) existing[recordKey(records[i])] = true
            for (let i = 0; i < arr.length; i++) {
              const rec = normalizeRecord(arr[i])
              if (!rec) continue
              const key = recordKey(rec)
              if (existing[key]) continue
              existing[key] = true
              records.push(rec)
            }
            if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS)
            records.sort((a, b) => a.time - b.time)
          }
        } catch (e) {
          // 文件存在但读不出来（损坏 / 权限）。绝不能静默当成空数组再写回去——
          // 那会把整份历史抹掉。做法：把原件改名保留，然后照常继续启动，让插件
          // 仍然可用、数据仍可人工抢救，而不是让插件直接不可用。
          const kept = await quarantineCorruptFile(tryPath).catch(() => '')
          push('usage-file-unreadable: ' + msg(e) + (kept ? ' -> ' + kept : ''))
          persistError = '用量文件无法读取（' + msg(e) + '）'
            + (kept ? '，原件已保留为 ' + path.basename(kept) : '')
        }
        try {
          // 真实试写以确认该目录可写；用宿主进程的 node:fs，不受 workspace-write
          // 沙箱约束，因此活动数据根会落在工作区之外的系统/用户目录。
          await nfsWriteText(tryPath, JSON.stringify(records))
          root = normPath(candidate)
          dataPath = tryPath
          pricingPath = joinPath(path.dirname(dataPath), 'pricing.json')
          pricingHistoryPath = joinPath(path.dirname(dataPath), 'pricing-history.json')
          budgetPath = joinPath(path.dirname(dataPath), 'budget.json')
          await loadPricing()
          await loadPricingHistory()
          await loadBudget()
          persistOk = true
          persistError = ''
          // 首次启动（或历史文件丢失）时补一条基线快照，之后每次改价都往后追加。
          if (pricingHistory.length === 0) appendPricingHistory('baseline', '首次建立的基准价格表')
          return { ok: true }
        } catch (e) {
          return { ok: false, error: msg(e) }
        }
      }

      async function migrateLegacy(candidates) {
        const paths = []
        for (const c of candidates) {
          paths.push(joinPath(normPath(c), '.dsh-usage-records.json'))
          paths.push(joinPath(normPath(c), 'dsh-usage', 'usage-records.json'))
        }
        for (const p of paths) {
          try {
            const arr = await readStoredRecords(p)
            if (arr.length > 0) {
              const existing = {}
              for (let j = 0; j < records.length; j++) existing[recordKey(records[j])] = true
              for (const raw of arr) {
                const rec = normalizeRecord(raw)
                if (!rec) continue
                const key = recordKey(rec)
                if (existing[key]) continue
                existing[key] = true
                records.push(rec)
              }
              if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS)
              records.sort((a, b) => a.time - b.time)
            }
          } catch (e) {}
        }
      }

      // 固定、专用的数据目录：不随工作区漂移，也绝不放进工作目录。
      // 优先级：环境变量 DSH_USAGE_DATA_DIR >
      // 系统应用数据目录(LOCALAPPDATA 或 APPDATA 下的 dsh-usage-plugin) >
      // 用户主目录下的专用文件夹 dsh-usage-data。
      // 这些目录由宿主进程 node:fs 直接写入，不受 workspace-write 沙箱约束，
      // 因此数据稳定地落在工作区之外——切换工作区也不会丢失历史。
      // 仅在以上目录全部不可写时，才兜底写到工作区（极少见，且会提示用户）。
      function resolveDataRoot() {
        const out = []
        const env = ((typeof process !== 'undefined' && process.env && process.env.DSH_USAGE_DATA_DIR) || '').trim()
        if (env) out.push(normPath(env))
        const localApp = (typeof process !== 'undefined' && process.env) ? (process.env.LOCALAPPDATA || '') : ''
        if (localApp) out.push(joinPath(normPath(localApp), 'dsh-usage-plugin'))
        const roamingApp = (typeof process !== 'undefined' && process.env) ? (process.env.APPDATA || '') : ''
        if (roamingApp) out.push(joinPath(normPath(roamingApp), 'dsh-usage-plugin'))
        out.push(joinPath(normPath(os.homedir()), 'dsh-usage-data'))
        // 兜底（极少见）：以上均不可写时落到工作区，保证不丢数据并提示用户。
        try {
          const sp = ctx.get('sandboxPolicy')
          if (sp && sp.workspaceRoot) out.push(joinPath(normPath(String(sp.workspaceRoot)), 'dsh-usage'))
        } catch (e) {}
        return out
      }

      // 已知可能遗留旧数据的目录（用于一次性合并迁移），不再作为活动根。
      function knownLegacyRoots() {
        const home = normPath(os.homedir())
        const roots = [home, joinPath(home, '.dsh')]
        try {
          const sp = ctx.get('sandboxPolicy')
          if (sp && sp.workspaceRoot) roots.push(normPath(String(sp.workspaceRoot)))
        } catch (e) {}
        const agent = currentAgent()
        if (agent && agent.session && agent.session.header && agent.session.header.cwd) {
          roots.push(normPath(String(agent.session.header.cwd)))
        }
        return roots
      }

      // 会话激活后不再切换根目录（避免路径漂移/历史被拆散）；仅把工作区里
      // 可能遗留的旧记录并入固定的数据根。
      async function ensureSessionRoot() {
        if (!persistOk) return
        await migrateLegacy(knownLegacyRoots())
        persistNow()
      }

      async function initPersistence() {
        const candidates = resolveDataRoot()
        let lastError = ''
        for (const c of candidates) {
          const r = await tryInitWithRoot(c)
          if (r.ok) {
            // 首次初始化时把散落在 主目录/.dsh/各工作区 的历史记录合并进来
            await migrateLegacy(knownLegacyRoots())
            persistNow()
            return
          }
          lastError = r.error || '写入失败'
        }
        persistError = lastError || '未找到可写的持久化目录'
        persistOk = false
        root = ''
        dataPath = ''
      }

      const ensureInit = () => (initPromise ||= initPersistence())
      try { ensureInit() } catch (e) { push('ensureInit-threw: ' + msg(e)) }

      // ── capture ────────────────────────────────────────────────────────────
      try {
        ctx.on('llm/stream', function (options, next) {
          const source = next()
          const model = (options && options.model) || ''
          const provider = (options && options.provider) || ''
          const purpose = options && options.purpose ? String(options.purpose) : ''
          let sessionId = options && options.sessionId ? String(options.sessionId) : ''
          const startedAt = Date.now()
          let usage = null
          let finishReason = ''

          async function* observe() {
            try {
              for await (const chunk of source) {
                if (chunk && chunk.type === 'usage' && chunk.usage) {
                  usage = chunk.usage
                } else if (chunk && chunk.type === 'finish') {
                  const r = chunk.reason
                  finishReason = r ? String(r.kind || '') : ''
                }
                yield chunk
              }
            } finally {
              if (!sessionId) {
                try { const ag = currentAgent(); if (ag && ag.session && ag.session.id) sessionId = String(ag.session.id) } catch (e) {}
              }
              if (provider === 'digital-ocean' || provider === 'digitalocean') {
                try { await refreshFxRate(false) } catch (e) {}
              }
              const isDO = provider === 'digital-ocean' || provider === 'digitalocean'
              // 冻结这笔调用当时生效的三个单价（以及 DigitalOcean 的汇率），
              // 写进记录的 unit 字段。之后任何改价都不会回头改写它的费用。
              const unitSnapshot = unitSnapshotOf(model, provider, startedAt)
              if (unitSnapshot && isDO && FX.rate > 0) unitSnapshot.fx = FX.rate
              if (usage) {
                // 只记录上游真实上报的值。DeepSeek 系 provider 不报 cacheWriteTokens
                // （官方计费里"缓存写入"本就按未命中价计，不单列）。此前这里是
                // `usage.cacheWriteTokens || usage.inputTokens`，等于伪造一笔与未命中
                // 相等的缓存写入：四桶合计（输入 + 命中 + 写入 + 输出）因此系统性多算
                // 一笔，插件"总 token"永远比宿主状态栏大一截。
                // 该列的展示兜底改由 lib/client.js 负责，不再污染记录本身。
                records.push({
                  recordId: randomUUID(),
                  time: startedAt,
                  // 计费时刻：取价格档位以 pricingTime 为准，历史回填 / 导入的记录
                  // 也能借此冻结"当时生效的价格"，不随后续调价改变。
                  pricingTime: startedAt,
                  model,
                  provider,
                  purpose,
                  sessionId,
                  inputTokens: usage.inputTokens || 0,
                  outputTokens: usage.outputTokens || 0,
                  cacheReadTokens: usage.cacheReadTokens || 0,
                  cacheWriteTokens: usage.cacheWriteTokens || 0,
                  reasoningTokens: usage.reasoningTokens || 0,
                  finishReason,
                  usdCnyRate: isDO ? (FX.rate || 0) : 0,
                  fxDate: isDO ? (FX.date || '') : '',
                  ...(unitSnapshot ? { unit: unitSnapshot } : {})
                })
              } else if (isRealCall({ model, provider, time: startedAt })) {
                // 兜底：harness 在流被中断（aborted / error / timeout）时不会产出
                // usage chunk（usage 只在收到 [DONE] 哨兵后才由 adapter yield），
                // 但官方后台仍会按该次请求的实际 token 计费。这里补记一条 0-token
                // 的「中断调用」，使调用次数与官方口径对齐；token 与费用均为 0，
                // 不会虚增消耗。interrupted 标记供客户端 UI 区分展示。
                records.push({
                  recordId: randomUUID(),
                  time: startedAt,
                  pricingTime: startedAt,
                  model,
                  provider,
                  purpose,
                  sessionId,
                  inputTokens: 0,
                  outputTokens: 0,
                  cacheReadTokens: 0,
                  cacheWriteTokens: 0,
                  reasoningTokens: 0,
                  finishReason: finishReason || 'aborted',
                  interrupted: true,
                  usdCnyRate: 0,
                  fxDate: ''
                })
              }
              if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS)
              try {
                const agent = currentAgent()
                const sp = ctx.get('sandboxPolicy')
                if (sp && typeof sp.resolve === 'function' && agent && agent.session) {
                  const policy = sp.resolve({ session: agent.session })
                  if (policy && policy.workspaceRoot) cachedPolicy = policy
                }
              } catch (e) {}
              ensureSessionRoot().then(persistNow).catch(() => {})
            }
          }

          return observe()
        })
        push('llm-stream-listener-ok')
      } catch (e) {
        push('llm-stream-listener-threw: ' + (e && e.stack ? e.stack : msg(e)))
      }

      // ── DeepSeek 搜索后端（web_search）计次 ────────────────────────────────
      // 第二条独立数据通道：`session/event` 是宿主 append 后的广播（post-commit，
      // 失败不会影响 append 本身）。用它接住 `web/deepseek-search-llm-request`，
      // 把这部分此前完全不可见的调用显式计入"已知未覆盖项"。
      // 详见 recordSearchBackendCall 的说明。
      try {
        ctx.on('session/event', function (session, event) {
          if (!event || event.type !== 'web/deepseek-search-llm-request') return
          try { recordSearchBackendCall(session, event) } catch (e) { push('search-backend-threw: ' + msg(e)) }
        })
        push('session-event-listener-ok')
      } catch (e) {
        push('session-event-listener-threw: ' + (e && e.stack ? e.stack : msg(e)))
      }

      // ── balance / network helpers ──────────────────────────────────────────
      async function safeCwd() {
        if (root) {
          try {
            await fsp.stat(root)
            return root
          } catch (e) {}
        }
        return (typeof process !== 'undefined' && typeof process.cwd === 'function' && process.cwd()) || '.'
      }

      async function runCollect(argv, opts) {
        const subprocess = ctx.get('subprocess')
        if (!subprocess) return { ok: false, error: '命令执行服务不可用' }
        let handle
        try {
          handle = subprocess.spawn({
            argv,
            cwd: await safeCwd(),
            stdio: opts && opts.stdinData != null
              ? { stdin: { data: opts.stdinData }, stdout: { maxBytes: 65536 }, stderr: { maxBytes: 65536 } }
              : { stdin: 'ignore', stdout: { maxBytes: 65536 }, stderr: { maxBytes: 65536 } },
            graceMs: (opts && opts.graceMs) || 15000,
            ...(opts && opts.env ? { env: opts.env } : {})
          })
        } catch (e) { return { ok: false, error: '启动失败：' + msg(e) } }
        let outcome
        try { outcome = await handle.done } catch (e) { return { ok: false, error: '执行失败：' + msg(e) } }
        const outText = handle.collected && handle.collected.stdout ? handle.collected.stdout.readFrom(0).text : ''
        const errText = handle.collected && handle.collected.stderr ? handle.collected.stderr.readFrom(0).text : ''
        return { ok: outcome.exitCode === 0, exitCode: outcome.exitCode, out: outText, err: errText }
      }

      const isElectron = typeof process !== 'undefined' && !!(process.versions && process.versions.electron)
      function nodeCandidates() {
        const list = IS_WIN
          ? ['node.exe', 'node', 'C:\\Program Files\\nodejs\\node.exe']
          : ['node']
        if (typeof process !== 'undefined' && process.execPath && !list.includes(process.execPath)) list.push(process.execPath)
        return list
      }

      async function spawnNode(script, stdinData, env) {
        const subprocess = ctx.get('subprocess')
        if (!subprocess) return { ok: false, error: '命令执行服务不可用' }
        let exe = null
        for (const c of nodeCandidates()) {
          try { exe = await subprocess.resolveExecutable(c); if (exe) break } catch (e) {}
        }
        if (!exe) return { ok: false, error: '未找到 node 可执行文件' }
        const finalEnv = env || {}
        if (isElectron && exe === process.execPath && !('ELECTRON_RUN_AS_NODE' in finalEnv)) {
          finalEnv.ELECTRON_RUN_AS_NODE = '1'
        }
        const r = await runCollect([exe, '-e', script], { stdinData, env: finalEnv })
        if (!r.ok) {
          if (r.exitCode != null) return { ok: false, error: 'node 退出码 ' + r.exitCode + (r.err ? '：' + r.err.trim() : '') }
          return { ok: false, error: r.error || '执行失败' }
        }
        return { ok: true, out: r.out }
      }

      // ── HTTP：进程内直连优先，子进程兜底 ─────────────────────────────────
      // 此前所有网络请求（余额、汇率）都通过 `node -e` 子进程发起：Windows 上
      // 起一个 node 进程要 200~800ms，所以"查余额"经常要等一两秒。宿主本身就在
      // Node 里跑，而 undici 已经是本包的依赖，直接在进程内请求快一个数量级；
      // 只有 undici 不可用（被裁剪的运行时）时才回落到子进程，行为与旧版一致。
      let undiciRequest
      async function directRequest() {
        if (undiciRequest !== undefined) return undiciRequest
        try {
          const mod = await import('undici')
          undiciRequest = (mod && typeof mod.request === 'function') ? mod.request : null
        } catch (e) { undiciRequest = null }
        return undiciRequest
      }

      // 进程内请求同样要尊重 HTTPS_PROXY：百炼 CLI 那条通道一直靠 EnvHttpProxyAgent
      // 走代理，余额/汇率两条不认代理。统一在这里建一个共享 dispatcher（只在本插件
      // 的请求里使用，不改全局 dispatcher，避免影响宿主和其它插件）。
      let proxyDispatcher
      let proxyDispatcherReady = false
      async function getDispatcher() {
        if (proxyDispatcherReady) return proxyDispatcher
        proxyDispatcherReady = true
        try {
          const mod = await import('undici')
          if (mod && typeof mod.EnvHttpProxyAgent === 'function') proxyDispatcher = new mod.EnvHttpProxyAgent()
        } catch (e) { proxyDispatcher = null }
        return proxyDispatcher
      }

      async function httpDirect(method, url, headers, body, timeoutMs) {
        const request = await directRequest()
        if (!request) return { ok: false, unsupported: true, error: 'undici 不可用' }
        const dispatcher = await getDispatcher()
        const controller = new AbortController()
        const timer = setTimeout(() => { try { controller.abort() } catch (e) {} }, timeoutMs || 20000)
        try {
          // 注意：undici v7 的 request() 不再接受 `maxRedirections`（改由 redirect
          // interceptor 处理），传了会直接抛
          // "maxRedirections is not supported, use the redirect interceptor"——
          // 余额查询因此整体失败过。这里不跟随重定向：账单/配额端点都是直连，
          // 3xx 一律按非 200 处理并报出状态码，比静默跟跳到未知地址更安全。
          const options = {
            method,
            headers: headers || {},
            signal: controller.signal
          }
          if (body != null) options.body = body
          if (dispatcher) options.dispatcher = dispatcher
          const res = await request(url, options)
          const text = await res.body.text()
          const rawType = res.headers && (res.headers['content-type'] || res.headers['Content-Type'])
          return { ok: true, statusCode: res.statusCode, contentType: String(rawType || ''), body: text }
        } catch (e) {
          const aborted = e && (e.name === 'AbortError' || String(e.code || '') === 'UND_ERR_ABORTED')
          return { ok: false, error: aborted ? '请求超时' : msg(e) }
        } finally {
          clearTimeout(timer)
        }
      }

      function httpGetDirect(url, headers, timeoutMs) {
        return httpDirect('GET', url, headers, null, timeoutMs)
      }

      async function httpGetViaSpawn(url, headers) {
        const script = [
          'const https=require("https");',
          'const url=process.env.REQ_URL||"";',
          'const headers=JSON.parse(process.env.REQ_HEADERS||"{}");',
          'const req=https.get(url,{headers:headers},function(res){',
          'let b="";res.on("data",c=>b+=c);',
          'res.on("end",function(){process.stdout.write(JSON.stringify({statusCode:res.statusCode,contentType:String(res.headers["content-type"]||""),body:b}))});',
          '});',
          'req.on("error",function(e){process.stdout.write(JSON.stringify({error:String(e&&e.message||e)}))});',
          'req.setTimeout(20000,function(){req.destroy(new Error("timeout"))});'
        ].join('\n')
        const r = await spawnNode(script, null, { REQ_URL: url, REQ_HEADERS: JSON.stringify(headers || {}) })
        if (!r.ok) return { ok: false, error: r.error || '执行失败' }
        let parsed
        try { parsed = JSON.parse(r.out) } catch (e) { return { ok: false, error: '无法解析 node 输出' } }
        if (parsed.error) return { ok: false, error: parsed.error }
        return { ok: true, statusCode: parsed.statusCode, contentType: String(parsed.contentType || ''), body: parsed.body }
      }

      /**
       * GET 一个 JSON/文本端点：优先进程内直连，undici 缺失时才起子进程。
       *
       * @returns `{ ok, statusCode, contentType, body }` 或 `{ ok:false, error }`。
       *          与旧实现返回形状一致，调用方的状态码 / Content-Type 判断不用改。
       */
      async function httpGet(url, headers, timeoutMs) {
        const direct = await httpGetDirect(url, headers, timeoutMs)
        if (direct.ok) return direct
        if (!direct.unsupported) return direct
        return httpGetViaSpawn(url, headers)
      }

      // POST 兜底：undici 不可用时用子进程 + undici 的 EnvHttpProxyAgent（与旧实现一致）。
      async function httpPostViaSpawn(url, headers, body) {
        let undiciPath = ''
        try { undiciPath = new URL(import.meta.resolve('undici')).pathname } catch (e) { undiciPath = '' }
        const script = [
          'const url=process.env.REQ_URL||"";',
          'const bodyText=process.env.REQ_BODY||"";',
          'const headers=JSON.parse(process.env.REQ_HEADERS||"{}");',
          'const undiciPath=process.env.UNDICI_PATH||"";',
          'if(!undiciPath){process.stdout.write(JSON.stringify({error:"undici 不可用，请确认插件依赖已安装"}));process.exit(0);}',
          'const m=require(undiciPath);',
          'try{m.setGlobalDispatcher(new m.EnvHttpProxyAgent())}catch(e){}',
          'const timeout=setTimeout(function(){process.stdout.write(JSON.stringify({error:"timeout"}));process.exit(0)},20000);',
          '(async function(){',
          '  try{',
          '    const res=await m.request(url,{method:"POST",headers:headers,body:bodyText});',
          '    clearTimeout(timeout);',
          '    const b=await res.body.text();',
          '    process.stdout.write(JSON.stringify({statusCode:res.statusCode,contentType:String(res.headers["content-type"]||""),body:b}));',
          '  }catch(e){clearTimeout(timeout);process.stdout.write(JSON.stringify({error:String(e&&e.message||e)}));}',
          '})();'
        ].join('\n')
        const r = await spawnNode(script, null, {
          REQ_URL: url,
          REQ_HEADERS: JSON.stringify(headers || {}),
          REQ_BODY: String(body == null ? '' : body),
          UNDICI_PATH: undiciPath
        })
        if (!r.ok) return { ok: false, error: r.error || '执行失败' }
        let parsed
        try { parsed = JSON.parse(r.out) } catch (e) { return { ok: false, error: '无法解析 node 输出' } }
        if (parsed.error) return { ok: false, error: parsed.error }
        return { ok: true, statusCode: parsed.statusCode, contentType: String(parsed.contentType || ''), body: parsed.body }
      }

      async function httpPost(url, headers, body, timeoutMs) {
        const direct = await httpDirect('POST', url, headers, body, timeoutMs)
        if (direct.ok) return direct
        if (!direct.unsupported) return direct
        return httpPostViaSpawn(url, headers, body)
      }

      function bjTodayKey() {
        const d = new Date(Date.now() + 8 * 3600 * 1000)
        return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate())
      }

      // 是否存在 DigitalOcean 记录：只有这类记录的费用需要 USD/CNY 折算，
      // 其余记录的金额与汇率无关，不该为了汇率去等网络。
      function hasDigitalOceanRecords() {
        for (const r of records) {
          const p = String(r.provider || '').toLowerCase()
          if (p === 'digital-ocean' || p === 'digitalocean') return true
        }
        return false
      }

      // 同一天只拉一次，且并发调用合并成一次请求：多个面板同时刷新时不会
      // 各自起一个请求（旧实现是每次 refreshFxRate(false) 都可能起一次）。
      let fxInFlight = null
      async function refreshFxRate(force) {
        if (!force && FX.rate > 0 && FX.queriedAt && bjKey(FX.queriedAt) === bjTodayKey()) return FX
        if (fxInFlight) return fxInFlight
        fxInFlight = (async () => {
          const r = await httpGet('https://api.frankfurter.dev/v2/rates?base=USD&quotes=CNY', {
            Accept: 'application/json',
            'User-Agent': 'dsh-usage-plugin'
          }, 15000)
          if (!r.ok) {
            FX = { ...FX, stale: FX.rate > 0, error: r.error || '汇率请求失败', queriedAt: Date.now() }
            return FX
          }
          try {
            if (r.statusCode !== 200) throw new Error('HTTP ' + r.statusCode)
            const arr = JSON.parse(r.body)
            const row = Array.isArray(arr) ? arr.find((x) => x && x.base === 'USD' && x.quote === 'CNY') : null
            const rate = Number(row && row.rate)
            if (!(rate > 0)) throw new Error('响应中缺少 USD/CNY 汇率')
            FX = { rate, inverse: 1 / rate, date: String(row.date || ''), queriedAt: Date.now(), source: 'Frankfurter', stale: false, error: '' }
            // DigitalOcean 的费用按汇率折算，汇率一变投影结果就要重算。
            invalidateProjection()
          } catch (e) {
            FX = { ...FX, stale: FX.rate > 0, error: msg(e), queriedAt: Date.now() }
          }
          return FX
        })().finally(() => { fxInFlight = null })
        return fxInFlight
      }

      async function resolveCredential(credentials, candidates) {
        const seen = new Set()
        for (const candidate of candidates) {
          const name = typeof candidate === 'string' ? candidate : candidate.name
          if (!name || seen.has(name)) continue
          seen.add(name)
          try {
            const hit = await credentials.resolve(name)
            if (hit && hit.value) {
              return {
                name,
                value: hit.value,
                source: String(hit.source || ''),
                route: typeof candidate === 'string' ? '' : String(candidate.route || '')
              }
            }
          } catch (e) {}
        }
        return null
      }

      async function configuredModelProvider(provider) {
        if (!provider || provider.queryMode !== 'direct') return null
        try {
          const settings = ctx.get('settings')
          if (!settings || typeof settings.get !== 'function') return null
          const section = await settings.get('llm-pi-ai')
          const profiles = section && section.providers
          if (!profiles || typeof profiles !== 'object') return null
          for (const route of Object.keys(profiles)) {
            const profile = profiles[route]
            if (!profile || typeof profile !== 'object') continue
            if (!matchesModelProvider(provider.id, route, profile.displayName)) continue
            return {
              route,
              apiKeyEnv: typeof profile.apiKeyEnv === 'string' ? profile.apiKeyEnv.trim() : '',
              baseURL: typeof profile.baseURL === 'string' ? profile.baseURL.trim() : ''
            }
          }
        } catch (e) {}
        return null
      }

      function balanceFailure(provider, error, fields) {
        return {
          ok: false,
          provider: provider.id,
          providerName: provider.name,
          error,
          credentialHelpUrl: provider.credentialHelpUrl || '',
          ...(fields || {})
        }
      }

      const DIGITALOCEAN_CREDENTIAL = 'DIGITALOCEAN_TOKEN'

      async function credentialDescription(credentials, name) {
        if (credentials && typeof credentials.describe === 'function') {
          try {
            const info = await credentials.describe(name)
            return {
              configured: !!(info && info.configured),
              source: String((info && info.source) || ''),
              writable: !!(info && info.writable)
            }
          } catch (e) {}
        }
        const hit = await resolveCredential(credentials, [{ name, route: '' }])
        return {
          configured: !!hit,
          source: hit ? hit.source : '',
          writable: !!(credentials && typeof credentials.set === 'function')
        }
      }

      async function balanceCredentialStatus(providerId) {
        const provider = getBalanceProvider(providerId)
        if (!provider) return fail('不支持的余额服务商：' + String(providerId || ''))
        const credentials = ctx.get('credentials')
        if (!credentials) return balanceFailure(provider, '凭据服务不可用', { errorCode: 'credentials-unavailable' })
        if (provider.id === 'siliconflow') {
          const profile = await configuredModelProvider(provider)
          if (!profile) {
            return balanceFailure(provider, '未在“设置 → 模型”中找到 Provider ID 或显示名为 siliconflow 的模型提供商。', { errorCode: 'model-provider-missing' })
          }
          if (!profile.apiKeyEnv) {
            return balanceFailure(provider, '模型提供商 ' + profile.route + ' 没有配置 apiKeyEnv；请编辑该模型提供商并保存 API Key。', { errorCode: 'model-credential-ref-missing', modelProviderRoute: profile.route })
          }
          const info = await credentialDescription(credentials, profile.apiKeyEnv)
          return {
            ok: true,
            provider: provider.id,
            configured: info.configured,
            source: info.source,
            writable: info.writable,
            masked: info.configured ? '••••••••••••' : '',
            credentialName: profile.apiKeyEnv,
            modelProviderRoute: profile.route
          }
        }
        if (provider.id === 'digitalocean') {
          let credentialName = DIGITALOCEAN_CREDENTIAL
          let info = await credentialDescription(credentials, credentialName)
          if (!info.configured) {
            for (const candidate of provider.credentialNames) {
              if (candidate === DIGITALOCEAN_CREDENTIAL) continue
              const candidateInfo = await credentialDescription(credentials, candidate)
              if (!candidateInfo.configured) continue
              credentialName = candidate
              info = candidateInfo
              break
            }
          }
          return {
            ok: true,
            provider: provider.id,
            configured: info.configured,
            source: info.source,
            writable: info.writable,
            masked: info.configured ? '••••••••••••' : '',
            credentialName
          }
        }
        return balanceFailure(provider, '该服务商不支持在余额页管理凭据', { errorCode: 'credential-management-unsupported' })
      }

      async function saveBalanceCredential(providerId, rawValue) {
        const provider = getBalanceProvider(providerId)
        if (!provider || provider.id !== 'digitalocean') return fail('仅支持在余额页保存 DigitalOcean 账户 Token')
        const value = String(rawValue || '').trim()
        if (!/^dop_v1_[A-Za-z0-9_-]{20,}$/.test(value)) {
          return balanceFailure(provider, 'Token 格式不正确：请输入 DigitalOcean 控制台创建的 dop_v1_ Personal Access Token，不要使用 DO AI 推理 Key。', { errorCode: 'invalid-credential-format' })
        }
        const credentials = ctx.get('credentials')
        if (!credentials || typeof credentials.set !== 'function') {
          return balanceFailure(provider, '当前 Harness 凭据服务不支持安全保存 Token', { errorCode: 'credentials-read-only' })
        }
        const info = await credentialDescription(credentials, DIGITALOCEAN_CREDENTIAL)
        if (info.configured && !info.writable) {
          return balanceFailure(provider, 'DIGITALOCEAN_TOKEN 当前由只读来源 ' + (info.source || '环境变量') + ' 提供，不能在页面覆盖；请修改该来源后重启。', { errorCode: 'credential-read-only', credentialSource: info.source })
        }
        try {
          await credentials.set(DIGITALOCEAN_CREDENTIAL, value)
        } catch (e) {
          return balanceFailure(provider, '保存 Token 失败：' + msg(e), { errorCode: 'credential-save-failed' })
        }
        const saved = await credentialDescription(credentials, DIGITALOCEAN_CREDENTIAL)
        if (!saved.configured) return balanceFailure(provider, 'Token 保存后未能从凭据服务中重新读取', { errorCode: 'credential-save-unverified' })
        return {
          ok: true,
          provider: provider.id,
          configured: true,
          source: saved.source,
          writable: saved.writable,
          masked: '••••••••••••',
          credentialName: DIGITALOCEAN_CREDENTIAL
        }
      }
// ── Qwen / 百炼 Token Plan (console-token) ────────────────────────────
      // 复用 bl CLI 保存的百炼控制台 OAuth access_token（~/.bailian/config.json），
      // 调用百炼内部门户网关查询 Token Plan 配额用量，不需要阿里云 AccessKey。
      const QWEN_GATEWAYS = {
        'cn-beijing-domestic': { host: 'bailian-cs.console.aliyun.com', action: 'BroadScopeAspnGateway' },
        'cn-beijing-international': { host: 'bailian-cs.console.alibabacloud.com', action: 'BroadScopeAspnGateway' },
        'ap-southeast-1-domestic': { host: 'modelstudio-cs.console.aliyun.com', action: 'IntlBroadScopeAspnGateway' },
        'ap-southeast-1-international': { host: 'bailian-singapore-cs.alibabacloud.com', action: 'IntlBroadScopeAspnGateway' }
      }
      const QWEN_API = 'zeldaHttp.apikeyMgr./tokenplan/personal/api/v2/usage'

      function readBailianConfigPath() {
        const base = process.env.BAILIAN_CONFIG_DIR || joinPath(os.homedir(), '.bailian')
        return joinPath(base, 'config.json')
      }

      async function readQwenConsoleToken() {
        const cfgPath = readBailianConfigPath()
        let raw
        try { raw = await nfsReadText(cfgPath) } catch (e) {
          throw new Error('未找到 ' + cfgPath + '。请先运行 `bl auth login --console` 完成百炼控制台登录。')
        }
        let cfg
        try { cfg = JSON.parse(raw) } catch (e) {
          throw new Error(cfgPath + ' 不是合法的 JSON 配置')
        }
        let token = cfg.access_token || cfg.accessToken
        const active = cfg.active_config || 'default'
        const profile = cfg[active]
        if (profile && typeof profile === 'object') {
          token = token || profile.access_token || profile.accessToken
        }
        if (!token || !String(token).trim()) {
          throw new Error('配置中没有 access_token，请先运行 `bl auth login --console` 完成百炼控制台登录。')
        }
        return { token: String(token).trim(), region: String(cfg.console_region || 'cn-beijing'), site: String(cfg.console_site || 'domestic') }
      }

      async function queryQwenTokenPlan() {
        const { token, region, site } = await readQwenConsoleToken()
        const gw = QWEN_GATEWAYS[region + '-' + site] || QWEN_GATEWAYS['cn-beijing-domestic']
        if (!gw) throw new Error('不支持的控制台地域/站点：' + region + '/' + site)
        const payload = {
          Api: QWEN_API,
          V: '1.0',
          Data: {
            cornerstoneParam: {
              protocol: 'V2',
              console: 'ONE_CONSOLE',
              productCode: 'p_efm',
              switchUserType: 3,
              consoleSite: 'BAILIAN_ALIYUN'
            }
          }
        }
        const body = 'params=' + encodeURIComponent(JSON.stringify(payload)) + '&region=' + encodeURIComponent(region)
        const url = 'https://' + gw.host + '/cli/api.json'
          + '?action=' + encodeURIComponent(gw.action)
          + '&product=sfm_bailian&api=' + encodeURIComponent(QWEN_API)
        // 与 bl CLI 一致：走 undici 的 EnvHttpProxyAgent 自动读取 HTTPS_PROXY 走代理。
        // 现在直接在宿主进程内请求（httpPost 内部就是 EnvHttpProxyAgent），不再为了
        // 一次余额查询去起 node 子进程。
        const parsed = await httpPost(url, {
          Authorization: 'Bearer ' + token,
          Accept: '*/*',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'dsh-usage-plugin'
        }, body, 20000)
        if (!parsed.ok) throw new Error(parsed.error || '请求失败')
        if (parsed.statusCode !== 200) {
          const hint = parsed.statusCode === 401 || parsed.statusCode === 403 ? ' 登录可能已过期，请重新运行 `bl auth login --console`。' : ''
          throw new Error('接口返回 HTTP ' + parsed.statusCode + '：' + String(parsed.body || '').slice(0, 300) + hint)
        }
        // 网关返回的是带外层包装的 JSON（data.DataV2.data.data 才是配额字段），
        // 这里解包后把扁平化的 JSON 文本交给 parseBalanceResponse。
        let wrapper
        try { wrapper = JSON.parse(parsed.body) } catch (e) { throw new Error('无法解析百炼网关响应') }
        let inner = wrapper && wrapper.data
        if (inner && inner.DataV2) {
          const d2 = inner.DataV2.data
          inner = (d2 && d2.data) != null ? d2.data : (d2 != null ? d2 : inner.DataV2)
        } else if (inner) {
          inner = inner.data || inner
        }
        if (!inner || typeof inner !== 'object') throw new Error('百炼网关响应格式不符合预期')
        return JSON.stringify(inner)
      }

      async function queryBalance(providerId) {
        const provider = getBalanceProvider(providerId)
        if (!provider) return fail('不支持的余额服务商：' + String(providerId || ''))
        if (provider.queryMode === 'unsupported') {
          return balanceFailure(
            provider,
            provider.unsupportedMessage || (provider.name + ' 当前未公开可由 API Key 调用的余额查询端点；请在服务商控制台查看。'),
            { unsupported: true, errorCode: 'unsupported' }
          )
        }
        if (provider.queryMode === 'console-token') {
          try {
            const bodyText = await queryQwenTokenPlan()
            const normalized = parseBalanceResponse(provider.id, bodyText)
            if (!normalized.ok) {
              normalized.provider = provider.id
              normalized.providerName = provider.name
              normalized.credentialHelpUrl = provider.credentialHelpUrl || ''
            } else {
              normalized.credentialName = '百炼控制台 token'
              normalized.credentialSource = readBailianConfigPath()
            }
            return normalized
          } catch (e) {
            return balanceFailure(provider, msg(e), { errorCode: 'console-token-error' })
          }
        }
        const credentials = ctx.get('credentials')
        if (!credentials) return balanceFailure(provider, '凭据服务不可用', { errorCode: 'credentials-unavailable' })
        const modelProfile = await configuredModelProvider(provider)
        const credentialCandidates = []
        if (provider.id === 'siliconflow' && !modelProfile) {
          return balanceFailure(provider, '未在“设置 → 模型”中找到 Provider ID 或显示名为 siliconflow 的模型提供商。请先添加该提供商、填写 API Key 并保存，然后返回此页查询。', { errorCode: 'model-provider-missing' })
        }
        if (provider.id === 'siliconflow' && modelProfile && !modelProfile.apiKeyEnv) {
          return balanceFailure(provider, '模型提供商 ' + modelProfile.route + ' 没有配置 API Key。请在“设置 → 模型”中编辑该提供商并保存 API Key。', { errorCode: 'model-credential-ref-missing', modelProviderRoute: modelProfile.route })
        }
        if (modelProfile && modelProfile.apiKeyEnv) credentialCandidates.push({ name: modelProfile.apiKeyEnv, route: modelProfile.route })
        if (provider.id !== 'siliconflow') {
          for (const name of provider.credentialNames) credentialCandidates.push({ name, route: '' })
        }
        const hit = await resolveCredential(credentials, credentialCandidates)
        if (!hit) {
          const message = provider.id === 'digitalocean'
            ? '尚未保存 DigitalOcean 账户 Personal Access Token。请在此页面输入 dop_v1_ Token，保存后查询。'
            : provider.id === 'siliconflow'
              ? '模型提供商 ' + modelProfile.route + ' 引用了 ' + modelProfile.apiKeyEnv + '，但该凭据未配置。请在“设置 → 模型”中重新填写 API Key 并保存。'
              : missingCredentialError(provider).error
          return balanceFailure(provider, message, { errorCode: 'missing-credential', modelProviderRoute: modelProfile ? modelProfile.route : '' })
        }
        const endpoint = resolveBalanceEndpoint(provider.id, modelProfile && modelProfile.baseURL)
        // 直接在宿主进程内请求（undici）：旧实现每查一次余额都要 `node -e` 起一个
        // 子进程，Windows 上光启动就要 200~800ms，这是"余额查询慢"的主因。
        const r = await httpGet(endpoint, {
          Authorization: 'Bearer ' + hit.value,
          Accept: 'application/json',
          'User-Agent': 'dsh-usage-plugin'
        }, 20000)
        if (!r.ok) return balanceFailure(provider, r.error, { errorCode: 'request-failed' })
        const parsed = r
        if (parsed.statusCode !== 200) {
          const authHint = parsed.statusCode === 401 || parsed.statusCode === 403 ? ' 请检查凭据是否属于该账户、是否有效及是否具备余额/账单读取权限。' : ''
          return balanceFailure(provider, '接口返回 HTTP ' + parsed.statusCode + '：' + String(parsed.body || '').slice(0, 300) + authHint, {
            errorCode: parsed.statusCode === 401 || parsed.statusCode === 403 ? 'unauthorized' : 'http-error',
            statusCode: parsed.statusCode,
            credentialName: hit.name,
            credentialSource: hit.source,
            modelProviderRoute: hit.route || (modelProfile ? modelProfile.route : '')
          })
        }
        if (!String(parsed.contentType || '').toLowerCase().includes('application/json')) {
          return balanceFailure(provider, '接口返回了非 JSON 内容（Content-Type: ' + String(parsed.contentType || '未知') + '），请求可能被网络代理拦截。', { errorCode: 'invalid-content-type', statusCode: parsed.statusCode })
        }
        const normalized = parseBalanceResponse(provider.id, parsed.body)
        if (normalized.ok) {
          normalized.credentialName = hit.name
          normalized.credentialSource = hit.source
          normalized.modelProviderRoute = hit.route || (modelProfile ? modelProfile.route : '')
          normalized.endpoint = endpoint
        } else {
          normalized.provider = provider.id
          normalized.providerName = provider.name
          normalized.credentialHelpUrl = provider.credentialHelpUrl || ''
        }
        return normalized
      }

      // ── export helpers ─────────────────────────────────────────────────────
      function csvCell(s) {
        s = String(s == null ? '' : s)
        if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
        return s
      }

      function buildCsv() {
        const header = ['time', 'model', 'provider', 'origin', 'estimated', 'inputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'outputTokens', 'reasoningTokens', 'finishReason', 'period', 'baseCost', 'peakValleyCost', 'autoCost']
        const lines = [header.join(',')]
        for (const r of records) {
          lines.push([
            r.time, r.model, r.provider, r.origin || 'probe', r.estimated === true ? '1' : '0',
            r.inputTokens, r.cacheReadTokens, r.cacheWriteTokens,
            r.outputTokens, r.reasoningTokens, r.finishReason,
            isPeak(r.pricingTime || r.time) ? 'peak' : 'offPeak', costFor(r, 'base'), costFor(r, 'peakValley'), costFor(r, 'auto')
          ].map(csvCell).join(','))
        }
        return lines.join('\r\n')
      }

      async function writePngFile(base64, outPath) {
        try {
          await fsp.mkdir(path.dirname(outPath), { recursive: true })
          await fsp.writeFile(outPath, Buffer.from(base64, 'base64'))
          return { ok: true }
        } catch (e) { return { ok: false, error: msg(e) } }
      }

      async function writeTextFileViaNode(content, outPath) {
        try {
          await fsp.mkdir(path.dirname(outPath), { recursive: true })
          await fsp.writeFile(outPath, Buffer.from(content, 'utf8'))
          return { ok: true }
        } catch (e) { return { ok: false, error: msg(e) } }
      }

      async function mkdirViaNode(dir) {
        try { await fsp.mkdir(dir, { recursive: true }); return { ok: true } } catch (e) { return { ok: false, error: msg(e) } }
      }

      async function pickDirectory() {
        const subprocess = ctx.get('subprocess')
        if (!subprocess) return fail('命令执行服务不可用')
        if (IS_MAC) {
          let exe = null
          try { exe = await subprocess.resolveExecutable('osascript') } catch (e) {}
          if (!exe) return fail('未找到 osascript（macOS 需安装命令行工具 Command Line Tools）')
          const r = await runCollect([exe, '-e', 'POSIX path of (choose folder)'], { graceMs: 120000 })
          if (!r.ok && r.error) return fail(r.error)
          const picked = normPath(r.out.trim())
          if (!picked) return { ok: false, cancelled: true }
          return { ok: true, path: picked }
        }
        if (!IS_WIN) {
          for (const c of ['zenity', 'kdialog']) {
            let exe = null
            try { exe = await subprocess.resolveExecutable(c) } catch (e) {}
            if (!exe) continue
            const argv = c === 'zenity'
              ? [exe, '--file-selection', '--directory', '--title=选择导出目录']
              : [exe, '--getexistingdirectory', '选择导出目录']
            const r = await runCollect(argv, { graceMs: 120000 })
            if (!r.ok && r.error) return fail(r.error)
            const picked = normPath(r.out.trim())
            if (!picked) return { ok: false, cancelled: true }
            return { ok: true, path: picked }
          }
          return fail('未找到目录选择工具（请安装 zenity 或 kdialog）')
        }
        let exe = null
        for (const c of ['powershell.exe', 'pwsh.exe', 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe']) {
          try { exe = await subprocess.resolveExecutable(c); if (exe) break } catch (e) {}
        }
        if (!exe) return fail('未找到 PowerShell')
        const script = 'Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = "选择导出目录"; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($f.SelectedPath) }'
        const r = await runCollect([exe, '-NoProfile', '-STA', '-NonInteractive', '-Command', script], { graceMs: 120000 })
        if (!r.ok && r.error) return fail(r.error)
        const picked = normPath(r.out.trim())
        if (!picked) return { ok: false, cancelled: true }
        return { ok: true, path: picked }
      }

      async function revealDir(dirArg) {
        const subprocess = ctx.get('subprocess')
        if (!subprocess) return fail('命令执行服务不可用')
        let target = ''
        const isKey = dirArg === 'csv' || dirArg === 'json' || dirArg === 'images' || dirArg === 'data'
        if (isKey) {
          const d = dirs()
          target = dirArg === 'csv' ? d.csv : dirArg === 'json' ? d.json : dirArg === 'images' ? d.images : d.data
          target = normPath(target)
          try {
            await nfsWriteText(joinPath(target, '.keep'), '')
          } catch (e) {}
        } else {
          target = normPath(dirArg)
          await mkdirViaNode(target)
        }
        const revealCmd = IS_WIN ? 'explorer.exe' : (IS_MAC ? 'open' : 'xdg-open')
        let exe = null
        try { exe = await subprocess.resolveExecutable(revealCmd) } catch (e) {}
        if (!exe) return fail('未找到 ' + revealCmd)
        try {
          subprocess.spawn({ argv: [exe, target], cwd: await safeCwd(), stdio: { stdin: 'ignore', stdout: { maxBytes: 1024 }, stderr: { maxBytes: 1024 } }, graceMs: 5000 })
          return { ok: true }
        } catch (e) { return fail(msg(e)) }
      }

      // ── API ────────────────────────────────────────────────────────────────
      async function routeApi(body) {
        const action = body && body.action ? String(body.action) : ''
        try { await ensureInit() } catch (e) {}
        switch (action) {
          case 'list': {
            // 汇率只影响 DigitalOcean 记录的折算。此前这里是**无条件 await**：
            // 没有 DO 记录时（绝大多数用户）每次刷新都会起一个 node 子进程去拉汇率，
            // 于是"用量与消耗"面板每次打开都要多等几百毫秒。现在只在确有 DO 记录时
            // 等待；否则彻底不碰网络，让面板立即可用。
            if (hasDigitalOceanRecords()) {
              try { await refreshFxRate(false) } catch (e) {}
            }
            const items = []
            const toolItems = []
            let legacyPricingCount = 0
            let latest = 0
            for (const r of records) {
              const rt = r.time || 0
              if (rt > latest) latest = rt
              if (isRealCall(r)) {
                items.push(projectRecord(r))
                if (!r.unit) legacyPricingCount++
              } else {
                toolItems.push(projectRecord(r))
              }
            }
            // 没有冻结单价的记录（旧版本写入 / 手工导入）：它们的费用是按"当前
            // 价格表"算的，改价后会跟着变。UI 必须把这件事显式告诉用户，
            // 否则用户会以为历史和现在用的同一套价。
            // 价格来源与核对信息：官方价目页 2026-11-01 复核后，
            //   - 模型单价（flash / v4-pro）未变；
            //   - 新增 Search / Fetch 按次计费（¥5 / 1000 次成功请求，2026-11-01 起）；
            //   - 高峰时段明确排除法定节假日（本插件自 2026-11-01 起按此计费）。
            // Search/Fetch 的次数插件拿不到（Harness 不持久化该计数），因此只作声明，
            // 不按估算次数计入费用——宁可少算，也不编一个看起来精确的数字。
            const pricingMeta = {
              sourceUrl: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing/',
              checkedAt: '2026-11-01',
              searchFetch: { pricePer1000: 5, effectiveAt: HOLIDAY_RULE_AT, counted: false },
              holidayRuleAt: HOLIDAY_RULE_AT,
              holidays: Array.from(HOLIDAYS)
            }
            return { ok: true, version: PLUGIN_VERSION, total: records.length, latest, pricingVersion: projectionVersion, records: items, count: items.length, toolCalls: toolItems, dataPath, persistOk, persistError, pricing: PRICING, pricingMeta, pricingHistory: pricingHistory.slice(-12), effectiveAt: EFFECTIVE_AT, effectiveV41At: V41_EFFECTIVE_AT, days: buildDays(items), fx: FX, budget, legacyPricingCount }
          }
          case 'stat': {
            // 轻量心跳：只回答"数据变了没有"，不返回任何记录。
            // 客户端此前每 10 秒调一次 `list` —— 那等于每 10 秒把全部记录
            // （上万条可达数十 MB）重新投影、序列化、JSON.parse、全量重渲染，
            // 面板因此长期占用主线程，表现为"打字/切换页签卡顿"。
            let latest = 0
            for (let i = 0; i < records.length; i++) {
              const t = records[i].time || 0
              if (t > latest) latest = t
            }
            return {
              ok: true,
              count: records.length,
              latest,
              pricingVersion: projectionVersion,
              persistOk,
              hasDigitalOcean: hasDigitalOceanRecords()
            }
          }
          case 'tokenForMessage': {
            // 消息底部弹窗：分两层统计——整场对话累计（conversation）+ 本轮明细（aggregate/records）。
            const sid = body && body.sessionId ? String(body.sessionId) : ''
            const from = Number(body && body.from) || 0
            const to = Number(body && body.to) || 0
            let sessionRecs = records.filter(isRealCall)
            if (sid) sessionRecs = sessionRecs.filter((r) => String(r.sessionId || '') === sid)
            let turnRecs = sessionRecs
            if (from > 0) turnRecs = turnRecs.filter((r) => r.time >= from)
            if (to > 0) turnRecs = turnRecs.filter((r) => r.time <= to)
            const convoAgg = computeAgg(sessionRecs.map(projectRecord))
            const turnAgg = computeAgg(turnRecs.map(projectRecord))
            return { ok: true, records: turnRecs.map(projectRecord), aggregate: turnAgg, conversation: convoAgg, count: turnRecs.length, from, to }
          }
          case 'clear': {
            const n = records.length
            records.length = 0
            persistNow()
            return { ok: true, cleared: n }
          }
          case 'setPrices': {
            const prices = body && body.prices
            if (!prices || typeof prices !== 'object') return fail('缺少价格数据')
            let changed = false
            for (const regime of PRICE_REGIMES) {
              const src = prices[regime]
              const dst = PRICING[regime]
              if (!src || typeof src !== 'object' || !dst) continue
              for (const mk of PRICE_MODELS) {
                const row = src[mk]
                if (!row || typeof row !== 'object' || !dst[mk]) continue
                for (const k of ['cacheHit', 'cacheMiss', 'output']) {
                  const v = Number(row[k])
                  if (Number.isFinite(v) && v >= 0) { dst[mk][k] = v; changed = true }
                }
              }
            }
            if (!changed) return fail('没有可用的价格更新（价格必须是非负数字）')
            invalidateProjection()
            persistPricing()
            // 只影响之后产生的记录；同时把这次改价之后的价格表存成一条历史快照。
            appendPricingHistory('edit', body && body.label ? String(body.label) : '手工修改价格表')
            // 默认只影响"之后产生的记录"：历史记录带自己的冻结单价，不会被重算。
            // 确实想用新价改写历史时，显式传 reprice: true（会清空全部快照）。
            let repriced = 0
            if (body && body.reprice === true) repriced = dropUnitSnapshots()
            if (repriced > 0) await persistNow()
            return { ok: true, repriced }
          }
          case 'repriceAll': {
            // 显式重算历史：清掉所有记录的冻结单价，让它们改用当前价格表计算。
            // 这是唯一会改写历史费用的入口，只能由用户主动触发。
            const repriced = dropUnitSnapshots()
            await persistNow()
            return { ok: true, repriced }
          }
          case 'resetPrices': {
            for (const regime of PRICE_REGIMES) {
              const src = DEFAULT_PRICING[regime]
              const dst = PRICING[regime]
              if (!src || !dst) continue
              for (const mk of PRICE_MODELS) {
                if (!src[mk] || !dst[mk]) continue
                dst[mk].cacheHit = src[mk].cacheHit
                dst[mk].cacheMiss = src[mk].cacheMiss
                dst[mk].output = src[mk].output
              }
            }
            invalidateProjection()
            persistPricing()
            appendPricingHistory('reset', '恢复内置默认价格表')
            return { ok: true }
          }
          case 'setBudget': {
            // 设置月度预算（元）；传入非负数字生效，null/NaN/负数视为清除预算。
            const raw = Number(body && body.monthly)
            if (Number.isFinite(raw) && raw >= 0) budget = { monthly: raw }
            else budget = null
            persistBudget()
            return { ok: true, budget }
          }
          case 'fxRefresh': {
            const fx = await refreshFxRate(true)
            return { ok: fx.rate > 0, fx, error: fx.rate > 0 ? '' : (fx.error || '无法获取汇率') }
          }
          case 'balance':
            return queryBalance(body && body.provider)
          case 'balanceProviders':
            return { ok: true, providers: providerList() }
          case 'balanceCredentialStatus':
            return balanceCredentialStatus(body && body.provider)
          case 'saveBalanceCredential':
            return saveBalanceCredential(body && body.provider, body && body.value)
          case 'pickDir':
            return pickDirectory()
          case 'export': {
            if (!root) return fail('未找到数据根目录')
            const kind = (body && body.kind) === 'json' ? 'json' : 'csv'
            const name = 'dsh-usage-' + stamp() + (kind === 'json' ? '.json' : '.csv')
            const content = kind === 'json'
              ? JSON.stringify({ exportedAt: Date.now(), pricing: PRICING, records }, null, 2)
              : buildCsv()
            const dirArg = body && body.dir ? normPath(String(body.dir)) : ''
            if (dirArg) {
              const outPath = joinPath(dirArg, name)
              const r = await writeTextFileViaNode(content, outPath)
              if (!r.ok) return fail(r.error)
              return { ok: true, path: outPath, name, dir: dirArg }
            }
            const outPath = joinPath(kind === 'json' ? dirs().json : dirs().csv, name)
            try {
              await nfsWriteText(outPath, content)
              return { ok: true, path: normPath(outPath), name, dir: kind === 'json' ? 'json' : 'csv' }
            } catch (e) { return fail(msg(e)) }
          }
          case 'exportPng': {
            const dataUrl = body && body.dataUrl ? String(body.dataUrl) : ''
            if (!dataUrl) return fail('缺少图片数据')
            const idx = dataUrl.indexOf('base64,')
            const b64 = idx >= 0 ? dataUrl.slice(idx + 7) : dataUrl
            if (!root) return fail('未找到数据根目录')
            const name = 'dsh-usage-report-' + stamp() + '.png'
            const dirArg = body && body.dir ? normPath(String(body.dir)) : ''
            const outPath = normPath(joinPath(dirArg || dirs().images, name))
            const r = await writePngFile(b64, outPath)
            if (!r.ok) return fail(r.error)
            return { ok: true, path: outPath, name, dir: dirArg || 'images' }
          }
          case 'import': {
            const content = body && body.content != null ? String(body.content) : ''
            const filename = body && body.filename ? String(body.filename) : ''
            if (!content) return fail('请选择要导入的文件')
            let parsed
            if (String(filename || '').toLowerCase().indexOf('.csv') >= 0) {
              const lines = String(content).split(/\r?\n/).filter((l) => l.trim().length > 0)
              const header = lines[0] ? parseCsvLine(lines[0]) : []
              const idx = {}
              header.forEach((h, i) => { idx[String(h).trim()] = i })
              parsed = lines.slice(1).map((line) => {
                const cells = parseCsvLine(line)
                const get = (name) => (idx[name] === undefined ? '' : (cells[idx[name]] === undefined ? '' : cells[idx[name]]))
                return {
                  time: get('time'), model: get('model'), provider: get('provider'),
                  inputTokens: get('inputTokens'), outputTokens: get('outputTokens'),
                  cacheReadTokens: get('cacheReadTokens'), cacheWriteTokens: get('cacheWriteTokens'),
                  reasoningTokens: get('reasoningTokens'), finishReason: get('finishReason')
                }
              })
            } else {
              try {
                const data = JSON.parse(content)
                parsed = Array.isArray(data) ? data : (data && Array.isArray(data.records) ? data.records : null)
              } catch (e) { parsed = null }
            }
            if (!parsed || !Array.isArray(parsed)) return fail('文件内容不是可识别的用量数据（支持 JSON 或 CSV）')
            let imported = 0, skipped = 0, invalid = 0
            const existing = {}
            for (const r of records) existing[recordKey(r)] = true
            for (const raw of parsed) {
              const rec = normalizeRecord(raw)
              if (!rec) { invalid++; continue }
              const key = recordKey(rec)
              if (existing[key]) { skipped++; continue }
              existing[key] = true
              records.push(rec)
              imported++
            }
            if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS)
            records.sort((a, b) => a.time - b.time)
            persistNow()
            return { ok: true, imported, skipped, invalid, total: records.length }
          }
          case 'reveal': {
            const dirArg = body && body.dir ? String(body.dir) : 'data'
            return revealDir(dirArg)
          }
          default:
            return fail('未知操作：' + action)
        }
      }

      function parseCsvLine(line) {
        const cells = []
        let cur = ''
        let inQ = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (inQ) {
            if (ch === '"') {
              if (line[i + 1] === '"') { cur += '"'; i++ } else inQ = false
            } else cur += ch
          } else if (ch === '"') inQ = true
          else if (ch === ',') { cells.push(cur); cur = '' }
          else cur += ch
        }
        cells.push(cur)
        return cells
      }

      function readBody(req) {
        return new Promise((resolve) => {
          let d = ''
          req.on('data', (c) => { d += c })
          req.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { resolve({}) } })
          req.on('error', () => resolve({}))
        })
      }

      function sendJson(res, obj) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
        res.end(JSON.stringify(obj))
      }

      const webServer = ctx.get('webServer')
      push('webServer=' + (webServer ? 'present' : 'undefined'))
      if (webServer && typeof webServer.register === 'function') {
        try {
          webServer.register({
            kind: 'exact',
            path: '/usage/api',
            handler: async (req, res) => {
              try {
                const body = await readBody(req)
                sendJson(res, await routeApi(body))
              } catch (e) {
                sendJson(res, { ok: false, error: msg(e) })
              }
            }
          })
          push('route-registered')
        } catch (e) {
          push('route-register-threw: ' + (e && e.stack ? e.stack : msg(e)))
        }
        try {
          // SSE 实时推送端点：数据变化时向订阅者推送 {"type":"changed"}。
          // 桌面端数据中心订阅该流即可即时感知用量数据更新。
          webServer.register({
            kind: 'exact',
            path: '/usage/api/events',
            handler: (req, res) => {
              res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no',
              })
              res.write(':ok\n\n')
              sseClients.add(res)
              req.on('close', () => { sseClients.delete(res) })
            }
          })
        } catch (e) {
          push('events-route-register-threw: ' + msg(e))
        }
      } else {
        push('route-not-registered (no webServer)')
      }

      push('apply-end')
      diag.ok = true
    } catch (e) {
      diag.ok = false
      diag.error = (e && e.stack) ? e.stack : String(e)
    }
    flushDiag()
  }
}
