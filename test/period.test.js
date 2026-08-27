import test from 'node:test'
import assert from 'node:assert/strict'
import { isPeakAt, WEEKEND_FLAT_AT } from '../lib/index.js'

// 回归用例来自 issue #9：周末（2026-08-23 北京时间 00:00 起）全天按空闲价，
// 星期必须取自平移后的北京时间，且生效前不得追溯打折。
const CASES = [
  // [时刻 (UTC), 北京时间, 应判]
  ['2026-08-23T01:30:00Z', '周日 09:30', false], // 周末 + 生效后 → 空闲
  ['2026-08-23T07:00:00Z', '周日 15:00', false], // 周末 + 生效后 → 空闲
  ['2026-08-24T01:30:00Z', '周一 09:30', true], // 工作日高峰窗口 → 高峰
  ['2026-08-22T01:30:00Z', '周六 09:30（生效前）', true], // 生效前仍按原规则 → 高峰
  ['2026-08-28T16:30:00Z', '周六 00:30（UTC 还是周五）', false] // 平移后取星期 → 周末空闲
]

test('host isPeakAt matches the official weekend flat-rate rule (issue #9)', () => {
  for (const [iso, bj, expected] of CASES) {
    const ts = Date.parse(iso)
    assert.equal(isPeakAt(ts), expected, `${iso} (${bj}) should be ${expected ? 'peak' : 'off-peak'}`)
  }
})

test('weekend flat rate only applies after 2026-08-23 00:00 Beijing time', () => {
  assert.equal(WEEKEND_FLAT_AT, Date.parse('2026-08-22T16:00:00Z'))
  // 生效时刻边界：2026-08-22T15:59:59Z（北京 23:59:59 周六，生效前）仍按旧规则 → 非高峰窗口
  assert.equal(isPeakAt(Date.parse('2026-08-22T15:59:59Z')), false)
  // 生效时刻：2026-08-22T16:00:00Z（北京 08-23 00:00 周日）→ 周末空闲
  assert.equal(isPeakAt(Date.parse('2026-08-22T16:00:00Z')), false)
})

test('weekday peak windows stay 9:00–12:00 and 14:00–18:00 Beijing time', () => {
  // 周一 08:59 北京 → 空闲
  assert.equal(isPeakAt(Date.parse('2026-08-24T00:59:00Z')), false)
  // 周一 09:00 北京 → 高峰（含左端点）
  assert.equal(isPeakAt(Date.parse('2026-08-24T01:00:00Z')), true)
  // 周一 11:59 北京 → 高峰
  assert.equal(isPeakAt(Date.parse('2026-08-24T03:59:00Z')), true)
  // 周一 12:00 北京 → 空闲（不含右端点）
  assert.equal(isPeakAt(Date.parse('2026-08-24T04:00:00Z')), false)
  // 周一 14:00 北京 → 高峰
  assert.equal(isPeakAt(Date.parse('2026-08-24T06:00:00Z')), true)
  // 周一 18:00 北京 → 空闲（不含右端点）
  assert.equal(isPeakAt(Date.parse('2026-08-24T10:00:00Z')), false)
})

test('weekend days before the flat-rate rule still use the old peak split', () => {
  // 生效前的周六 09:30 北京 → 高峰（原规则）
  assert.equal(isPeakAt(Date.parse('2026-08-22T01:30:00Z')), true)
  // 生效前的周六 12:30 北京 → 空闲（原规则午间）
  assert.equal(isPeakAt(Date.parse('2026-08-22T04:30:00Z')), false)
  // 生效前的周日 09:30 北京 → 高峰（原规则）
  assert.equal(isPeakAt(Date.parse('2026-08-16T01:30:00Z')), true)
})
