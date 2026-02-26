import { NextRequest, NextResponse } from 'next/server'
import { getOrder } from '@/app/lib/orders'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const order = getOrder(params.id)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  return NextResponse.json({
    status: order.status,
    paidAt: order.paidAt,
  })
}
