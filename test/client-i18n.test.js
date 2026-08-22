import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseBalanceResponse, getBalanceProvider, missingCredentialError } from '../lib/balance.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
let mounts = 0

const fakeRequire = n => {
  if (n === 'react') return { createElement: () => null }
  throw new Error('unexpected require: ' + n)
}

async function loadClient(opts) {
  const o = opts || {}
  const storage = o.storage || {
    _d: Object.create(null),
    getItem(k) { return k in this._d ? this._d[k] : null },
    setItem(k, v) { this._d[k] = String(v) }
  }
  globalThis.window = { __ModuleLoader__: null, localStorage: storage }
  let captured = null
  window.__ModuleLoader__ = { load(d) { captured = d } }
  const url = pathToFileURL(CLIENT).href + '?mount=' + (++mounts) // unique: force re-eval
  await import(url)
  if (!captured) throw new Error('ModuleLoader.load was not called')
  const exports = captured.factory(fakeRequire)
  return { exports, win: window, storage }
}

test('exposes an __i18n surface through the ModuleLoader factory', async () => {
  const { exports } = await loadClient()
  assert.equal(typeof exports.__i18n, 'object')
  for (const k of ['t', 'tb', 'msgText', 'setLang', 'dayLabel', 'fmtMonthLabel', 'dailyStatsTitle', 'weekdayLabels']) {
    assert.equal(typeof exports.__i18n[k], 'function', 'hook.' + k)
  }
})

test('language switch flips rendered text instantly, no network involved', async () => {
  const { exports, storage } = await loadClient()
  const i = exports.__i18n
  assert.equal(i.t('概览'), 'Overview') // non-zh environment defaults to English
  i.setLang('zh')
  assert.equal(i.t('概览'), '概览')
  assert.equal(storage.getItem('dsh-usage-lang'), 'zh')
  i.setLang('en')
  assert.equal(storage.getItem('dsh-usage-lang'), 'en')
})

test('dates and weekdays follow locale rules', async () => {
  const { exports } = await loadClient()
  const i = exports.__i18n
  i.setLang('en')
  assert.equal(i.dayLabel('2026-08-22'), 'Aug 22, 2026')
  assert.equal(i.fmtMonthLabel(2026, 8), 'August 2026')
  assert.deepEqual(i.weekdayLabels(), ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
  assert.equal(i.dailyStatsTitle(2026, 8), 'Daily stats (August 2026)')
  i.setLang('zh')
  assert.equal(i.dayLabel('2026-08-22'), '2026年8月22日')
  assert.equal(i.fmtMonthLabel(2026, 8), '2026年8月')
  assert.deepEqual(i.weekdayLabels(), ['一', '二', '三', '四', '五', '六', '日'])
  i.setLang('en')
})

test('persisted language is honored on the next mount', async () => {
  const first = await loadClient()
  first.exports.__i18n.setLang('zh')
  const second = await loadClient({ storage: first.storage }) // same storage, fresh module eval
  assert.equal(second.exports.__i18n.t('概览'), '概览')
})

test('transient messages render through the current locale', async () => {
  const { exports } = await loadClient()
  const i = exports.__i18n
  const exported = { k: '已导出：', tail: '/tmp/x.csv' }
  i.setLang('en')
  assert.equal(i.msgText(exported), 'Exported: /tmp/x.csv')
  i.setLang('zh')
  assert.equal(i.msgText(exported), '已导出：/tmp/x.csv')
  const imported = { seq: [{ k: '导入成功：新增 ' }, 2, { k: ' 条，跳过重复 ' }, 1, { k: ' 条，忽略无效 ' }, 0, { k: ' 条，现有共 ' }, 100, { k: ' 条' }] }
  i.setLang('en')
  assert.equal(i.msgText(imported), 'Import OK: added 2, skipped duplicates 1, ignored invalid 0, total now 100 records')
  const validation = { errorKey: '请输入以 dop_v1_ 开头的 DigitalOcean 账户 PAT。', error: '' }
  i.setLang('en')
  assert.equal(validation.errorKey ? i.t(validation.errorKey) : validation.error, 'Enter a DigitalOcean account PAT starting with dop_v1_.')
  i.setLang('zh')
  assert.equal(validation.errorKey ? i.t(validation.errorKey) : validation.error, '请输入以 dop_v1_ 开头的 DigitalOcean 账户 PAT。')
  i.setLang('en')
})

test('balance semantic keys resolve in both client locales', async () => {
  const { exports } = await loadClient()
  const i = exports.__i18n
  const samples = [
    ['deepseek', JSON.stringify({ is_available: true, balance_infos: [{ currency: 'CNY', total_balance: '12.34', granted_balance: '2.34', topped_up_balance: '10.00' }] })],
    ['siliconflow', JSON.stringify({ code: 20000, data: { balance: '3.25', chargeBalance: '8.75', totalBalance: '12.00' } })],
    ['digitalocean', JSON.stringify({ account_balance: '-5.25', month_to_date_usage: '3.10', generated_at: '2026-08-22T00:00:00Z' })]
  ]
  const keys = new Set()
  for (const [provider, body] of samples) {
    const res = parseBalanceResponse(provider, body)
    assert.equal(res.ok, true)
    for (const d of res.details || []) { keys.add(d.labelKey); keys.add(d.hintKey) }
    for (const f of res.fieldDefinitions || []) keys.add(f.meaningKey)
    if (res.sourceNoteKey) keys.add(res.sourceNoteKey)
    if (res.balanceLabelKey) keys.add(res.balanceLabelKey)
  }
  assert.ok(keys.size >= 5)
  for (const lang of ['en', 'zh']) {
    i.setLang(lang)
    for (const k of keys) assert.notEqual(i.tb(k), k, lang + ' missing translation for ' + k)
  }
  i.setLang('en')
})

test('missing credential cites technical names and never hint keys', () => {
  const e = missingCredentialError(getBalanceProvider('deepseek'))
  assert.equal(e.ok, false)
  assert.equal(e.errorCode, 'missing-credential')
  assert.match(e.error, /DEEPSEEK_API_KEY/)
  assert.doesNotMatch(e.error, /hint\./)
  for (const id of ['siliconflow', 'digitalocean', 'amd-gpu-cloud']) {
    const err = missingCredentialError(getBalanceProvider(id)).error
    assert.doesNotMatch(err, /hint\./, id + ' leaked a hint key')
  }
})
