const PROVIDERS = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    credentialNames: ['DEEPSEEK_API_KEY'],
    endpoint: 'https://api.deepseek.com/user/balance',
    credentialHint: 'DEEPSEEK_API_KEY（推理 Key）',
    queryMode: 'direct',
    modelProviderAliases: ['deepseek']
  },
  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    credentialNames: [],
    endpoint: 'https://api.siliconflow.cn/v1/user/info',
    credentialHint: '模型设置中名为 siliconflow 的提供商所引用的 API Key',
    queryMode: 'direct',
    modelProviderAliases: ['siliconflow', 'silicon-flow'],
    credentialHelpUrl: 'https://cloud.siliconflow.cn/account/ak'
  },
  digitalocean: {
    id: 'digitalocean',
    name: 'DigitalOcean',
    credentialNames: ['DIGITALOCEAN_TOKEN', 'DIGITALOCEAN_ACCESS_TOKEN'],
    endpoint: 'https://api.digitalocean.com/v2/customers/my/balance',
    credentialHint: 'DIGITALOCEAN_TOKEN（账户级 Personal Access Token，不是 DO AI 推理 Key）',
    queryMode: 'account',
    modelProviderAliases: ['digitalocean', 'digital-ocean'],
    credentialHelpUrl: 'https://cloud.digitalocean.com/account/api/tokens'
  },
  'amd-gpu-cloud': {
    id: 'amd-gpu-cloud',
    name: 'AMD GPU Cloud',
    credentialNames: [],
    endpoint: '',
    credentialHint: 'AMD GPU Cloud 当前未公开余额查询端点',
    queryMode: 'unsupported',
    modelProviderAliases: ['amd', 'amd-gpu-cloud'],
    credentialHelpUrl: 'https://www.amd.com/en/developer/resources/cloud-access/amd-developer-cloud.html'
  }
}

export const BALANCE_PROVIDERS = Object.freeze(PROVIDERS)

export function providerList() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    credentialHint: p.credentialHint,
    queryMode: p.queryMode,
    credentialHelpUrl: p.credentialHelpUrl || ''
  }))
}

export function getBalanceProvider(id) {
  return PROVIDERS[String(id || 'deepseek').toLowerCase()] || null
}

function normalizedRoute(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function matchesModelProvider(providerId, routeId, displayName) {
  const provider = getBalanceProvider(providerId)
  if (!provider) return false
  const candidates = [routeId, displayName].map(normalizedRoute).filter(Boolean)
  const aliases = (provider.modelProviderAliases || []).map(normalizedRoute)
  return candidates.some((candidate) => aliases.includes(candidate))
}

export function resolveBalanceEndpoint(providerId, modelBaseURL) {
  const provider = getBalanceProvider(providerId)
  if (!provider) return ''
  if (provider.id !== 'siliconflow' || !modelBaseURL) return provider.endpoint
  try {
    const url = new URL(String(modelBaseURL))
    const allowed = url.protocol === 'https:'
      && !url.username
      && !url.password
      && !url.port
      && (url.hostname === 'api.siliconflow.cn' || url.hostname === 'api.siliconflow.com')
    if (allowed) return url.origin + '/v1/user/info'
  } catch (e) {}
  return provider.endpoint
}

function fail(message) {
  return { ok: false, error: message }
}

function json(text) {
  try { return JSON.parse(text) } catch (e) { return null }
}

function value(source, names) {
  if (!source || typeof source !== 'object') return undefined
  for (const name of names) {
    if (source[name] !== undefined && source[name] !== null && source[name] !== '') return source[name]
  }
  return undefined
}

function money(v, fallback = '0') {
  return String(v === undefined || v === null || v === '' ? fallback : v)
}

function result(provider, fields) {
  return {
    ok: true,
    provider: provider.id,
    providerName: provider.name,
    queriedAt: Date.now(),
    ...fields
  }
}

function parseDeepSeek(provider, data) {
  const infos = data && Array.isArray(data.balance_infos) ? data.balance_infos : []
  if (!infos.length) return fail('DeepSeek 响应中没有余额信息')
  const b = infos[0] || {}
  const legacyInfo = {
    currency: String(b.currency || 'CNY'),
    totalBalance: money(b.total_balance),
    grantedBalance: money(b.granted_balance),
    toppedUpBalance: money(b.topped_up_balance)
  }
  return result(provider, {
    currency: legacyInfo.currency,
    isAvailable: data.is_available == null ? null : data.is_available === true,
    totalBalance: legacyInfo.totalBalance,
    infos: [legacyInfo],
    details: [
      { label: '充值余额', value: legacyInfo.toppedUpBalance, hint: '实际充值' },
      { label: '赠送余额', value: legacyInfo.grantedBalance, hint: '平台赠送' }
    ],
    sourceNote: '数据来自 DeepSeek 官方 /user/balance 接口。'
  })
}

function parseSiliconFlow(provider, data) {
  if (data && data.code !== undefined && Number(data.code) !== 20000) {
    return fail('SiliconFlow 接口返回错误：' + String(data.message || data.code))
  }
  const d = data && data.data && typeof data.data === 'object' ? data.data : data
  const total = value(d, ['totalBalance', 'total_balance'])
  const granted = value(d, ['balance', 'grantedBalance', 'granted_balance'])
  const charged = value(d, ['chargeBalance', 'charge_balance', 'toppedUpBalance', 'topped_up_balance'])
  if (total === undefined && granted === undefined && charged === undefined) {
    return fail('SiliconFlow 响应中没有可识别的余额字段')
  }
  const computed = total !== undefined ? total : (Number(granted || 0) + Number(charged || 0))
  const numeric = [computed, granted || 0, charged || 0].map((entry) => Number(entry))
  return result(provider, {
    currency: String(value(d, ['currency']) || 'CNY'),
    isAvailable: null,
    totalBalance: money(computed),
    zeroBalance: numeric.every((entry) => Number.isFinite(entry) && entry === 0),
    details: [
      { label: '充值余额', value: money(charged), hint: 'chargeBalance · 用户充值余额' },
      { label: '赠送/旧免费余额', value: money(granted), hint: 'balance · 旧版赠送余额字段' }
    ],
    fieldDefinitions: [
      { name: 'totalBalance', meaning: '公开 API 返回的总余额，通常为 balance 与 chargeBalance 的合计' },
      { name: 'chargeBalance', meaning: '用户充值形成的余额' },
      { name: 'balance', meaning: '赠送或旧版免费余额字段' }
    ],
    sourceNote: '数据来自 SiliconFlow 官方 /v1/user/info 接口；该接口未公开代金券或历史用量字段，数值可能与控制台可用总额不同。'
  })
}

function parseDigitalOcean(provider, data) {
  const account = value(data, ['account_balance'])
  if (account === undefined) return fail('DigitalOcean 响应中没有 account_balance 字段')
  const accountNumber = Number(account)
  if (!Number.isFinite(accountNumber)) return fail('DigitalOcean account_balance 不是有效数字')
  const credit = accountNumber < 0 ? Math.abs(accountNumber) : 0
  const due = accountNumber > 0 ? accountNumber : 0
  const balanceKind = credit > 0 ? 'credit' : (due > 0 ? 'due' : 'settled')
  return result(provider, {
    currency: 'USD',
    isAvailable: null,
    totalBalance: money(credit > 0 ? credit : due),
    balanceKind,
    balanceLabel: balanceKind === 'credit' ? '可用信用余额' : (balanceKind === 'due' ? '待结算账户余额' : '账户余额'),
    rawAccountBalance: money(account),
    monthToDateUsage: money(value(data, ['month_to_date_usage'])),
    monthToDateBalance: money(value(data, ['month_to_date_balance'])),
    details: [
      { label: '本月至今使用', value: money(value(data, ['month_to_date_usage'])), hint: 'month_to_date_usage · 当前账期使用金额' }
    ],
    generatedAt: String(value(data, ['generated_at']) || ''),
    sourceNote: '数据来自 DigitalOcean 账户级 Billing API；负数账户余额按可用信用额取绝对值展示，DO AI 推理 Key 不能用于此查询。'
  })
}

export function parseBalanceResponse(providerId, text) {
  const provider = getBalanceProvider(providerId)
  if (!provider) return fail('不支持的余额服务商：' + String(providerId || ''))
  const data = json(text)
  if (data === null) return fail('无法解析 ' + provider.name + ' 余额响应')
  if (provider.id === 'deepseek') return parseDeepSeek(provider, data)
  if (provider.id === 'siliconflow') return parseSiliconFlow(provider, data)
  if (provider.id === 'digitalocean') return parseDigitalOcean(provider, data)
  return fail(provider.name + ' 当前没有可用的公开余额查询接口')
}
