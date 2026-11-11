import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'

const root = process.argv[2]
os.homedir = () => path.join(root, 'home')
process.env.DSH_USAGE_DATA_DIR = path.join(root, 'data')
process.env.LOCALAPPDATA = path.join(root, 'local')
process.env.APPDATA = path.join(root, 'roaming')
const mode = process.argv[4]
const readFile = fs.readFile
const readEntered = Promise.withResolvers()
const readRelease = Promise.withResolvers()
let blockRead = mode === 'init'
let watchLateReads = false
let lateReads = 0
fs.readFile = async (file, ...args) => {
  if (watchLateReads) lateReads++
  if (blockRead && ['usage-records.json', '.dsh-usage-records.json'].includes(path.basename(file))) {
    blockRead = false
    readEntered.resolve()
    await readRelease.promise
  }
  return readFile(file, ...args)
}
const routes = []
const { Context } = await import(process.env.DSH_USAGE_TEST_CORDIS ?? '@deepseek-ai/cordis')
const context = new Context()
let fiber
const entered = Promise.withResolvers()
const release = Promise.withResolvers()
globalThis.lifecycleHttp = { entered, release }
const mock = 'export async function request(){globalThis.lifecycleHttp.entered.resolve();await globalThis.lifecycleHttp.release.promise;return {statusCode:200,headers:{},body:{text:async()=>JSON.stringify([{base:"USD",quote:"CNY",rate:7,date:"2026-01-01"}])}}} export class EnvHttpProxyAgent {}'
const hook = registerHooks({ resolve(name, context, next) { return name === 'undici' ? { shortCircuit: true, url: 'data:text/javascript,' + encodeURIComponent(mock) } : next(name, context) } })
try {
  const { default: plugin } = await import(pathToFileURL(process.argv[3]).href)
  context.provide('webServer', { register: route => { routes.push(route); return () => {} } })
  fiber = context.plugin(scope => plugin.apply(scope))
  await fiber.await()
  const handler = routes.find(route => route.path === '/usage/api').handler
  const call = action => {
    const req = Readable.from([JSON.stringify(action)])
    return new Promise((resolve, reject) => {
      handler(req, { writeHead() {}, end(text) { resolve(JSON.parse(text)) } }).catch(reject)
    })
  }
  if (mode === 'init' || mode === 'event') {
    if (mode === 'event') {
      await call({ action: 'balanceProviders' })
      blockRead = true
      context.emit('session/event', { id: 'synthetic' }, { type: 'web/deepseek-search-llm-request', time: 1,
        data: { endpoint: 'https://api.deepseek.com/chat/completions', body: { model: 'deepseek-flash', messages: [] } } })
    }
    await readEntered.promise
    let finished = false
    const teardown = fiber.dispose().then(() => { finished = true })
    await new Promise(resolve => setImmediate(resolve))
    const waited = !finished
    readRelease.resolve()
    await teardown
    assert.equal(waited, true, 'disposal must join initialization and admitted event persistence')
    const records = JSON.parse(await fs.readFile(path.join(root, 'data/dsh-usage/usage-records.json'), 'utf8'))
    assert.equal(records.length, mode === 'event' ? 1 : 0)
    console.log(JSON.stringify({ ownedWorkJoined: true, expectedRecordsPersisted: true }))
  } else if (mode === 'finalizer') {
    await call({ action: 'balanceProviders' })
    async function* completed() { yield { type: 'usage', usage: { inputTokens: 1, outputTokens: 2 } } }
    const stream = context.bail('llm/stream', { model: 'synthetic', provider: 'digital-ocean' }, completed)
    await stream.next()
    const finalizing = stream.next()
    await entered.promise
    let finished = false
    const teardown = fiber.dispose().then(() => { finished = true })
    await new Promise(resolve => setImmediate(resolve))
    const waited = !finished
    release.resolve()
    await finalizing
    await teardown
    assert.equal(waited, true, 'disposal joins an already-entered bounded stream finalizer')
    const records = JSON.parse(await readFile(path.join(root, 'data/dsh-usage/usage-records.json'), 'utf8'))
    assert.equal(records.length, 1)
    assert.equal(records[0].outputTokens, 2)
    console.log(JSON.stringify({ admittedFinalizerJoined: true, completedUsagePersisted: true }))
  } else if (mode === 'stream') {
    await call({ action: 'balanceProviders' })
    let businessClosed = false
    let callerReturned = false
    const gate = Promise.withResolvers()
    const error = new Error('original model failure')
    async function* business() {
      try {
        yield { type: 'usage', usage: { inputTokens: 1, outputTokens: 2 } }
        await gate.promise
        yield { type: 'text', text: 'model continues' }
        throw error
      } finally { businessClosed = true }
    }
    async function* callerOwned() {
      try { yield { type: 'text', text: 'caller controls return' }; yield { type: 'text', text: 'second' } }
      finally { callerReturned = true }
    }
    const first = context.bail('llm/stream', { model: 'synthetic', provider: 'synthetic' }, business)
    const second = context.bail('llm/stream', { model: 'synthetic', provider: 'synthetic' }, callerOwned)
    assert.equal((await first.next()).value.type, 'usage')
    await second.next()
    await fiber.dispose()
    assert.equal(businessClosed, false, 'unload must leave the caller model running')
    assert.equal(callerReturned, false, 'unload must not return the caller iterator')
    watchLateReads = true
    gate.resolve()
    assert.equal((await first.next()).value.text, 'model continues')
    await assert.rejects(first.next(), failure => failure === error)
    await second.return('caller result')
    assert.equal(callerReturned, true)
    const records = await call({ action: 'list' })
    assert.equal(records.ok, false, 'statistics admission is closed after unload')
    // The original source starts event/migration reads from its late stream finally.
    const third = context.bail('llm/stream', { model: 'synthetic', provider: 'synthetic' }, business)
    assert.equal(third, undefined, 'the disposed observer listener is removed')
    assert.equal(lateReads, 0, 'late stream finalization must not start telemetry migration')
    const persisted = JSON.parse(await readFile(path.join(root, 'data/dsh-usage/usage-records.json'), 'utf8'))
    assert.equal(persisted.length, 0, 'unfinished model usage is not appended after observer unload')
    console.log(JSON.stringify({ modelContinued: true, originalErrorPreserved: true, callerReturnPreserved: true, noLateUsage: true }))
  } else if (mode === 'write') {
    await call({ action: 'balanceProviders' })
    const writeEntered = Promise.withResolvers()
    const writeRelease = Promise.withResolvers()
    const rename = fs.rename
    fs.rename = async (from, to) => {
      if (path.basename(to) === 'budget.json') { writeEntered.resolve(); await writeRelease.promise }
      return rename(from, to)
    }
    try {
      assert.equal((await call({ action: 'setBudget', monthly: 42 })).ok, true)
      await writeEntered.promise
      let finished = false
      const teardown = fiber.dispose().then(() => { finished = true })
      await new Promise(resolve => setImmediate(resolve))
      const waited = !finished
      writeRelease.resolve()
      await teardown
      assert.equal(waited, true, 'disposal must wait for unawaited persistence from an admitted action')
      const budget = await fs.readFile(path.join(root, 'data/dsh-usage/budget.json'), 'utf8')
      assert.deepEqual(JSON.parse(budget), { monthly: 42 })
      console.log(JSON.stringify({ waitedForPendingWrite: true, admittedBudgetPersisted: true }))
    } finally { fs.rename = rename }
  } else {
  const pending = call({ action: 'fxRefresh' })
  await entered.promise
  let disposed = false
  const teardown = fiber.dispose().then(() => { disposed = true })
  await new Promise(resolve => setImmediate(resolve))
  const waited = !disposed
  release.resolve()
  assert.equal((await pending).ok, true)
  await teardown
  const late = await call({ action: 'setBudget', monthly: 123 })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(waited, true, 'disposal must wait for admitted network work')
  assert.equal(late.ok, false, 'unloaded route must reject new mutations')
  assert.equal(await fs.stat(path.join(root, 'data/dsh-usage/budget.json')).then(() => true, () => false), false, 'late mutation must not write budget data')
  console.log(JSON.stringify({ waitedForAdmittedHttp: waited, rejectedLateMutation: !late.ok, lateBudgetAbsent: true }))
  }
} finally { readRelease.resolve(); fs.readFile = readFile; await context.fiber.dispose(); hook.deregister() }
