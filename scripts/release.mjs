import { spawnSync } from 'node:child_process'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'

const REPO = 'feiyang-dev/dsh-usage-plugin'
const TAG = 'v1.10.0'

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

function api(method, apiPath, body, contentType = 'application/json', host = 'api.github.com') {
  return new Promise((resolve) => {
    const cred = getCredential()
    const isBuffer = Buffer.isBuffer(body)
    const req = https.request({
      host,
      path: apiPath,
      method,
      headers: {
        'Authorization': `Bearer ${cred.password || ''}`,
        'User-Agent': 'dsh-usage-plugin-publish',
        'Accept': 'application/vnd.github+json',
        'Content-Type': contentType,
        ...(body != null ? { 'Content-Length': isBuffer ? body.length : Buffer.byteLength(body) } : {}),
      },
      rejectUnauthorized: false,
    }, (res) => {
      let data = ''
      res.on('data', (d) => data += d)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', (e) => resolve({ status: 0, body: e.message }))
    if (body != null) req.write(body)
    req.end()
  })
}

function extractChangelog(tag) {
  const text = fs.readFileSync(path.join(process.cwd(), 'CHANGELOG.md'), 'utf8')
  const lines = text.split('\n')
  const re = new RegExp('^## ' + tag.replace(/\./g, '\\.') + '\\b')
  const start = lines.findIndex((l) => re.test(l))
  if (start < 0) return ''
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## v\d/.test(lines[i])) { end = i; break }
  }
  return lines.slice(start, end).join('\n').trim()
}

const body = extractChangelog(TAG)
if (!body) { console.error('changelog section not found for', TAG); process.exit(1) }

console.log('Creating release', TAG, 'for', REPO)
const created = await api('POST', `/repos/${REPO}/releases`, JSON.stringify({
  tag_name: TAG,
  name: TAG,
  body,
  draft: false,
  prerelease: false,
}))
console.log('create status:', created.status)
if (created.status !== 201) {
  console.error('create failed:', created.body.slice(0, 600))
  process.exit(1)
}
const release = JSON.parse(created.body)
console.log('release id:', release.id, 'url:', release.html_url)

// 打包并上传 tarball 作为附件
const pack = spawnSync('npm', ['pack'], { encoding: 'utf8' })
const tgzName = (pack.stdout || '').trim().split('\n').pop()
if (tgzName && fs.existsSync(tgzName)) {
  const buf = fs.readFileSync(tgzName)
  const assetPath = `/repos/${REPO}/releases/${release.id}/assets?name=${encodeURIComponent(tgzName)}`
  console.log('uploading asset', tgzName, buf.length)
  const asset = await api('POST', assetPath, buf, 'application/octet-stream', 'uploads.github.com')
  console.log('asset status:', asset.status)
  if (asset.status === 201) console.log('asset url:', JSON.parse(asset.body).browser_download_url)
  else console.error('asset body:', asset.body.slice(0, 400))
  try { fs.unlinkSync(tgzName) } catch (e) {}
} else {
  console.log('no tarball produced; skip asset upload')
}
console.log('DONE')
