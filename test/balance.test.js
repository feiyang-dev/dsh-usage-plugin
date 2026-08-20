import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getBalanceProvider,
  matchesModelProvider,
  parseBalanceResponse,
  providerList,
  resolveBalanceEndpoint
} from '../lib/balance.js'

test('lists every balance provider and defaults to DeepSeek', () => {
  assert.deepEqual(providerList().map((p) => p.id), [
    'deepseek', 'siliconflow', 'digitalocean', 'amd-gpu-cloud'
  ])
  assert.equal(getBalanceProvider().id, 'deepseek')
  assert.equal(getBalanceProvider('unknown'), null)
  assert.match(providerList().find((p) => p.id === 'digitalocean').credentialHelpUrl, /digitalocean/)
  assert.match(providerList().find((p) => p.id === 'amd-gpu-cloud').credentialHelpUrl, /amd\.com/)
})

test('normalizes DeepSeek balance response', () => {
  const res = parseBalanceResponse('deepseek', JSON.stringify({
    is_available: true,
    balance_infos: [{
      currency: 'CNY', total_balance: '12.34', granted_balance: '2.34', topped_up_balance: '10.00'
    }]
  }))
  assert.equal(res.ok, true)
  assert.equal(res.totalBalance, '12.34')
  assert.equal(res.isAvailable, true)
  assert.equal(res.infos[0].toppedUpBalance, '10.00')
  assert.deepEqual(res.details.map((d) => d.value), ['10.00', '2.34'])
})

test('does not report DeepSeek unavailable when the field is omitted', () => {
  const res = parseBalanceResponse('deepseek', JSON.stringify({
    balance_infos: [{ currency: 'CNY', total_balance: '1.00' }]
  }))
  assert.equal(res.ok, true)
  assert.equal(res.isAvailable, null)
})

test('normalizes researched SiliconFlow user info fields', () => {
  const res = parseBalanceResponse('siliconflow', JSON.stringify({
    code: 20000,
    data: { balance: '3.25', chargeBalance: '8.75', totalBalance: '12.00' }
  }))
  assert.equal(res.ok, true)
  assert.equal(res.currency, 'CNY')
  assert.equal(res.totalBalance, '12.00')
  assert.equal(res.zeroBalance, false)
  assert.deepEqual(res.details.map((d) => d.value), ['8.75', '3.25'])
  assert.deepEqual(res.fieldDefinitions.map((d) => d.name), ['totalBalance', 'chargeBalance', 'balance'])
  assert.match(res.sourceNote, /代金券/)
})

test('marks a successful all-zero SiliconFlow response for UI diagnostics', () => {
  const res = parseBalanceResponse('siliconflow', JSON.stringify({
    code: 20000,
    data: { balance: '0', chargeBalance: '0', totalBalance: '0' }
  }))
  assert.equal(res.ok, true)
  assert.equal(res.zeroBalance, true)
})

test('matches custom model provider routes without confusing unrelated providers', () => {
  assert.equal(matchesModelProvider('siliconflow', 'siliconflow', ''), true)
  assert.equal(matchesModelProvider('siliconflow', 'custom-route', 'SiliconFlow'), true)
  assert.equal(matchesModelProvider('digitalocean', 'digital-ocean', ''), true)
  assert.equal(matchesModelProvider('siliconflow', 'digital-ocean', ''), false)
})

test('uses only official SiliconFlow hosts for balance requests', () => {
  assert.equal(
    resolveBalanceEndpoint('siliconflow', 'https://api.siliconflow.com/v1'),
    'https://api.siliconflow.com/v1/user/info'
  )
  assert.equal(
    resolveBalanceEndpoint('siliconflow', 'https://api.siliconflow.cn/v1/chat/completions'),
    'https://api.siliconflow.cn/v1/user/info'
  )
  assert.equal(
    resolveBalanceEndpoint('siliconflow', 'https://example.com/v1'),
    'https://api.siliconflow.cn/v1/user/info'
  )
  assert.equal(
    resolveBalanceEndpoint('siliconflow', 'http://api.siliconflow.com/v1'),
    'https://api.siliconflow.cn/v1/user/info'
  )
})

test('normalizes DigitalOcean account billing balance', () => {
  const res = parseBalanceResponse('digitalocean', JSON.stringify({
    month_to_date_balance: '23.44',
    account_balance: '12.23',
    month_to_date_usage: '11.21',
    generated_at: '2019-07-09T15:01:12Z'
  }))
  assert.equal(res.ok, true)
  assert.equal(res.currency, 'USD')
  assert.equal(res.totalBalance, '12.23')
  assert.equal(res.balanceKind, 'due')
  assert.equal(res.balanceLabel, '待结算账户余额')
  assert.equal(res.monthToDateUsage, '11.21')
  assert.equal(res.monthToDateBalance, '23.44')
  assert.deepEqual(res.details.map((d) => d.value), ['11.21'])
})

test('shows a negative DigitalOcean account balance as available credit', () => {
  const res = parseBalanceResponse('digitalocean', JSON.stringify({
    month_to_date_balance: '-13.00',
    account_balance: '-13.00',
    month_to_date_usage: '0.00',
    generated_at: '2026-08-18T06:35:32Z'
  }))
  assert.equal(res.ok, true)
  assert.equal(res.totalBalance, '13')
  assert.equal(res.balanceKind, 'credit')
  assert.equal(res.balanceLabel, '可用信用余额')
  assert.equal(res.rawAccountBalance, '-13.00')
  assert.equal(res.monthToDateUsage, '0.00')
  assert.equal(res.monthToDateBalance, '-13.00')
  assert.deepEqual(res.details.map((d) => d.value), ['0.00'])
})

test('rejects API errors and unrecognized response shapes', () => {
  assert.match(parseBalanceResponse('siliconflow', '{"code":401,"message":"bad key"}').error, /bad key/)
  assert.match(parseBalanceResponse('digitalocean', '{}').error, /account_balance/)
  assert.match(parseBalanceResponse('deepseek', 'not json').error, /无法解析/)
})
