import test from 'node:test'
import assert from 'node:assert/strict'
import { costFromUnit, defaultPricing, modelKeyOf } from '../lib/index.js'
import { normalizeRecord, billableTokens } from '../lib/records.js'

// 用户反馈的核心 bug：价格表可实时修改，改完之后**全部历史费用被重算**，
// 于是"当时按便宜价结清的调用"被套上了现在的价。
// 修复方式：记录产生时冻结当时的单价（unit 快照），计费时只读快照。
// costFromUnit 就是这条规则的落点——它不接收任何价格表参数，
// 所以同一份快照在任何时刻、任何价格表下都得到同一个金额。

test('a frozen snapshot produces the same cost regardless of the live price table', () => {
  const unit = { hit: 0.02, miss: 1, out: 4 }
  const expected = (1000 * 0.02 + 2000 * 1 + 3000 * 4) / 1e6
  assert.equal(costFromUnit(unit, 1000, 2000, 3000), expected)

  // 就算把当前价格表整体改贵 10 倍，冻结快照的结果也不动
  const pricing = defaultPricing()
  for (const regime of ['base', 'peakValley', 'peakValleyV41']) {
    for (const mk of ['deepseek-flash', 'deepseek-v4-pro']) {
      pricing[regime][mk].cacheHit = pricing[regime][mk].cacheHit * 10
      pricing[regime][mk].cacheMiss = pricing[regime][mk].cacheMiss * 10
      pricing[regime][mk].output = pricing[regime][mk].output * 10
    }
  }
  assert.equal(costFromUnit(unit, 1000, 2000, 3000), expected)
})

test('frozen unit prices reproduce the official billing formula', () => {
  // 官方口径：miss × 未命中价 + hit × 命中价 + out × 输出价
  // （缓存写入按未命中价计，不单列，所以快照里没有第四个单价）
  const unit = { hit: 0.02, miss: 1, out: 4 }
  assert.equal(costFromUnit(unit, 1_000_000, 0, 0), 0.02)
  assert.equal(costFromUnit(unit, 0, 1_000_000, 0), 1)
  assert.equal(costFromUnit(unit, 0, 0, 1_000_000), 4)
})

test('records without a snapshot report null so the caller falls back to the live table', () => {
  assert.equal(costFromUnit(undefined, 1, 1, 1), null)
  assert.equal(costFromUnit(null, 1, 1, 1), null)
  assert.equal(costFromUnit({}, 1, 1, 1), null)
  assert.equal(costFromUnit({ miss: Number.NaN }, 1, 1, 1), null)
  // 只有部分单价时仍视为"有快照"，缺失的按 0 计（与 normalizeRecord 规则一致）
  assert.equal(costFromUnit({ hit: 0.02, out: 4 }, 0, 0, 1_000_000), 4)
  assert.equal(costFromUnit({ hit: 0.02, out: 4 }, 1_000_000, 0, 0), 0.02)
})

test('a captured record round-trips its snapshot and bills excluding reasoning', () => {
  const rec = normalizeRecord({
    time: 1,
    model: 'deepseek-v4-flash',
    provider: 'deepseek-official',
    inputTokens: 100,
    outputTokens: 200,
    cacheReadTokens: 300,
    cacheWriteTokens: 0,
    reasoningTokens: 50,
    unit: { hit: 0.02, miss: 1, out: 4 }
  })
  assert.deepEqual(rec.unit, { hit: 0.02, miss: 1, out: 4 })
  assert.equal(
    costFromUnit(rec.unit, rec.cacheReadTokens, rec.inputTokens, rec.outputTokens),
    (300 * 0.02 + 100 * 1 + 200 * 4) / 1e6
  )
  // reasoningTokens(50) 已包含在 outputTokens(200) 内，不得另计
  assert.equal(billableTokens(rec), 600)
})

test('model ids still collapse onto the official pricing keys', () => {
  assert.equal(modelKeyOf('deepseek-flash'), 'deepseek-flash')
  assert.equal(modelKeyOf('deepseek-v4-flash'), 'deepseek-flash')
  assert.equal(modelKeyOf('deepseek-v4-flash-vision-exp'), 'deepseek-flash')
  assert.equal(modelKeyOf('deepseek-v4-pro'), 'deepseek-v4-pro')
  assert.equal(modelKeyOf('gpt-4o'), 'unknown')
})
