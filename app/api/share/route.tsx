import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'

// Node.js runtime（非 edge），才能用 fs 读取本地字体文件
// export const runtime = 'edge'  ← 已移除

const W = 1080
const H = 1920 // 9:16 手机竖屏比例

// 字体缓存：首次请求时从本地磁盘加载，之后复用（无 Google Fonts 网络延迟）
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'NotoSansSC-Bold.ttf')
let fontBuf: ArrayBuffer | undefined

async function getFont(): Promise<ArrayBuffer | undefined> {
  if (fontBuf) return fontBuf
  try {
    const buf = await readFile(FONT_PATH)
    // 用 slice 确保返回一个独立的 ArrayBuffer（不受 Node.js 内存池影响）
    fontBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    return fontBuf
  } catch {
    return undefined
  }
}

// 将 3位短色值扩展为 6位，避免 `color + opacity` 拼接出非法 CSS 颜色
function normalizeHex(color: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const [, r, g, b] = color.match(/^#(.)(.)(.)$/)!
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#EA580C' // 无法识别时的保底默认色
}

function dimColor(score: number, danger: boolean) {
  // OG 图在深色背景上，保留高饱和色
  if (danger) return score >= 70 ? '#F87171' : score >= 40 ? '#FB923C' : '#4ADE80'
  return score >= 70 ? '#4ADE80' : score >= 40 ? '#FBBF24' : '#F87171'
}

// 社会证明计数器：基于日期递增，制造「持续增长」感
function getSocialProofCount(): string {
  const seedMs  = new Date('2025-12-01T00:00:00Z').getTime()
  const seedCnt = 88_000
  const daily   = 820   // ~820 人/天，约 246,000/年
  const days    = Math.max(0, Math.floor((Date.now() - seedMs) / 86_400_000))
  const count   = seedCnt + days * daily
  // 英文逗号格式：132,854
  return count.toLocaleString('en-US')
}

export async function GET(req: NextRequest) {
  try {
  const p     = req.nextUrl.searchParams
  const rate  = Math.max(0, Math.min(100, Number(p.get('rate') ?? 50) || 50))
  const label = p.get('label') ?? '中等风险'
  const color = normalizeHex(p.get('color') ?? '#EA580C')
  const job   = p.get('job')   ?? '未知岗位'
  const ind   = p.get('ind')   ?? ''
  const r     = Number(p.get('r') ?? 50)
  const s     = Number(p.get('s') ?? 50)
  const c     = Number(p.get('c') ?? 50)
  const t     = Number(p.get('t') ?? 50)
  const risk1 = p.get('risk1') ?? ''
  const risk2 = p.get('risk2') ?? ''
  const moat1 = p.get('moat1') ?? ''
  const moat2 = p.get('moat2') ?? ''
  const shareUrl = p.get('url') ?? req.nextUrl.origin

  const [fontData, qrDataUrl] = await Promise.all([
    getFont(),
    QRCode.toDataURL(shareUrl, {
      width: 400, // 生成更高分辨率，显示时缩小到200px保证清晰度
      margin: 1,
      color: { dark: '#FFFFFF', light: '#0A0A0F' }, // 白色码点，背景色与图片一致
    }),
  ])

  const socialProof = `已有 ${getSocialProofCount()} 人测过职场生存力`

  // Pre-compute all text to avoid mixed JSX text+expression children
  const jobLine    = ind ? `${job} · ${ind}` : job
  const rateLine   = `${rate}%`
  const footerLine = `你的替代率是 ${rate}%，你的朋友呢？`

  const dims = [
    { label: '重复性指数',   score: r, danger: true  },
    { label: '社交情商指数', score: s, danger: false },
    { label: '认知复杂度',   score: c, danger: false },
    { label: 'AI 覆盖率',    score: t, danger: true  },
  ]

  const risks  = [risk1, risk2].filter(Boolean)
  const moats  = [moat1, moat2].filter(Boolean)

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, background: '#0A0A0F', display: 'flex', flexDirection: 'column', color: 'white', padding: '60px 72px 80px', fontFamily: fontData ? 'Noto Sans SC' : 'sans-serif' }}>

        {/* 顶栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 36, fontWeight: 700 }}>AI 职业危机指数</span>
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Oxford · Goldman Sachs 模型</span>
          </div>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 100 }}>2026</span>
        </div>

        {/* 岗位名称 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.92)', textAlign: 'center', lineHeight: '1.2' }}>{jobLine}</span>
        </div>

        {/* 大数字 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 200, fontWeight: 900, color, lineHeight: '0.9' }}>{rateLine}</span>
          {/* 进度条 */}
          <div style={{ display: 'flex', width: '100%', maxWidth: 920, height: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', marginTop: 20, marginBottom: 24 }}>
            <div style={{ width: `${rate}%`, height: 16, background: color, borderRadius: 8 }} />
          </div>
          {/* 风险标签 */}
          <div style={{ display: 'flex', padding: '14px 48px', borderRadius: 100, background: color + '22', border: `3px solid ${color}70`, fontSize: 36, fontWeight: 700, color }}>
            {label}
          </div>
        </div>

        {/* 分隔线 */}
        <div style={{ display: 'flex', width: '100%', height: 2, background: 'rgba(255,255,255,0.12)', marginBottom: 44 }} />

        {/* 四维分析 */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 40 }}>
          <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 28 }}>四维分析</span>
          {dims.map((d, i) => {
            const dc = dimColor(d.score, d.danger)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
                <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 7, background: dc, flexShrink: 0, marginRight: 20 }} />
                <span style={{ fontSize: 32, width: 260, color: 'rgba(255,255,255,0.82)', flexShrink: 0, marginRight: 20 }}>{d.label}</span>
                <div style={{ display: 'flex', flex: 1, height: 18, background: 'rgba(255,255,255,0.1)', borderRadius: 9, overflow: 'hidden', marginRight: 20 }}>
                  <div style={{ display: 'flex', width: `${d.score}%`, height: 18, background: dc, borderRadius: 9 }} />
                </div>
                <span style={{ fontSize: 36, fontWeight: 700, width: 72, textAlign: 'right', color: dc, flexShrink: 0 }}>{String(d.score)}</span>
              </div>
            )
          })}
        </div>

        {/* 动态间距 - 根据内容高度自动调整 */}
        <div style={{ flex: 1, minHeight: 20 }} />

        {/* 高危任务 */}
        {risks.length > 0
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32, padding: '28px 36px', background: 'rgba(255,68,68,0.07)', borderRadius: 20, border: '1px solid rgba(255,68,68,0.18)', maxWidth: '100%', overflow: 'hidden' }}>
              <span style={{ fontSize: 28, color: 'rgba(255,110,110,0.9)', marginBottom: 16, fontWeight: 600 }}>高危任务（最易被取代）</span>
              {risks.map((txt, i) => (
                <span key={i} style={{ fontSize: 26, color: 'rgba(255,255,255,0.65)', marginTop: i > 0 ? 12 : 0, wordBreak: 'break-word', lineHeight: '1.5' }}>{`- ${txt}`}</span>
              ))}
            </div>
          )
          : null}

        {/* 职业护城河 */}
        {moats.length > 0
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32, padding: '28px 36px', background: 'rgba(0,204,102,0.07)', borderRadius: 20, border: '1px solid rgba(0,204,102,0.18)', maxWidth: '100%', overflow: 'hidden' }}>
              <span style={{ fontSize: 28, color: 'rgba(74,222,128,0.9)', marginBottom: 16, fontWeight: 600 }}>职业护城河（AI 难以替代）</span>
              {moats.map((txt, i) => (
                <span key={i} style={{ fontSize: 26, color: 'rgba(255,255,255,0.65)', marginTop: i > 0 ? 12 : 0, wordBreak: 'break-word', lineHeight: '1.5' }}>{`+ ${txt}`}</span>
              ))}
            </div>
          )
          : null}

        {/* 页脚：左侧文字 + 右侧二维码 */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 44, borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          {/* 左：从众文案 + 引导文字 */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: 48 }}>
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.32)', marginBottom: 16 }}>{socialProof}</span>
            <span style={{ fontSize: 38, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: '1.3', fontWeight: 600 }}>{footerLine}</span>
            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.22)' }}>小红书搜索「AI 职业危机指数」来测一测</span>
          </div>
          {/* 右：二维码 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={200} height={200} style={{ borderRadius: 14 }} alt="" />
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)' }}>扫码测一测</span>
          </div>
        </div>

      </div>
    ),
    {
      width: W,
      height: H,
      fonts: fontData
        ? [{ name: 'Noto Sans SC', data: fontData, weight: 700, style: 'normal' }]
        : [],
    },
  )
  } catch (err) {
    console.error('[/api/share]', err)
    return new Response('图片生成失败，请检查参数', { status: 400 })
  }
}
