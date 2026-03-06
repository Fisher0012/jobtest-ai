import { NextRequest, NextResponse } from 'next/server'
import { createFreeLink, validateFreeLink } from '@/app/lib/free-links'

// ── 简单的免费链接生成器 ───────────────────────────
// 生成带过期时间的访问链接，用于小红书商品"发货"

// ── 路由处理 ───────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    // 如果没有token，生成新的
    if (!token) {
      const token = createFreeLink(url.href)
      // 7天后过期
      const expiresIn = 7 * 24 * 60 * 60 * 1000

      return NextResponse.json({
        token,
        freeUrl: `${url.origin}/api/deep-report?token=${token}`,
        expiresIn, // 7天，单位：毫秒
      })
    }

    // 验证token
    const validation = validateFreeLink(token)
    if (!validation.valid) {
      return NextResponse.json({ error: '链接已过期或无效' }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      url: validation.url,
      expiresIn: validation.expiresIn, // 剩余分钟数
    })
  } catch (err) {
    console.error('[share/free]', err)
    return NextResponse.json({ error: '生成链接失败' }, { status: 500 })
  }
}
