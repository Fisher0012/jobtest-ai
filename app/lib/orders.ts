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
  paidAt?:   number
}

// In-memory store — resets on server restart; swap for Redis/DB in production
const ORDERS = new Map<string, Order>()
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
