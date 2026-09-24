import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PEAK_VALLEY_AT,
  V41_EFFECTIVE_AT,
  PRICE_MODELS,
  PRICE_REGIMES,
  defaultPricing,
  modelKeyOf,
  peakValleyTableOf
} from '../lib/index.js'

// 回归用例：DeepSeek 官方 2026-09-10 12:00（北京时间）起生效的 V4.1 Flash 调价，
// 以及新增模型名 deepseek-flash（旧名 deepseek-v4-flash / deepseek-v4-flash-vision-exp
// 仍可调用，官方已路由到 V4.1 Flash 并按 Flash 单价计费）。

test('price-table epochs are the official Beijing-time instants', () => {
  assert.equal(PEAK_VALLEY_AT, Date.parse('2026-08-17T00:00:00+08:00'))
  assert.equal(V41_EFFECTIVE_AT, Date.parse('2026-09-10T12:00:00+08:00'))
  // 2026-09-10 12:00 北京时间 == 04:00 UTC
  assert.equal(V41_EFFECTIVE_AT, Date.parse('2026-09-10T04:00:00Z'))
})

test('deepseek-flash is priced with the post-V4.1 off-peak/peak table', () => {
  const p = defaultPricing()
  assert.deepEqual(p.peakValleyV41['deepseek-flash'], {
    offPeak: { cacheHit: 0.02, cacheMiss: 1.0, output: 4.0 },
    peak: { cacheHit: 0.04, cacheMiss: 2.0, output: 8.0 }
  })
  // 空闲时段价格为高峰时段价格的一半（官方定价规则）
  const { offPeak, peak } = p.peakValleyV41['deepseek-flash']
  for (const k of ['cacheHit', 'cacheMiss', 'output']) {
    assert.equal(peak[k], offPeak[k] * 2, 'peak.' + k)
  }
})

test('deepseek-v4-pro keeps its previous peak/valley prices after the V4.1 adjustment', () => {
  const p = defaultPricing()
  assert.deepEqual(p.peakValleyV41['deepseek-v4-pro'], p.peakValley['deepseek-v4-pro'])
  assert.deepEqual(p.peakValleyV41['deepseek-v4-pro'], {
    offPeak: { cacheHit: 0.15, cacheMiss: 4.5, output: 13.5 },
    peak: { cacheHit: 0.3, cacheMiss: 9.0, output: 27.0 }
  })
})

test('the first peak/valley table (2026-08-17) is preserved for historical records', () => {
  const p = defaultPricing()
  assert.deepEqual(p.peakValley['deepseek-flash'], {
    offPeak: { cacheHit: 0.05, cacheMiss: 1.5, output: 4.5 },
    peak: { cacheHit: 0.1, cacheMiss: 3.0, output: 9.0 }
  })
  assert.deepEqual(p.base['deepseek-flash'], { cacheHit: 0.02, cacheMiss: 1.0, output: 2.0 })
  assert.deepEqual(p.base['deepseek-v4-pro'], { cacheHit: 0.025, cacheMiss: 3.0, output: 6.0 })
})

test('peakValleyTableOf switches exactly at 2026-09-10 12:00 Beijing time', () => {
  const p = defaultPricing()
  const before = V41_EFFECTIVE_AT - 1
  const at = V41_EFFECTIVE_AT
  assert.equal(peakValleyTableOf(p, before)['deepseek-flash'].offPeak.output, 4.5)
  assert.equal(peakValleyTableOf(p, at)['deepseek-flash'].offPeak.output, 4.0)
  // 边界前一天仍未切换
  assert.equal(peakValleyTableOf(p, Date.parse('2026-09-09T23:59:59+08:00'))['deepseek-flash'].offPeak.output, 4.5)
})

test('model ids collapse onto the new official model keys', () => {
  assert.equal(modelKeyOf('deepseek-flash'), 'deepseek-flash')
  assert.equal(modelKeyOf('deepseek-v4-flash'), 'deepseek-flash')
  assert.equal(modelKeyOf('deepseek-v4-flash-vision-exp'), 'deepseek-flash')
  assert.equal(modelKeyOf('DeepSeek-V4-Flash'), 'deepseek-flash')
  assert.equal(modelKeyOf('deepseek-v4-pro'), 'deepseek-v4-pro')
  assert.equal(modelKeyOf('DeepSeek-V4-Pro-0813'), 'deepseek-v4-pro')
  assert.equal(modelKeyOf('kimi-k3'), 'unknown')
  assert.equal(modelKeyOf(''), 'unknown')
  assert.equal(modelKeyOf(null), 'unknown')
})

test('every pricing model appears in every regime with a complete price row', () => {
  const p = defaultPricing()
  assert.deepEqual(PRICE_MODELS, ['deepseek-flash', 'deepseek-v4-pro'])
  assert.deepEqual(PRICE_REGIMES, ['base', 'peakValley', 'peakValleyV41'])
  for (const regime of PRICE_REGIMES) {
    for (const mk of PRICE_MODELS) {
      const row = p[regime][mk]
      assert.ok(row, regime + '.' + mk + ' is missing')
      if (regime === 'base') {
        for (const k of ['cacheHit', 'cacheMiss', 'output']) {
          assert.equal(typeof row[k], 'number', regime + '.' + mk + '.' + k)
        }
      } else {
        for (const window of ['offPeak', 'peak']) {
          assert.ok(row[window], regime + '.' + mk + '.' + window + ' is missing')
          for (const k of ['cacheHit', 'cacheMiss', 'output']) {
            assert.equal(typeof row[window][k], 'number', regime + '.' + mk + '.' + window + '.' + k)
          }
        }
      }
    }
  }
})

test('defaultPricing returns an independent copy per call', () => {
  const a = defaultPricing()
  const b = defaultPricing()
  a.peakValleyV41['deepseek-flash'].offPeak.output = 999
  assert.equal(b.peakValleyV41['deepseek-flash'].offPeak.output, 4.0)
})
