import test from 'node:test'
import assert from 'node:assert/strict'
import {
  costFromUnit,
  defaultPricing,
  isDeepseekProvider,
  modelKeyOf
} from '../lib/index.js'

// 回归用例来自 issue #19：DeepSeek Harness Desktop 0.2.1 里，官方账号那一路的
// provider id 是 `deepseek-account`。旧实现用 `deepseek-official` / `deepseek`
// 两个字面量做白名单，于是这类记录的费用恒为 ¥0，也从不写冻结单价
// （概览页「历史价格提示」的条数等于记录总数）。

test('any deepseek-* provider id bills with the DeepSeek official price table', () => {
  for (const id of ['deepseek', 'deepseek-official', 'deepseek-account', 'deepseek-api-key', ' DeepSeek-Account ']) {
    assert.equal(isDeepseekProvider(id), true, String(id))
  }
})

test('third-party and internal provider ids stay outside the DeepSeek table', () => {
  const ids = [
    'siliconflow', 'digital-ocean', 'digitalocean', 'amd', 'amd-gpu-cloud',
    'alibaba', 'aliyun', 'qwen', 'dsh2shell-4009eb5f', 'unknown', '', null, undefined
  ]
  for (const id of ids) assert.equal(isDeepseekProvider(id), false, String(id))
})

// issue #19 给出的复现数据：5,900,672 缓存命中 / 15,979 未命中输入 / 17,534 输出，
// deepseek-flash 空闲价 0.02 / 1.0 / 4.0 元每百万 tokens，预期约 ¥0.20（而不是 0）。
test('the reported desktop record now costs about ¥0.20', () => {
  const row = defaultPricing().peakValleyV41['deepseek-flash'].offPeak
  assert.equal(modelKeyOf('deepseek-flash'), 'deepseek-flash')
  const cost = costFromUnit(
    { hit: row.cacheHit, miss: row.cacheMiss, out: row.output },
    5900672,
    15979,
    17534
  )
  assert.ok(Math.abs(cost - 0.2041) < 0.001, String(cost))
})
