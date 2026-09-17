import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.join(here, '..', 'lib', 'client.js')
const SOURCE = fs.readFileSync(CLIENT, 'utf8')

/** 收集源码里"声明过的名字"（var/let/const 的逗号声明 + 函数参数 + 箭头参数）。 */
function declaredNames(src) {
  const names = new Set()
  let m
  const declRe = /\b(?:var|let|const)\s+([^;\n]+)/g
  while ((m = declRe.exec(src)) !== null) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/[=\s[]/)[0].replace(/[^A-Za-z0-9_$]/g, '')
      if (name) names.add(name)
    }
  }
  const fnRe = /function\s*[A-Za-z0-9_$]*\s*\(([^)]*)\)/g
  while ((m = fnRe.exec(src)) !== null) {
    for (const p of m[1].split(',')) {
      const name = p.trim().split(/[=\s]/)[0]
      if (name) names.add(name)
    }
  }
  const arrowRe = /\(([^)]*)\)\s*=>/g
  while ((m = arrowRe.exec(src)) !== null) {
    for (const p of m[1].split(',')) {
      const name = p.trim().split(/[=\s]/)[0]
      if (name) names.add(name)
    }
  }
  return names
}

test('no reference to the removed stepStart variable (the crash that hid the button)', () => {
  const names = declaredNames(SOURCE)
  const code = SOURCE.replace(/\/\/[^\n]*/g, '')
  // stepStart 在重写窗口逻辑时被删除，但 turnStats() 漏改引用，
  // 触发 ReferenceError，slot 错误边界随即卸载整个条目
  // —— 表现为点击后按钮消失、弹窗打不开。
  assert.equal(/\bstepStart\b/.test(code), false, 'stepStart 不应再出现在代码里')
  assert.equal(names.has('stepStart'), false, 'stepStart 不应再被声明')
  for (const n of ['turnStart', 'turnEnd', 'msgTime']) {
    assert.equal(names.has(n), true, n + ' 应已声明（窗口变量）')
  }
})

test('turnStats references only declared identifiers', () => {
  const names = declaredNames(SOURCE)
  const at = SOURCE.indexOf('function turnStats()')
  assert.ok(at > 0, '应能定位 turnStats')
  const end = SOURCE.indexOf('function summary()', at)
  const body = SOURCE.slice(at, end > at ? end : at + 2000)
  const stripped = body
    .replace(/\/\/[^\n]*/g, ' ')      // 去掉行注释（注释里出现的名字不算引用）
    .replace(/\/\*[\s\S]*?\*\//g, ' ')  // 去掉块注释
    .replace(/'[^']*'/g, ' ')
    .replace(/"[^"]*"/g, ' ')
    .replace(/\.[A-Za-z0-9_$]+/g, ' ')
  const ids = new Set(stripped.match(/\b[A-Za-z_$][A-Za-z0-9_$]*\b/g) || [])
  const allowed = new Set(['var', 'if', 'else', 'return', 'function', 'null', 'undefined', 'true', 'false',
    'Math', 'Number', 'String', 'Object', 'Array',
    'el', 't', 'stat', 'fmtTokens', 'fmtMoney', 'fmtDur', '__tok',
    'agg2', 'msgTime', 'turnStart', 'turnTokens',
    'turnStats'])   // 函数名自身
  const missing = [...ids].filter((id) => !names.has(id) && !allowed.has(id))
  assert.deepEqual(missing, [], 'turnStats 里有未声明的标识符: ' + missing.join(', '))
})

test('the client bundle parses cleanly', () => {
  assert.doesNotThrow(
    () => new vm.Script('(function(){' + SOURCE + '\n})', { filename: 'client.js' }),
    'client.js 应可解析'
  )
})

test('reasoning tokens are never added to a total (already inside outputTokens)', () => {
  // dsh-token-meter 的 TokenUsageProjection 明确写：四个桶互不相交，
  // 且 "reasoning tokens are already included in outputTokens and are not
  // accumulated again"。多加一遍会让累计值比宿主状态栏偏大（实测差 0.3–1M）。
  const lines = SOURCE.split(/\r?\n/)
  const offenders = []
  lines.forEach((line, i) => {
    // 只看代码，跳过注释
    const code = line.replace(/\/\/.*$/, '')
    if (/\+\s*totalReason\b/.test(code)) offenders.push((i + 1) + ': ' + line.trim())
    if (/\+\s*(convo|agg2)\.reasoning\b/.test(code)) offenders.push((i + 1) + ': ' + line.trim())
    if (/\+\s*\(?\s*(r|rr|br|rec)\.reasoningTokens/.test(code)) offenders.push((i + 1) + ': ' + line.trim())
  })
  assert.deepEqual(offenders, [], '不得把 reasoning 计入总量: ' + offenders.join(' | '))
})

test('the four-bucket totals use exactly four terms', () => {
  // 正例：确认关键位置确实是四桶相加（input/cacheRead/cacheWrite/output）
  assert.equal(/convo\.input \+ convo\.cacheRead \+ convo\.cacheWrite \+ convo\.output\)/.test(SOURCE), true,
    'convoTokens 应为四桶相加')
  assert.equal(/agg2\.input \+ agg2\.cacheRead \+ agg2\.cacheWrite \+ agg2\.output\)/.test(SOURCE), true,
    'turnTokens 应为四桶相加')
})

test('the token dialog uses theme variables instead of hardcoded light colors', () => {
  // 弹窗此前写死 #ffffff / #1c2733 等浅色，在夜间模式下仍是白底黑字。
  // 现在必须走宿主的 --dsw-alias-* 变量，随主题自动切换。
  const start = SOURCE.indexOf('var __tok = {')
  assert.ok(start > 0, '应能定位 __tok')
  const end = SOURCE.indexOf('\n    };', start)
  const block = SOURCE.slice(start, end)

  // 底色与前景色必须来自主题变量
  for (const token of ['TOK_BG', 'TOK_FG', 'TOK_BORDER']) {
    assert.equal(block.includes(token), true, token + ' 应被使用')
  }
  assert.equal(/var\(--dsw-alias-bg-overlay/.test(SOURCE), true, '应引用 --dsw-alias-bg-overlay')
  assert.equal(/var\(--dsw-alias-label-primary/.test(SOURCE), true, '应引用 --dsw-alias-label-primary')

  // 不该再出现"面板底色写死为白 / 正文色写死为深灰"
  assert.equal(/background:\s*"#ffffff"/.test(block), false, '不应把面板底色写死为 #ffffff')
  assert.equal(/color:\s*"#1c2733"/.test(block), false, '不应把正文色写死为 #1c2733')
  assert.equal(/background:\s*"#f5f7fa"/.test(block), false, '内层卡片底色不应写死')
  assert.equal(/background:\s*"#f7f8fa"/.test(block), false, '模型卡底色不应写死')

  // 允许保留的：遮罩/阴影用的黑色半透明（日夜通用）
  const allowed = block.match(/rgba\(0,0,0[^)]*\)/g) || []
  assert.ok(allowed.length <= 2, '只允许遮罩与阴影两处黑色半透明，实际: ' + allowed.length)
})
