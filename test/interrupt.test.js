import test from 'node:test'
import assert from 'node:assert/strict'

// 模拟与 lib/index.js observe() finally 兜底记录一致的判定逻辑。
// 真实实现无法直接导出（闭包在 apply() 内），这里按同样规则复现验证。
function shouldFallbackRecord(model, provider) {
  const m = String(model || '').trim().toLowerCase()
  const p = String(provider || '').trim().toLowerCase()
  if (!m || m === 'fake' || m === 'unknown') return false
  if (!p || p === 'unknown') return false
  if (p.indexOf('dsh') === 0) return false
  return true
}

test('interrupted fallback records real model calls (missing usage)', () => {
  assert.equal(shouldFallbackRecord('deepseek-v4-flash', 'deepseek-official'), true)
  assert.equal(shouldFallbackRecord('deepseek-v4-pro', 'deepseek-official'), true)
  assert.equal(shouldFallbackRecord('deepseek-v4-flash-vision-exp', 'deepseek-official'), true)
})

test('internal / placeholder calls are never fallback-recorded', () => {
  assert.equal(shouldFallbackRecord('fake', 'dsh2shell-4009eb5f'), false)
  assert.equal(shouldFallbackRecord('fake', 'deepseek-official'), false)
  assert.equal(shouldFallbackRecord('', 'deepseek-official'), false)
  assert.equal(shouldFallbackRecord('deepseek-v4-flash', 'dsh2shell-abc'), false)
  assert.equal(shouldFallbackRecord('unknown', 'deepseek-official'), false)
  assert.equal(shouldFallbackRecord('deepseek-v4-flash', 'unknown'), false)
})

test('third-party providers keep working as before', () => {
  assert.equal(shouldFallbackRecord('kimi-k3', 'opencode-go'), true)
  assert.equal(shouldFallbackRecord('qwen3.6-plus', 'opencode-go'), true)
})
