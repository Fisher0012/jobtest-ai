import { randomUUID } from 'node:crypto'

export type OrderStatus = 'pending' | 'paid' | 'expired'
export type PayProvider = 'mock' | 'wechat' | 'alipay'

export interface Order {
  id:        string
  status:    OrderStatus
  provider:  PayProvider
  amount:    number        // 分 (RMB cents)
  jobTitle:  string
  createdAt: number
  expiresAt: number
  paidAt?:     number
  shopItemId?: string  // 小红书商品ID（用于免费获取报告）
}
// In-memory store — resets on server restart; swap for Redis/DB in production
// Attached to global to survive Next.js module isolation across API routes
const g = global as typeof global & { __orders?: Map<string, Order> }
if (!g.__orders) g.__orders = new Map<string, Order>()
const ORDERS = g.__orders
const TTL_MS = 30 * 60 * 1000  // 30 分钟

function sweepExpired() {
  const now = Date.now()
  for (const [id, order] of ORDERS) {
    if (order.status === 'pending' && now > order.expiresAt) {
      ORDERS.set(id, { ...order, status: 'expired' })
    }
  }
}

export function createOrder(provider: PayProvider, amount: number, jobTitle: string): Order {
  sweepExpired()
  const id  = randomUUID()
  const now = Date.now()
  const order: Order = {
    id, provider, amount, jobTitle,
    status:    'pending',
    createdAt: now,
    expiresAt: now + TTL_MS,
  }
  ORDERS.set(id, order)
  return order
}

export function getOrder(id: string): Order | undefined {
  sweepExpired()
  return ORDERS.get(id)
}

export function markPaid(id: string): boolean {
  const order = ORDERS.get(id)
  if (!order || order.status !== 'pending') return false
  ORDERS.set(id, { ...order, status: 'paid', paidAt: Date.now() })
  return true
}

export function isPaid(id: string): boolean {
  return ORDERS.get(id)?.status === 'paid'
}

// 预定义的小红书商品ID（用于免费获取报告）
export const SHOP_ITEM_ID = process.env.NEXT_PUBLIC_SHOP_ITEM_ID || 'shop_item_default'

export function createShopOrder(shopItemId: string, amount: number, jobTitle: string): Order {
  sweepExpired()
  const id = randomUUID()
  const now = Date.now()
  const order: Order = {
    id, provider: 'mock', shopItemId, amount, jobTitle,
    status: 'pending',
    createdAt: now,
    expiresAt: now + TTL_MS,
  }
  ORDERS.set(id, order)
  return order
}

export function markShopOrderPaid(shopItemId: string): boolean {
  const now = Date.now()
  let marked = false
  
  // 查找匹配的订单（最近的未过期订单）
  for (const [id, order] of ORDERS) {
    if (order.shopItemId === shopItemId && order.status === 'pending' && now <= order.expiresAt) {
      ORDERS.set(id, { ...order, status: 'paid', paidAt: now })
      marked = true
    }
  }
  
  return marked
}

export function isShopOrderPaid(shopItemId: string): boolean {
  const now = Date.now()
  
  for (const [id, order] of ORDERS) {
    if (order.shopItemId === shopItemId && order.status === 'paid' && now <= order.expiresAt) {
      return true
    }
  }
  
  return false
}
