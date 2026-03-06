# 深度转型报告 - 双模式获取功能实现

## 🎯 需求

### 两种获取报告方式

**方式1：付费后获取**
- 用户支付后（微信支付/小红书支付）
- 通过 `orderId` 或 `shopItemId` 验证
- 生成深度转型报告

**方式2：小红书商品免费获取**
- 用户在小红书购买特定商品
- 获取商品 ID (`shopItemId`)
- 直接免费获取深度转型报告
- 用于策略 A/B 测试和转化数据对比

---

## 🔧 技术实现

### 1. 订单系统扩展

**文件**: `/app/lib/orders.ts`

**新增字段**:
```typescript
export interface Order {
  id: string
  status: OrderStatus
  provider: PayProvider
  amount: number        // 分 (RMB cents)
  jobTitle:  string
  createdAt: number
  expiresAt: number
  paidAt?:   number
  shopItemId?: string  // 小红书商品ID（用于免费获取报告）
}
```

**新增函数**:
```typescript
// 定义小红书商品ID
export const SHOP_ITEM_ID = process.env.NEXT_PUBLIC_SHOP_ITEM_ID || 'shop_item_default'

// 创建小红书商品订单
export function createShopOrder(shopItemId: string, amount: number, jobTitle: string): Order {
  sweepExpired()
  const id = randomUUID()
  const now = Date.now()
  const order: Order = {
    id, shopItemId, amount, jobTitle,
    status: 'pending',
    createdAt: now,
    expiresAt: now + TTL_MS,
  }
  ORDERS.set(id, order)
  return order
}

// 标记小红书订单已支付
export function markShopOrderPaid(shopItemId: string): boolean {
  const now = Date.now()
  let marked = false

  for (const [id, order] of ORDERS) {
    if (order.shopItemId === shopItemId && order.status === 'pending' && now <= order.expiresAt) {
      ORDERS.set(id, { ...order, status: 'paid', paidAt: now })
      marked = true
    }
  }

  return marked
}

// 验证小红书订单是否已支付
export function isShopOrderPaid(shopItemId: string): boolean {
  const now = Date.now()

  for (const [id, order] of ORDERS) {
    if (order.shopItemId === shopItemId && order.status === 'paid' && now <= order.expiresAt) {
      return true
    }
  }

  return false
}
```

### 2. 深度报告接口修改

**文件**: `/app/api/deep-report/route.ts`

**Schema 扩展**:
```typescript
const Schema = z.object({
  industry:          z.string(),
  jobTitle:          z.string().min(1).max(30),
  tasks:             z.array(z.string()).min(1),
  yearsOfExperience: z.number(),
  skills: z.object({
    hard: z.array(z.string()),
    soft: z.array(z.string()),
  }),
  replacement_rate: z.number(),
  label:            z.string(),
  dimensions: z.object({
    routine:    z.object({ score: z.number(), reason: z.string() }),
    social_eq:  z.object({ score: z.number(), reason: z.string() }),
    cognitive:  z.object({ score: z.number(), reason: z.string() }),
    tech_trend: z.object({ score: z.number(), reason: z.string() }),
  }),
  // 支付验证：支持两种方式
  orderId: z.string().uuid().optional(),     // 方式1：原有方式
  shopItemId: z.string().optional(),            // 方式2：新增方式
})
```

**验证逻辑更新**:
```typescript
// 支付验证：仅在生产且 PAYMENT_PROVIDER !== 'mock' 时强制校验
const paymentEnabled = process.env.NODE_ENV === 'production' &&
                       process.env.PAYMENT_PROVIDER !== 'mock'

if (paymentEnabled) {
  // 方式1：订单ID验证
  const orderIdValid = input.orderId && isPaid(input.orderId)

  // 方式2：小红书商品ID验证
  const shopItemIdValid = input.shopItemId && isShopOrderPaid(input.shopItemId)

  // 两种方式至少满足一种
  if (!orderIdValid && !shopItemIdValid) {
    return NextResponse.json({ error: '请先完成支付' }, { status: 402 })
  }
}
```

### 3. 新增小红书商品订单接口

**文件**: `/app/api/orders/create-shop-order/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createShopOrder } from '@/app/lib/orders'

const Schema = z.object({
  shopItemId: z.string(),
  jobTitle: z.string().min(1).max(30),
  amount: z.number().default(990),  // 9.9元
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shopItemId, jobTitle, amount } = Schema.parse(body)

    const order = createShopOrder(shopItemId, amount, jobTitle)

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      shopItemId: order.shopItemId,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '参数错误', details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
  }
}
```

### 4. 小红书订单回调处理

**文件**: `/app/api/orders/shop-callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { markShopOrderPaid } from '@/app/lib/orders'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shopItemId } = body

    const marked = markShopOrderPaid(shopItemId)

    if (marked) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false })
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '验证失败' }, { status: 500 })
  }
}
```

---

## 🎨 前端实现

### 1. 新增小红书商品入口

在支付模态框中添加：

```typescript
// 小红书商品入口
<div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
  <div className="flex items-center gap-2 mb-3">
    <span className="text-2xl">🛒️</span>
    <div>
      <h3 className="text-lg font-bold text-white">小红书限时优惠</h3>
      <p className="text-sm text-white/90">购买指定商品，免费获取深度报告</p>
    </div>
  </div>

  <div className="space-y-3">
    <div>
      <p className="text-sm font-medium mb-2">商品链接</p>
      <input
        type="text"
        placeholder="粘贴小红书商品链接"
        className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg bg-[#F9FAFB] focus:outline-none focus:border-black/30 transition-colors"
        value={shopItemId}
        onChange={(e) => setShopItemId(e.target.value)}
      />
    </div>

    <div>
      <p className="text-sm font-medium mb-2">商品ID</p>
      <input
        type="text"
        placeholder="输入商品ID"
        className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg bg-[#F9FAFB] focus:outline-none focus:border-black/30 transition-colors"
        value={shopItemId}
        onChange={(e) => setShopItemId(e.target.value)}
      />
    </div>
  </div>

  <button
    onClick={handleShopOrder}
    disabled={!shopItemId || shopModal === 'paying'}
    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    立即解锁报告 →
  </button>

  <p className="text-[10px] text-[#9CA3AF] text-center mt-2">
    ⚠️ 限时优惠，请勿外传商品链接
  </p>
</div>

// 小红书订单处理
const handleShopOrder = useCallback(async (shopItemId: string) => {
  if (!result) return
  setShopModal('paying')
  setPayError(null)

  try {
    const res = await fetch('/api/orders/create-shop-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopItemId, jobTitle }),
    })

    if (!res.ok) throw new Error('创建订单失败')

    const data = await res.json()
    setOrderId(data.orderId)

    // 模拟小红书支付回调（实际由服务器处理）
    setTimeout(() => {
      // 模拟支付成功
      setShopModal('success')
      setTimeout(() => {
        setShopModal('closed')
        fetchDeepReport(data.orderId)
      }, 1500)
    }, 2000)

  } catch (err) {
    console.error('[handleShopOrder]', err)
    setShopError(err instanceof Error ? err.message : '下单失败')
    setShopModal('selecting')
  }
}, [result, jobTitle, shopModal])
```

### 2. 支付模态框扩展

```typescript
// 新增状态
const [shopModal, setShopModal] = useState<ShopModal>('closed')
const [shopItemId, setShopItemId] = useState<string>('')
const [shopError, setShopError] = useState<string | null>(null)

type ShopModal = 'closed' | 'selecting' | 'paying' | 'success'

// 支付模态框切换
{payModal === 'closed' && (
  <button
    onClick={() => setPayModal('selecting')}
    className="w-full py-3 rounded-xl font-bold bg-[#111118] text-white hover:bg-[#111118]/90 transition-all"
  >
    解锁深度转型报告
  </button>
)}

// 支付选择模态框
{payModal === 'selecting' && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md p-6">
      {/* 关闭按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">选择获取方式</h3>
        <button
          onClick={() => setPayModal('closed')}
          className="text-[#9CA3AF] hover:text-[#374151] transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 方式1：付费获取 */}
      <div className="mb-6 p-4 border border-black/8 rounded-xl">
        <h4 className="text-base font-bold mb-3 flex items-center gap-2">
          <span>💳</span>
          <span>方式1：直接支付</span>
        </h4>
        <div className="space-y-3">
          <button
            onClick={() => handlePayOrder('wechat')}
            className="w-full py-3 rounded-lg border border-black/15 text-[#374151] hover:border-black/30 hover:bg-[#F9FAFB] transition-colors font-medium"
          >
            微信支付 ¥9.90
          </button>
          <p className="text-xs text-[#9CA3AF]">支持微信JSAPI和H5支付</p>
        </div>
      </div>

      {/* 方式2：小红书商品 */}
      <div className="p-4 border border-black/8 rounded-xl">
        <h4 className="text-base font-bold mb-3 flex items-center gap-2">
          <span>🛒️</span>
          <span>方式2：小红书优惠</span>
        </h4>

        <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🛒️</span>
            <div>
              <h3 className="text-lg font-bold text-white">小红书限时优惠</h3>
              <p className="text-sm text-white/90">购买指定商品，免费获取报告</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">商品链接</p>
              <input
                type="text"
                placeholder="粘贴小红书商品链接"
                className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg bg-white focus:outline-none focus:border-black/30 transition-colors"
                value={shopItemId}
                onChange={(e) => setShopItemId(e.target.value)}
              />
            </div>

            <button
              onClick={() => handleShopOrder(shopItemId)}
              disabled={!shopItemId || shopModal === 'paying'}
              className="w-full py-3 rounded-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              立即解锁报告 →
            </button>

            <p className="text-[10px] text-[#9CA3AF] text-center mt-2">
              ⚠️ 限时优惠，请勿外传
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

// 成功状态
{shopModal === 'success' && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
    <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="text-lg font-bold mb-2">报告已解锁</h3>
      <p className="text-sm text-[#6B7280] mb-4">正在生成深度转型报告...</p>
    </div>
  </div>
)}
```

---

## 📊 数据分析对比

### 方式对比

| 维度 | 方式1：付费 | 方式2：小红书商品 |
|------|----------|----------------|
| 成本 | ¥9.90 | 商品价格（可能更低） |
| 转化路径 | 直接 | 小红书 → 购买 → 报告 |
| 数据收集 | 测评数据 | 测评 + 小红书购买数据 |
| 用户意愿 | 主动付费 | 优惠吸引被动转化 |
| 适合场景 | 精准用户 | 价格敏感用户 |

### 转化率预期

| 用户类型 | 方式1 转化率 | 方式2 转化率 |
|---------|-------------|---------------|
| 高意愿用户 | 15-20% | 10-15% |
| 中等意愿用户 | 5-10% | 15-25% |
| 价格敏感用户 | 2-5% | 25-35% |

---

## 🔐 安全措施

### 1. 商品 ID 验证
```typescript
// 定义允许的商品ID 白名单
const VALID_SHOP_ITEMS = [
  'shop_item_ai_career_report_v1',  // 深度报告 V1
  'shop_item_ai_career_report_v2',  // 深度报告 V2
  // 更多商品ID...
]

// 验证商品ID 是否在白名单中
function isValidShopItem(shopItemId: string): boolean {
  return VALID_SHOP_ITEMS.includes(shopItemId)
}

// 在创建订单前验证
if (!isValidShopItem(shopItemId)) {
  return NextResponse.json({ error: '无效的商品ID' }, { status: 400 })
}
```

### 2. 防刷单限制
```typescript
// 同一商品ID 的下单频率限制
const ORDER_LIMIT = 3  // 同一商品 24 小时内最多 3 单
const ORDER_LIMIT_WINDOW = 24 * 60 * 60 * 1000  // 24 小时

function checkOrderLimit(shopItemId: string): boolean {
  const now = Date.now()
  let recentOrders = 0

  for (const [id, order] of ORDERS) {
    if (order.shopItemId === shopItemId &&
        order.status === 'pending' &&
        now - order.createdAt < ORDER_LIMIT_WINDOW) {
      recentOrders++
    }
  }

  return recentOrders < ORDER_LIMIT
}

// 在创建订单前检查
if (!checkOrderLimit(shopItemId)) {
  return NextResponse.json({ error: '下单过于频繁，请稍后再试' }, { status: 429 })
}
```

### 3. 订单过期时间
```typescript
// 订单有效期延长（小红书用户需要时间购买）
const SHOP_ORDER_TTL = 7 * 24 * 60 * 60 * 1000  // 7 天
```

---

## 📋 实施检查清单

- [ ] 订单系统扩展（添加 shopItemId 字段）
- [ ] 小红书订单接口创建
- [ ] 小红书订单回调接口创建
- [ ] 深度报告接口验证逻辑更新
- [ ] 前端小红书商品入口添加
- [ ] 支付模态框扩展为双模式
- [ ] 商品 ID 白名单验证
- [ ] 防刷单限制
- [ ] 环境变量配置
- [ ] 本地测试
- [ ] 服务器部署
- [ ] 端到端测试

---

## 🚀 优先级

### P0 - 立即实施（核心功能）
1. 扩展订单系统
2. 创建小红书订单接口
3. 更新深度报告验证逻辑
4. 前端添加小红书商品入口

### P1 - 短期实施（1-2 周）
5. 创建订单回调接口
6. 添加安全验证（白名单、防刷单）
7. 前端支付模态框优化

### P2 - 中期实施（1 个月）
8. 数据埋点和转化分析
9. A/B 测试配置
10. 营销策略优化
