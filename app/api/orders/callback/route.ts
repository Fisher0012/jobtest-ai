import { NextRequest, NextResponse } from 'next/server'
import { createVerify, createDecipheriv } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { markPaid } from '@/app/lib/orders'

// ══════════════════════════════════════════════════════════
//  WeChat Pay v3 回调处理
//  流程：验签（RSA-SHA256 + 平台证书）→ 解密（AES-256-GCM）→ markPaid
// ══════════════════════════════════════════════════════════

// ── 加载证书/密钥文件（文件优先，env 兜底）─────────────────
async function loadPem(filename: string, envVar: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'private', 'wechat', filename)
  try {
    return (await readFile(filePath, 'utf8')).trim()
  } catch {
    const val = process.env[envVar]
    if (!val) throw new Error(
      `WeChat cert/key not found.\n  File: ${filePath}\n  Env: ${envVar}`
    )
    return val.replace(/\\n/g, '\n').trim()
  }
}

// ── 验证微信回调签名 ───────────────────────────────────────
// 签名消息格式（固定换行结尾）：
//   {Wechatpay-Timestamp}\n{Wechatpay-Nonce}\n{body}\n
function verifyWechatSignature(
  timestamp:       string,
  nonce:           string,
  rawBody:         string,
  signature:       string,
  platformCertPem: string,
): boolean {
  const message = `${timestamp}\n${nonce}\n${rawBody}\n`
  try {
    return createVerify('RSA-SHA256')
      .update(message)
      .verify(platformCertPem, signature, 'base64')
  } catch {
    return false
  }
}

// ── 解密 resource 字段（AES-256-GCM）─────────────────────
// 微信密文格式：base64(ciphertext || 16-byte-auth-tag)
// Key:   WECHAT_API_V3_KEY（32字节 ASCII 字符串）
// Nonce: resource.nonce（12字节）
// AAD:   resource.associated_data
function decryptWechatResource(
  ciphertext:     string,
  nonce:          string,
  associatedData: string,
  apiV3Key:       string,
): string {
  const keyBuf    = Buffer.from(apiV3Key, 'utf8')         // 32 bytes
  const cipherBuf = Buffer.from(ciphertext, 'base64')
  // GCM Auth Tag 在密文末尾 16 字节
  const authTag   = cipherBuf.subarray(cipherBuf.length - 16)
  const data      = cipherBuf.subarray(0, cipherBuf.length - 16)

  const decipher = createDecipheriv('aes-256-gcm', keyBuf, Buffer.from(nonce, 'utf8'))
  decipher.setAuthTag(authTag)
  if (associatedData) {
    decipher.setAAD(Buffer.from(associatedData, 'utf8'))
  }
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

// ── 微信支付主处理逻辑 ────────────────────────────────────
async function handleWechat(req: NextRequest): Promise<Response> {
  // 1. 读取原始 body（必须在验签前，stream 只能读一次）
  const rawBody = await req.text()

  // 2. 提取验签所需的 Header
  const timestamp = req.headers.get('Wechatpay-Timestamp') ?? ''
  const nonce     = req.headers.get('Wechatpay-Nonce')     ?? ''
  const signature = req.headers.get('Wechatpay-Signature') ?? ''
  // Wechatpay-Serial 可用于多证书轮换，此处暂不处理

  if (!timestamp || !nonce || !signature) {
    console.warn('[callback/wechat] Missing required headers')
    return NextResponse.json({ code: 'FAIL', message: '缺少必要请求头' }, { status: 400 })
  }

  // 3. 检查 API v3 Key
  const apiV3Key = process.env.WECHAT_API_V3_KEY ?? ''
  if (apiV3Key.length !== 32) {
    console.error('[callback/wechat] WECHAT_API_V3_KEY must be exactly 32 bytes')
    return NextResponse.json({ code: 'FAIL', message: '服务器配置错误' }, { status: 500 })
  }

  // 4. 加载微信平台证书（用来验签）
  let platformCert: string
  try {
    platformCert = await loadPem('platform_cert.pem', 'WECHAT_PLATFORM_CERT')
  } catch (e) {
    console.error('[callback/wechat] Platform cert load failed:', e)
    return NextResponse.json({ code: 'FAIL', message: '证书加载失败' }, { status: 500 })
  }

  // 5. 验证签名（防止非微信来源的伪造请求）
  const valid = verifyWechatSignature(timestamp, nonce, rawBody, signature, platformCert)
  if (!valid) {
    console.warn('[callback/wechat] Signature verification FAILED — possible forgery')
    return NextResponse.json({ code: 'FAIL', message: '签名验证失败' }, { status: 400 })
  }

  // 6. 解析 body
  let body: {
    event_type: string
    resource: {
      ciphertext:      string
      nonce:           string
      associated_data: string
    }
  }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ code: 'FAIL', message: '无效 JSON' }, { status: 400 })
  }

  // 7. 只处理支付成功事件（其他事件如退款/关单直接返回 SUCCESS 以防重推）
  if (body.event_type !== 'TRANSACTION.SUCCESS') {
    console.log(`[callback/wechat] Ignored event: ${body.event_type}`)
    return NextResponse.json({ code: 'SUCCESS', message: '已忽略' })
  }

  // 8. 解密 resource，获取明文交易数据
  let transaction: { out_trade_no: string; trade_state: string; transaction_id?: string }
  try {
    const plaintext = decryptWechatResource(
      body.resource.ciphertext,
      body.resource.nonce,
      body.resource.associated_data,
      apiV3Key,
    )
    transaction = JSON.parse(plaintext)
  } catch (e) {
    console.error('[callback/wechat] Decryption failed:', e)
    return NextResponse.json({ code: 'FAIL', message: '解密失败' }, { status: 400 })
  }

  const { out_trade_no, trade_state, transaction_id } = transaction

  // 9. 幂等标记已付款（markPaid 内部已做 pending 检查，重复调用安全）
  if (trade_state === 'SUCCESS' && out_trade_no) {
    const changed = markPaid(out_trade_no)
    console.log(
      `[callback/wechat] order=${out_trade_no} wx_id=${transaction_id ?? '-'} ` +
      `state=${trade_state} changed=${changed}`
    )
  }

  // 10. 始终返回 SUCCESS，防止微信因超时或失败重复推送
  return NextResponse.json({ code: 'SUCCESS', message: '成功' })
}

// ══════════════════════════════════════════════════════════
//  支付宝回调处理（签名验证待补全）
// ══════════════════════════════════════════════════════════
async function handleAlipay(req: NextRequest): Promise<Response> {
  const text   = await req.text()
  const params = new URLSearchParams(text)

  const orderId = params.get('out_trade_no') ?? ''
  const status  = params.get('trade_status')  ?? ''

  // TODO: 生产环境需要用支付宝公钥验签（RSA2）
  // 参考：https://opendocs.alipay.com/open/204/105301

  if (orderId && (status === 'TRADE_SUCCESS' || status === 'TRADE_FINISHED')) {
    const changed = markPaid(orderId)
    console.log(`[callback/alipay] order=${orderId} status=${status} changed=${changed}`)
  }

  // 支付宝要求返回字符串 "success"
  return new Response('success', { headers: { 'Content-Type': 'text/plain' } })
}

// ══════════════════════════════════════════════════════════
//  Route Handler
// ══════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider')

  try {
    if (provider === 'wechat') return await handleWechat(req)
    if (provider === 'alipay') return await handleAlipay(req)
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  } catch (err) {
    console.error('[orders/callback] Unhandled error:', err)
    // 返回 500 而非 SUCCESS，以便排查；微信会在 24h 内重试最多 15 次
    return NextResponse.json({ code: 'FAIL', message: '内部错误' }, { status: 500 })
  }
}
