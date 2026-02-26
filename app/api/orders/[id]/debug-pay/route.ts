import { NextRequest, NextResponse } from 'next/server'
import { markPaid, getOrder } from '@/app/lib/orders'

// 调试专用：立即将订单标记为已付款
// 生产环境（PAYMENT_PROVIDER=wechat/alipay）时自动 403 拒绝
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const isProduction =
    process.env.NODE_ENV === 'production' &&
    process.env.PAYMENT_PROVIDER !== 'mock'

  if (isProduction) {
    return NextResponse.json({ error: '生产环境不可用' }, { status: 403 })
  }

  const order = getOrder(params.id)
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }
  if (order.status === 'expired') {
    return NextResponse.json({ error: '订单已过期' }, { status: 410 })
  }

  const changed = markPaid(params.id)
  return NextResponse.json({
    ok:      true,
    changed,            // false = 已经是 paid，仍然安全（幂等）
    orderId: params.id,
    status:  'paid',
  })
}
