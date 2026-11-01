import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// 性能守卫：这几条一旦回退，面板就会重新变成"每 10 秒全量重取 + 全量重渲染"，
// 表现为打字/切页签卡顿。

const here = path.dirname(fileURLToPath(import.meta.url))
const read = (rel) => fs.readFileSync(path.join(here, '..', 'lib', rel), 'utf8')

test('the client polls with the lightweight stat endpoint, not full list', () => {
  const client = read('client.js')
  assert.match(client, /action:\s*"stat"/, 'client must probe /usage/api stat before refetching')
  assert.match(client, /timer\.interval\(poll,/, 'the interval must call poll(), not refresh()')
})

test('the host exposes a stat action and list carries the same fingerprint fields', () => {
  const host = read('index.js')
  assert.match(host, /case 'stat':/, 'host must implement the stat action')
  for (const field of ['count', 'latest', 'pricingVersion']) {
    assert.match(host, new RegExp('\\b' + field + '\\b'), 'stat/list must expose ' + field)
  }
})

test('record projection and aggregation are memoized', () => {
  const client = read('client.js')
  assert.match(client, /React\.useMemo\(function \(\) \{\s*return aggregateRecords/, 'aggregateRecords must be memoized')
  const host = read('index.js')
  assert.match(host, /projectionCache\.get\(r\)/, 'host must cache per-record projection')
})

test('the balance/FX path never spawns a node subprocess on the happy path', () => {
  const host = read('index.js')
  // 子进程只允许作为 undici 不可用时的兜底存在
  const calls = host.match(/await spawnNode\(/g) || []
  assert.ok(calls.length <= 2, 'spawnNode should only remain as a fallback (found ' + calls.length + ')')
})
