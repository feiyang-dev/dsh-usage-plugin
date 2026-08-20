/**
 * dsh-usage-plugin — HOST half.
 *
 * Permanent Cordis plugin for a DeepSeek Harness web/desktop profile:
 *  - listens to `llm/stream`, records every model call's token usage,
 *    cache-hit/miss counts and finish reason;
 *  - persists records to `<session workspace>/dsh-usage/usage-records.json`;
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
import {
  getBalanceProvider,
  matchesModelProvider,
  parseBalanceResponse,
  providerList,
  resolveBalanceEndpoint
} from './balance.js'

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

      const PRICING = {
        base: {
          'deepseek-v4-flash': { cacheHit: 0.02, cacheMiss: 1.0, output: 2.0 },
          'deepseek-v4-pro': { cacheHit: 0.025, cacheMiss: 3.0, output: 6.0 }
        },
        peakValley: {
          'deepseek-v4-flash': {
            offPeak: { cacheHit: 0.05, cacheMiss: 1.5, output: 4.5 },
            peak: { cacheHit: 0.1, cacheMiss: 3.0, output: 9.0 }
          },
          'deepseek-v4-pro': {
            offPeak: { cacheHit: 0.15, cacheMiss: 4.5, output: 13.5 },
            peak: { cacheHit: 0.3, cacheMiss: 9.0, output: 27.0 }
          }
        }
      }
      const DEFAULT_PRICING = JSON.parse(JSON.stringify(PRICING))
      const PRICE_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro']
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
      // 新价格表（峰谷价）生效时间：北京时间 2026-08-17 00:00。
      // 在此之前的调用按旧价格表（基础价 base）计费；之后按新价格表（峰谷价）计费。
      const EFFECTIVE_AT = Date.parse('2026-08-17T00:00:00+08:00')

      function modelKey(model) {
        const m = String(model || '').toLowerCase()
        if (m.indexOf('flash') >= 0) return 'deepseek-v4-flash'
        if (m.indexOf('pro') >= 0) return 'deepseek-v4-pro'
        return 'unknown'
      }

      function isPeak(ts) {
        const d = new Date(ts + 8 * 3600 * 1000)
        const t = d.getUTCHours() * 60 + d.getUTCMinutes()
        return (t >= 9 * 60 && t < 12 * 60) || (t >= 14 * 60 && t < 18 * 60)
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
        if (provider !== 'deepseek-official' && provider !== 'deepseek') return 0

        const mk = modelKey(rec.model)
        if (regime === 'base') {
          const p = PRICING.base[mk]
          if (!p) return 0
          return (hit * p.cacheHit + miss * p.cacheMiss + out * p.output) / 1e6
        }
        if (regime === 'auto') {
          if (rec.time < EFFECTIVE_AT) {
            const p = PRICING.base[mk]
            if (!p) return 0
            return (hit * p.cacheHit + miss * p.cacheMiss + out * p.output) / 1e6
          }
          const pv = PRICING.peakValley[mk]
          if (!pv) return 0
          const p = isPeak(rec.time) ? pv.peak : pv.offPeak
          return (hit * p.cacheHit + miss * p.cacheMiss + out * p.output) / 1e6
        }
        const pv = PRICING.peakValley[mk]
        if (!pv) return 0
        const p = isPeak(rec.time) ? pv.peak : pv.offPeak
        return (hit * p.cacheHit + miss * p.cacheMiss + out * p.output) / 1e6
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
      const stamp = () => {
        const d = new Date()
        return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
      }

      function bjKey(ts) {
        const d = new Date(Number(ts) + 8 * 3600 * 1000)
        return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
      }

      function buildDays() {
        const map = {}
        for (const r of records) {
          const key = bjKey(r.time)
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
          d.miss += r.inputTokens || 0
          d.hit += r.cacheReadTokens || 0
          d.write += r.cacheWriteTokens || 0
          d.out += r.outputTokens || 0
          d.reason += r.reasoningTokens || 0
          const cBase = costFor(r, 'base')
          const cPv = costFor(r, 'peakValley')
          const cAuto = costFor(r, 'auto')
          if (isPeak(r.time)) {
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

      function persistNow() {
        if (!fs || !dataPath || !persistOk) return Promise.resolve()
        const text = JSON.stringify(records)
        const policy = sessionPolicy()
        writeChain = writeChain.then(() =>
          fs.resolve(dataPath).then((target) =>
            fs.writeText(target, text, undefined, undefined, policy || undefined)
          )
        ).catch(() => {})
        return writeChain
      }

      function persistPricing() {
        if (!fs || !pricingPath || !persistOk) return Promise.resolve()
        const text = JSON.stringify(PRICING)
        const policy = sessionPolicy()
        return fs.resolve(pricingPath)
          .then((target) => fs.writeText(target, text, undefined, undefined, policy || undefined))
          .catch(() => {})
      }

      async function loadPricing(policy) {
        if (!fs || !pricingPath) return
        try {
          const target = await fs.resolve(pricingPath)
          const data = JSON.parse(await fs.readText(target))
          if (!data || typeof data !== 'object') return
          for (const regime of ['base', 'peakValley']) {
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
        } catch (e) {}
      }

      function normalizeRecord(raw) {
        if (!raw || typeof raw !== 'object') return null
        const time = Number(raw.time)
        if (!Number.isFinite(time) || time <= 0) return null
        const toNum = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : (d === undefined ? 0 : d) }
        return {
          time,
          model: String(raw.model || ''),
          provider: String(raw.provider || ''),
          purpose: String(raw.purpose || ''),
          inputTokens: toNum(raw.inputTokens),
          outputTokens: toNum(raw.outputTokens),
          cacheReadTokens: toNum(raw.cacheReadTokens),
          cacheWriteTokens: toNum(raw.cacheWriteTokens),
          reasoningTokens: toNum(raw.reasoningTokens),
          finishReason: String(raw.finishReason || ''),
          usdCnyRate: toNum(raw.usdCnyRate),
          fxDate: String(raw.fxDate || '')
        }
      }

      async function tryInitWithRoot(candidate, policy) {
        const tryPath = joinPath(normPath(candidate), 'dsh-usage', 'usage-records.json')
        try {
          const target = await fs.resolve(tryPath)
          const arr = JSON.parse(await fs.readText(target))
          if (Array.isArray(arr) && arr.length > 0) {
            const existing = {}
            for (let i = 0; i < records.length; i++) existing[records[i].time] = true
            for (let i = 0; i < arr.length; i++) {
              const rec = normalizeRecord(arr[i])
              if (!rec || existing[rec.time]) continue
              existing[rec.time] = true
              records.push(rec)
            }
            if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS)
            records.sort((a, b) => a.time - b.time)
          }
        } catch (e) {}
        try {
          const target = await fs.resolve(tryPath)
          await fs.writeText(target, JSON.stringify(records), undefined, undefined, policy || undefined)
          root = normPath(candidate)
          dataPath = tryPath
          pricingPath = joinPath(path.dirname(dataPath), 'pricing.json')
          await loadPricing(policy)
          persistOk = true
          persistError = ''
          return { ok: true }
        } catch (e) {
          return { ok: false, error: msg(e) }
        }
      }

      async function migrateLegacy(candidates) {
        if (!fs) return
        const paths = []
        for (const c of candidates) {
          paths.push(joinPath(normPath(c), '.dsh-usage-records.json'))
          paths.push(joinPath(normPath(c), 'dsh-usage', 'usage-records.json'))
        }
        for (const p of paths) {
          try {
            const arr = JSON.parse(await fs.readText(await fs.resolve(p)))
            if (Array.isArray(arr)) {
              const existing = {}
              for (let j = 0; j < records.length; j++) existing[records[j].time] = true
              for (const raw of arr) {
                const rec = normalizeRecord(raw)
                if (!rec || existing[rec.time]) continue
                existing[rec.time] = true
                records.push(rec)
              }
              if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS)
              records.sort((a, b) => a.time - b.time)
            }
          } catch (e) {}
        }
      }

      async function ensureSessionRoot() {
        if (!fs) return
        const policy = sessionPolicy()
        if (!policy || !policy.workspaceRoot) return
        const cwd = normPath(String(policy.workspaceRoot))
        if (cwd === root && persistOk) return
        const r = await tryInitWithRoot(cwd, policy)
        if (r.ok) {
          const sp = ctx.get('sandboxPolicy')
          await migrateLegacy([cwd, normPath(String((sp && sp.workspaceRoot) || ''))])
          persistNow()
        }
      }

      async function initPersistence() {
        if (!fs) { persistError = '文件服务不可用'; return }
        const candidates = []
        const agent = currentAgent()
        if (agent && agent.session && agent.session.header && agent.session.header.cwd) candidates.push(normPath(String(agent.session.header.cwd)))
        try {
          const sp = ctx.get('sandboxPolicy')
          if (sp && sp.workspaceRoot) candidates.push(normPath(String(sp.workspaceRoot)))
        } catch (e) {}
        try {
          const t = await fs.resolve('dsh-usage-probe')
          const p = String(t.displayPath || '')
          const i = p.lastIndexOf('dsh-usage-probe')
          if (i > 0) candidates.push(p.slice(0, i))
        } catch (e) {}
        const seen = {}
        let lastError = ''
        for (const c of candidates) {
          if (!c || seen[c]) continue
          seen[c] = true
          const r = await tryInitWithRoot(c, sessionPolicy())
          if (r.ok) {
            await migrateLegacy(candidates)
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
              if (usage) {
                if (provider === 'digital-ocean' || provider === 'digitalocean') {
                  try { await refreshFxRate(false) } catch (e) {}
                }
                records.push({
                  time: startedAt,
                  model,
                  provider,
                  purpose,
                  inputTokens: usage.inputTokens || 0,
                  outputTokens: usage.outputTokens || 0,
                  cacheReadTokens: usage.cacheReadTokens || 0,
                  cacheWriteTokens: usage.cacheWriteTokens || 0,
                  reasoningTokens: usage.reasoningTokens || 0,
                  finishReason,
                  usdCnyRate: (provider === 'digital-ocean' || provider === 'digitalocean') ? (FX.rate || 0) : 0,
                  fxDate: (provider === 'digital-ocean' || provider === 'digitalocean') ? (FX.date || '') : ''
                })
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
          }

          return observe()
        })
        push('llm-stream-listener-ok')
      } catch (e) {
        push('llm-stream-listener-threw: ' + (e && e.stack ? e.stack : msg(e)))
      }

      // ── balance / network helpers ──────────────────────────────────────────
      async function safeCwd() {
        if (root && fs) {
          try {
            const t = await fs.resolve(root)
            const info = await fs.stat(t)
            if (info) return root
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

      function bjTodayKey() {
        const d = new Date(Date.now() + 8 * 3600 * 1000)
        return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate())
      }

      async function refreshFxRate(force) {
        if (!force && FX.rate > 0 && FX.queriedAt && bjKey(FX.queriedAt) === bjTodayKey()) return FX
        const script = [
          'const https=require("https");',
          'const u="https://api.frankfurter.dev/v2/rates?base=USD&quotes=CNY";',
          'const req=https.get(u,{headers:{Accept:"application/json","User-Agent":"dsh-usage-plugin"}},function(res){',
          'let b="";res.on("data",c=>b+=c);res.on("end",()=>process.stdout.write(JSON.stringify({status:res.statusCode,body:b})));',
          '});',
          'req.on("error",e=>process.stdout.write(JSON.stringify({error:String(e&&e.message||e)})));',
          'req.setTimeout(15000,()=>req.destroy(new Error("timeout")));'
        ].join('\n')
        const r = await spawnNode(script)
        if (!r.ok) {
          FX = { ...FX, stale: FX.rate > 0, error: r.error || '汇率请求失败', queriedAt: Date.now() }
          return FX
        }
        try {
          const wrapper = JSON.parse(r.out)
          if (wrapper.error || wrapper.status !== 200) throw new Error(wrapper.error || ('HTTP ' + wrapper.status))
          const arr = JSON.parse(wrapper.body)
          const row = Array.isArray(arr) ? arr.find((x) => x && x.base === 'USD' && x.quote === 'CNY') : null
          const rate = Number(row && row.rate)
          if (!(rate > 0)) throw new Error('响应中缺少 USD/CNY 汇率')
          FX = { rate, inverse: 1 / rate, date: String(row.date || ''), queriedAt: Date.now(), source: 'Frankfurter', stale: false, error: '' }
        } catch (e) {
          FX = { ...FX, stale: FX.rate > 0, error: msg(e), queriedAt: Date.now() }
        }
        return FX
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

      async function queryBalance(providerId) {
        const provider = getBalanceProvider(providerId)
        if (!provider) return fail('不支持的余额服务商：' + String(providerId || ''))
        if (provider.queryMode === 'unsupported') {
          return balanceFailure(provider, 'AMD GPU Cloud 当前未公开可由推理 API Key 调用的余额查询端点；请在 AMD Developer Cloud 控制台查看 credits。', { unsupported: true, errorCode: 'unsupported' })
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
              : '未找到 ' + provider.credentialHint + '，请配置后重试'
          return balanceFailure(provider, message, { errorCode: 'missing-credential', modelProviderRoute: modelProfile ? modelProfile.route : '' })
        }
        const endpoint = resolveBalanceEndpoint(provider.id, modelProfile && modelProfile.baseURL)
        const script = [
          'const https=require("https");',
          'const key=process.env.BALANCE_API_KEY||"";',
          'const url=process.env.BALANCE_API_URL||"";',
          'const req=https.get(url,{headers:{Authorization:"Bearer "+key,Accept:"application/json","User-Agent":"dsh-usage-plugin"}},function(res){',
          'var body="";',
          'res.on("data",function(c){body+=c});',
          'res.on("end",function(){process.stdout.write(JSON.stringify({statusCode:res.statusCode,contentType:String(res.headers["content-type"]||""),body:body}))});',
          '});',
          'req.on("error",function(e){process.stdout.write(JSON.stringify({error:String(e&&e.message||e)}))});',
          'req.setTimeout(20000,function(){req.destroy(new Error("timeout"))});'
        ].join('\n')
        const r = await spawnNode(script, null, { BALANCE_API_KEY: hit.value, BALANCE_API_URL: endpoint })
        if (!r.ok) return balanceFailure(provider, r.error, { errorCode: 'request-failed' })
        let parsed
        try { parsed = JSON.parse(r.out) } catch (e) { return balanceFailure(provider, '无法解析 node 输出', { errorCode: 'invalid-response' }) }
        if (parsed.error) return balanceFailure(provider, parsed.error, { errorCode: 'request-failed' })
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
        const header = ['time', 'model', 'provider', 'inputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'outputTokens', 'reasoningTokens', 'finishReason', 'period', 'baseCost', 'peakValleyCost', 'autoCost']
        const lines = [header.join(',')]
        for (const r of records) {
          lines.push([
            r.time, r.model, r.provider, r.inputTokens, r.cacheReadTokens, r.cacheWriteTokens,
            r.outputTokens, r.reasoningTokens, r.finishReason,
            isPeak(r.time) ? 'peak' : 'offPeak', costFor(r, 'base'), costFor(r, 'peakValley'), costFor(r, 'auto')
          ].map(csvCell).join(','))
        }
        return lines.join('\r\n')
      }

      async function writePngFile(base64, outPath) {
        const script = [
          'const fs=require("fs");',
          'let d="";',
          'process.stdin.on("data",function(c){d+=c});',
          'process.stdin.on("end",function(){',
          '  const buf=Buffer.from(d,"base64");',
          '  fs.mkdirSync(require("path").dirname(process.env.PNG_PATH),{recursive:true});',
          '  fs.writeFileSync(process.env.PNG_PATH,buf);',
          '  process.stdout.write(JSON.stringify({ok:true,bytes:buf.length}));',
          '});'
        ].join('\n')
        return spawnNode(script, base64, { PNG_PATH: outPath })
      }

      async function writeTextFileViaNode(content, outPath) {
        const script = [
          'const fs=require("fs");',
          'let d="";',
          'process.stdin.on("data",function(c){d+=c});',
          'process.stdin.on("end",function(){',
          '  fs.mkdirSync(require("path").dirname(process.env.OUT_PATH),{recursive:true});',
          '  fs.writeFileSync(process.env.OUT_PATH, Buffer.from(d,"utf8"));',
          '  process.stdout.write(JSON.stringify({ok:true}));',
          '});'
        ].join('\n')
        return spawnNode(script, content, { OUT_PATH: outPath })
      }

      async function mkdirViaNode(dir) {
        const script = [
          'const fs=require("fs");',
          'fs.mkdirSync(process.env.MKDIR_PATH,{recursive:true});',
          'process.stdout.write(JSON.stringify({ok:true}));'
        ].join('\n')
        return spawnNode(script, null, { MKDIR_PATH: dir })
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
          const policy = sessionPolicy()
          try {
            const t = await fs.resolve(joinPath(target, '.keep'))
            await fs.writeText(t, '', undefined, undefined, policy || undefined)
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
            try { await refreshFxRate(false) } catch (e) {}
            const items = records.map((r) => ({
              time: r.time, model: r.model, provider: r.provider, purpose: r.purpose,
              inputTokens: r.inputTokens, outputTokens: r.outputTokens,
              cacheReadTokens: r.cacheReadTokens, cacheWriteTokens: r.cacheWriteTokens,
              reasoningTokens: r.reasoningTokens, finishReason: r.finishReason,
              usdCnyRate: r.usdCnyRate || 0, fxDate: r.fxDate || '',
              modelKey: modelKey(r.model),
              baseCost: costFor(r, 'base'), peakValleyCost: costFor(r, 'peakValley'), autoCost: costFor(r, 'auto'),
              peak: isPeak(r.time)
            }))
            return { ok: true, records: items, count: items.length, dataPath, persistOk, persistError, pricing: PRICING, effectiveAt: EFFECTIVE_AT, days: buildDays(), fx: FX }
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
            for (const regime of ['base', 'peakValley']) {
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
            persistPricing()
            return { ok: true }
          }
          case 'resetPrices': {
            for (const regime of ['base', 'peakValley']) {
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
            persistPricing()
            return { ok: true }
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
            if (!root) return fail('未找到工作区路径')
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
              const target = await fs.resolve(outPath)
              await fs.writeText(target, content, undefined, undefined, sessionPolicy() || undefined)
              return { ok: true, path: normPath(fs.processPath ? fs.processPath(target) : outPath), name, dir: kind === 'json' ? 'json' : 'csv' }
            } catch (e) { return fail(msg(e)) }
          }
          case 'exportPng': {
            const dataUrl = body && body.dataUrl ? String(body.dataUrl) : ''
            if (!dataUrl) return fail('缺少图片数据')
            const idx = dataUrl.indexOf('base64,')
            const b64 = idx >= 0 ? dataUrl.slice(idx + 7) : dataUrl
            if (!root) return fail('未找到工作区路径')
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
            for (const r of records) existing[r.time] = true
            for (const raw of parsed) {
              const rec = normalizeRecord(raw)
              if (!rec) { invalid++; continue }
              if (existing[rec.time]) { skipped++; continue }
              existing[rec.time] = true
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
