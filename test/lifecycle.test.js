import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

test('unload waits for admitted requests and rejects new mutation after disposal', { timeout: 30000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'usage-lifecycle-'))
  try {
    const { stdout } = await promisify(execFile)(process.execPath, [fileURLToPath(new URL('../test-support/lifecycle-worker.mjs', import.meta.url)), root, fileURLToPath(new URL('../lib/index.js', import.meta.url))], { windowsHide: true, timeout: 25000 })
    assert.deepEqual(JSON.parse(stdout), { waitedForAdmittedHttp: true, rejectedLateMutation: true, lateBudgetAbsent: true })
  } finally { await rm(root, { recursive: true, force: true }) }
})


test('unload waits for persistence queued by a completed API action', { timeout: 30000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'usage-lifecycle-write-'))
  try {
    const { stdout } = await promisify(execFile)(process.execPath, [fileURLToPath(new URL('../test-support/lifecycle-worker.mjs', import.meta.url)), root, fileURLToPath(new URL('../lib/index.js', import.meta.url)), 'write'], { windowsHide: true, timeout: 25000 })
    assert.deepEqual(JSON.parse(stdout), { waitedForPendingWrite: true, admittedBudgetPersisted: true })
  } finally { await rm(root, { recursive: true, force: true }) }
})


for (const mode of ['init', 'event', 'stream', 'finalizer']) {
  test(`real Cordis unload owns ${mode} work without taking over the model`, { timeout: 30000 }, async () => {
    const root = await mkdtemp(join(tmpdir(), 'usage-lifecycle-' + mode + '-'))
    try {
      const { stdout } = await promisify(execFile)(process.execPath, [fileURLToPath(new URL('../test-support/lifecycle-worker.mjs', import.meta.url)), root, fileURLToPath(new URL('../lib/index.js', import.meta.url)), mode], { windowsHide: true, timeout: 25000 })
      assert.deepEqual(JSON.parse(stdout), mode === 'stream'
        ? { modelContinued: true, originalErrorPreserved: true, callerReturnPreserved: true, noLateUsage: true }
        : mode === 'finalizer' ? { admittedFinalizerJoined: true, completedUsagePersisted: true }
        : { ownedWorkJoined: true, expectedRecordsPersisted: true })
    } finally { await rm(root, { recursive: true, force: true }) }
  })
}


test('real Cordis releases exact routes and SSE subscriptions before remount', { timeout: 30000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'usage-lifecycle-routes-'))
  try {
    const { stdout } = await promisify(execFile)(process.execPath, [fileURLToPath(new URL('../test-support/routes-worker.mjs', import.meta.url)), root, fileURLToPath(new URL('../lib/index.js', import.meta.url))], { windowsHide: true, timeout: 25000 })
    assert.deepEqual(JSON.parse(stdout), { pathsRemoved: true, remountOwnsPaths: true, sseEnded: true, listenerDetached: true, noLateNotification: true })
  } finally { await rm(root, { recursive: true, force: true }) }
})
