import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pathToFileURL } from 'node:url'

const root = process.argv[2]
os.homedir = () => path.join(root, 'home')
process.env.DSH_USAGE_DATA_DIR = path.join(root, 'data')
process.env.LOCALAPPDATA = path.join(root, 'local')
process.env.APPDATA = path.join(root, 'roaming')
const { Context } = await import(process.env.DSH_USAGE_TEST_CORDIS ?? '@deepseek-ai/cordis')
const { default: plugin } = await import(pathToFileURL(process.argv[3]).href)
const context = new Context()
const routes = new Map()
let removed = 0
const server = { register(route) {
  assert.equal(routes.has(route.path), false, 'duplicate exact route')
  routes.set(route.path, route)
  return () => { removed++; routes.delete(route.path) }
} }
context.provide('webServer', server)
const mount = () => context.plugin(scope => plugin.apply(scope))
let fiber = mount()
await fiber.await()
const call = async (handler, action) => new Promise((resolve, reject) => {
  handler(Readable.from([JSON.stringify(action)]), { writeHead() {}, end(text) { resolve(JSON.parse(text)) } }).catch(reject)
})
const rename = fs.rename
const entered = Promise.withResolvers()
const release = Promise.withResolvers()
try {
  const api = routes.get('/usage/api').handler
  await call(api, { action: 'balanceProviders' })
  const events = routes.get('/usage/api/events').handler
  const req = new Readable({ read() {} })
  let ended = 0
  let writes = 0
  const res = { writeHead() {}, write() { assert.equal(ended, 0, 'write after SSE end'); writes++ }, end() { ended++ } }
  events(req, res)
  assert.equal(writes, 1)
  const brokenReq = new Readable({ read() {} })
  let brokenWrites = 0
  let brokenEnds = 0
  events(brokenReq, { writableEnded: false, destroyed: false, writeHead() {}, write() {
    brokenWrites++
    if (brokenWrites > 1) throw new Error('synthetic subscriber write failure')
  }, end() { brokenEnds++; this.writableEnded = true } })
  assert.equal(brokenReq.listenerCount('close'), 1)
  const terminated = ['writableEnded', 'destroyed'].map(flag => {
    const request = new Readable({ read() {} })
    let attempts = 0
    let ends = 0
    const response = { writableEnded: false, destroyed: false, writeHead() {}, write() {
      if (++attempts > 1) throw new Error('synthetic terminated subscriber')
    }, end() { ends++ } }
    events(request, response)
    response[flag] = true
    return { request, ends: () => ends }
  })
  await context.parallel('session/event', { id: 'synthetic-notify' }, { type: 'web/deepseek-search-llm-request', time: 1,
    data: { endpoint: 'https://api.deepseek.com/chat/completions', body: { model: 'deepseek-flash', messages: [] } } })
  assert.equal(brokenWrites, 2, 'notification reaches the failing subscriber once')
  assert.equal(brokenReq.listenerCount('close'), 0, 'a failed write detaches the subscriber close listener')
  assert.equal(brokenEnds, 1, 'a failed subscriber response is ended exactly once')
  for (const entry of terminated) {
    assert.equal(entry.ends(), 0, 'terminated Node responses are not ended again')
    assert.equal(entry.request.listenerCount('close'), 0)
  }
  const expectedWrites = writes
  fs.rename = async (from, to) => {
    if (path.basename(to) === 'usage-records.json') { entered.resolve(); await release.promise }
    return rename(from, to)
  }
  context.emit('session/event', { id: 'synthetic' }, { type: 'web/deepseek-search-llm-request', time: 1,
    data: { endpoint: 'https://api.deepseek.com/chat/completions', body: { model: 'deepseek-flash', messages: [] } } })
  await entered.promise
  const teardown = fiber.dispose()
  await new Promise(resolve => setImmediate(resolve))
  const wasClosed = ended === 1
  release.resolve()
  await teardown
  assert.equal(wasClosed, true, 'owned SSE closes before delayed persistence completes')
  assert.equal(req.listenerCount('close'), 0)
  assert.equal(routes.size, 0, 'the returned route disposers actually remove both paths')
  assert.equal(removed, 2)
  assert.equal(brokenEnds, 1, 'unload never ends the removed failed subscriber twice')
  assert.equal(writes, expectedWrites, 'late persistence never writes to an ended subscriber')
  events(new Readable({ read() {} }), res)
  assert.equal(ended, 2, 'retained SSE callback cannot admit new subscriber after unload')
  fs.rename = rename
  fiber = mount()
  await fiber.await()
  assert.equal(routes.size, 2)
  assert.notEqual(routes.get('/usage/api').handler, api)
  assert.equal((await call(routes.get('/usage/api').handler, { action: 'balanceProviders' })).ok, true)
  console.log(JSON.stringify({ pathsRemoved: true, remountOwnsPaths: true, sseEnded: true, listenerDetached: true, noLateNotification: true }))
} finally { release.resolve(); fs.rename = rename; await context.fiber.dispose() }
