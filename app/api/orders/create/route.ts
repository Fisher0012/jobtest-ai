import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOrder } from '@/app/lib/orders'
import { initiatePayment } from '@/app/lib/payment'

const Schema = z.object({
  provider: z.enum(['mock', 'wechat', 'alipay']).default('mock'),
  jobTitle: z.string().min(1).max(30),
  openid: z.string().optional(),
})

const PRICE_CENTS = 990  // ¥9.90

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { provider, jobTitle, openid } = Schema.parse(body)

    const order  = createOrder(provider, PRICE_CENTS, jobTitle)
    const result = await initiatePayment(order, openid)

    return NextResponse.json({
      orderId:   order.id,
      amount:    order.amount,
      expiresAt: order.expiresAt,
      ...result,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }
    console.error('[orders/create]', err)
    const errorMessage = err instanceof Error ? err.message : '创建订单失败'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
