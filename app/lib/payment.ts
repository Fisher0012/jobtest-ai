import { readFile } from 'node:fs/promises'
import { createSign } from 'node:crypto'
import path from 'node:path'
import type { Order } from './orders'
import { markPaid } from './orders'

export interface PayResult {
  mock:             boolean
  wechatH5Url?:    string
  wechatJSParams?: {
    appId:     string
    timeStamp: string
    nonceStr:  string
    package:   string
    signType:  string
    paySign:   string
  }
  alipayUrl?:      string
}

// ── Mock：立即标记已付款，客户端负责延迟动画（避免 HMR 重置丢单）──
async function mockPay(order: Order): Promise<PayResult> {
  markPaid(order.id)
  return { mock: true }
}

// ── 证书/密钥加载：文件优先，env 兜底 ────────────────────
// 文件路径：private/wechat/<filename>（不进 git）
// Env 回退：支持 Vercel 等云平台，换行用 \n 转义
async function loadPem(filename: string, envVar: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'private', 'wechat', filename)
  try {
    return (await readFile(filePath, 'utf8')).trim()
  } catch {
    const val = process.env[envVar]
    if (!val) throw new Error(
      `WeChat key/cert not found.\n  File: ${filePath}\n  Env:  ${envVar}`
    )
    // Env 里用 \n（两个字符）编码真实换行符
    return val.replace(/\\n/g, '\n').trim()
  }
}

// ── 微信支付 H5（生产环境）───────────────────────────────
async function wechatH5Pay(order: Order): Promise<PayResult> {
  const mchid    = process.env.WECHAT_MCHID!
  const appid    = process.env.WECHAT_APPID!
  const serialNo = process.env.WECHAT_SERIAL_NO!
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL!

  // 私钥：优先从 private/wechat/apiclient_key.pem 读取
  const privateKey = await loadPem('apiclient_key.pem', 'WECHAT_PRIVATE_KEY')

  const apiPath = '/v3/pay/transactions/h5'
  const nonce   = order.id.replace(/-/g, '').slice(0, 32)
  const ts      = String(Math.floor(Date.now() / 1000))
  const payload = JSON.stringify({
    appid, mchid,
    description:  'AI职业危机指数深度报告',
    out_trade_no: order.id,
    notify_url:   `${baseUrl}/api/orders/callback?provider=wechat`,
    amount:       { total: order.amount, currency: 'CNY' },
    scene_info:   { payer_client_ip: '127.0.0.1', h5_info: { type: 'Wap' } },
  })

  // RSA-SHA256 签名，格式：METHOD\nURL\nTIMESTAMP\nNONCE\nBODY\n
  const signMsg = `POST\n${apiPath}\n${ts}\n${nonce}\n${payload}\n`
  const sig     = createSign('RSA-SHA256').update(signMsg).sign(privateKey, 'base64')
  const auth    = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonce}",timestamp="${ts}",serial_no="${serialNo}",signature="${sig}"`

  const res = await fetch(`https://api.mch.weixin.qq.com${apiPath}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body:    payload,
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`WeChat Pay error ${res.status}: ${errText}`)
  }
  const { h5_url } = await res.json() as { h5_url: string }
  return { mock: false, wechatH5Url: h5_url }
}

// ── 微信支付 JSAPI（生产环境）─────────────────────────────
async function wechatJSPay(order: Order, openid?: string): Promise<PayResult> {
  const mchid    = process.env.WECHAT_MCHID!
  const appid    = process.env.WECHAT_APPID!
  const serialNo = process.env.WECHAT_SERIAL_NO!
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL!

  // 私钥：优先从 private/wechat/apiclient_key.pem 读取
  const privateKey = await loadPem('apiclient_key.pem', 'WECHAT_PRIVATE_KEY')

  const apiPath = '/v3/pay/transactions/jsapi'
  const nonce   = order.id.replace(/-/g, '').slice(0, 32)
  const ts      = String(Math.floor(Date.now() / 1000))

  if (!openid) {
    throw new Error('JSAPI支付需要openid参数')
  }

  const payload = JSON.stringify({
    appid,
    mchid,
    description: 'AI职业危机指数深度报告',
    out_trade_no: order.id,
    notify_url: `${baseUrl}/api/orders/callback?provider=wechat`,
    amount: { total: order.amount, currency: 'CNY' },
    payer: { openid },
  })

  // RSA-SHA256 签名，格式：METHOD\nURL\nTIMESTAMP\nNONCE\nBODY\n
  const signMsg = `POST\n${apiPath}\n${ts}\n${nonce}\n${payload}\n`
  const sig     = createSign('RSA-SHA256').update(signMsg).sign(privateKey, 'base64')
  const auth    = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonce}",timestamp="${ts}",serial_no="${serialNo}",signature="${sig}"`

  const res = await fetch(`https://api.mch.weixin.qq.com${apiPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: payload,
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`WeChat Pay JSAPI error ${res.status}: ${errText}`)
  }

  const { prepay_id } = await res.json() as { prepay_id: string }

  // 计算 paySign：appId\ntimeStamp\nnonceStr\npackage\n
  const packageStr = `prepay_id=${prepay_id}`
  const paySignMsg = `${appid}\n${ts}\n${nonce}\n${packageStr}\n`
  const paySign    = createSign('RSA-SHA256').update(paySignMsg).sign(privateKey, 'base64')

  return {
    mock: false,
    wechatJSParams: {
      appId:     appid,
      timeStamp: ts,
      nonceStr:  nonce,
      package:   packageStr,
      signType:  'RSA',
      paySign,
    },
  }
}

// ── 支付宝 H5（生产环境）────────────────────────────────
async function alipayH5(order: Order): Promise<PayResult> {
  const appId      = process.env.ALIPAY_APP_ID!
  const privateKey = await loadPem('alipay_key.pem', 'ALIPAY_PRIVATE_KEY')
  const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL!

  const params: Record<string, string> = {
    app_id:      appId,
    method:      'alipay.trade.wap.pay',
    format:      'JSON',
    charset:     'utf-8',
    sign_type:   'RSA2',
    timestamp:   new Date().toISOString().replace('T', ' ').slice(0, 19),
    version:     '1.0',
    notify_url:  `${baseUrl}/api/orders/callback?provider=alipay`,
    return_url:  `${baseUrl}/`,
    biz_content: JSON.stringify({
      out_trade_no: order.id,
      total_amount: (order.amount / 100).toFixed(2),
      subject:      'AI职业危机指数深度报告',
      product_code: 'QUICK_WAP_WAY',
    }),
  }

  // 按 key 字母排序后拼接，RSA2 = SHA256withRSA
  const signStr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
  params.sign   = createSign('RSA-SHA256').update(signStr).sign(privateKey, 'base64')

  const alipayUrl = 'https://openapi.alipay.com/gateway.do?' +
    Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')

  return { mock: false, alipayUrl }
}

// ── 统一入口 ────────────────────────────────────────────
export async function initiatePayment(order: Order, openid?: string): Promise<PayResult> {
  const envProvider = process.env.PAYMENT_PROVIDER ?? 'mock'
  if (envProvider === 'mock' || order.provider === 'mock' || process.env.NODE_ENV !== 'production') {
    return mockPay(order)
  }
  if (order.provider === 'wechat') {
    if (openid) {
      return wechatJSPay(order, openid)
    } else {
      return wechatH5Pay(order)
    }
  }
  if (order.provider === 'alipay') return alipayH5(order)
  return mockPay(order)
}
