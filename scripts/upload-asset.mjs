import { spawnSync } from 'node:child_process'
import https from 'node:https'
import fs from 'node:fs'

const REPO = 'feiyang-dev/dsh-usage-plugin'
const RELEASE_ID = 375098880

function getCredential() {
  const input = 'protocol=https\nhost=github.com\n\n'
  const res = spawnSync('git', ['credential', 'fill'], { input, encoding: 'utf8' })
  const cred = {}
  for (const l of (res.stdout || '').split('\n')) {
    const idx = l.indexOf('=')
    if (idx > 0) cred[l.slice(0, idx).trim()] = l.slice(idx + 1).trim()
  }
  return cred
}

function api(method, apiPath, body, contentType, host = 'api.github.com') {
  return new Promise((resolve) => {
    const cred = getCredential()
    const isBuffer = Buffer.isBuffer(body)
    const req = https.request({
      host, path: apiPath, method,
      headers: {
        'Authorization': `Bearer ${cred.password || ''}`,
        'User-Agent': 'dsh-usage-plugin-publish',
        'Accept': 'application/vnd.github+json',
        'Content-Type': contentType,
        ...(body != null ? { 'Content-Length': isBuffer ? body.length : Buffer.byteLength(body) } : {}),
      },
      rejectUnauthorized: false,
    }, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })) })
    req.on('error', (e) => resolve({ status: 0, body: e.message }))
    if (body != null) req.write(body)
    req.end()
  })
}

const tgz = fs.readdirSync('.').find((f) => f.endsWith('.tgz'))
if (!tgz) { console.error('no tarball found'); process.exit(1) }
const buf = fs.readFileSync(tgz)
const assetPath = `/repos/${REPO}/releases/${RELEASE_ID}/assets?name=${encodeURIComponent(tgz)}`
console.log('uploading', tgz, buf.length)
const asset = await api('POST', assetPath, buf, 'application/octet-stream', 'uploads.github.com')
console.log('asset status:', asset.status)
if (asset.status === 201) console.log('asset url:', JSON.parse(asset.body).browser_download_url)
else console.error('asset body:', asset.body.slice(0, 400))
try { fs.unlinkSync(tgz) } catch (e) {}
console.log('DONE')
