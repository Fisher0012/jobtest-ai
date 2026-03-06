import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '定价说明 · AI 职业危机指数测评',
  description: '查看 AI 职业危机指数测评的收费标准和服务内容，免费测评 + 深度报告解锁。',
}

const FREE_FEATURES = [
  'AI 替代风险评分（0-100 分）',
  '风险等级判定（低/中/高/极高）',
  '四维评分雷达（重复性、社交情商、认知复杂度、AI 覆盖）',
  '岗位总体处境说明',
  '可分享测评结果（生成图片）',
]

const PAID_FEATURES = [
  '处境诊断深度分析（120-150 字精准诊断）',
  'AI 冲击时间线预测（1 年 / 3 年 / 5 年）',
  '3 条个性化转型路径推荐（含匹配度、挑战、所需技能）',
  '6 个月行动计划（分步可执行）',
  '4 款专属 AI 工具推荐（含使用场景与上手技巧）',
  '报告支持随时回看，永久有效',
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      <nav className="bg-white border-b border-black/8 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-sm font-bold text-[#111118]">AI 职业危机测评</Link>
        <Link href="/" className="text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors">← 返回测评</Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl bg-[#111118] p-5 text-white">
          <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Pricing</p>
          <h1 className="text-xl font-bold">定价说明</h1>
          <p className="text-sm text-white/60 mt-1">免费测评，按需解锁深度报告</p>
        </div>

        {/* 免费套餐 */}
        <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[#111118]">基础测评</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">快速了解你的 AI 替代风险</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#111118]">免费</p>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#374151]">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/"
              className="mt-4 block text-center bg-[#F5F6FA] border border-black/8 text-[#374151] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#EBEBEF] transition-colors"
            >
              开始免费测评
            </Link>
          </div>
        </div>

        {/* 付费套餐 */}
        <div className="rounded-2xl bg-[#111118] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">深度转型报告</h2>
              <p className="text-xs text-white/50 mt-0.5">专属 AI 分析 · 一次付费永久可看</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">¥19.9</p>
              <p className="text-xs text-white/40 line-through">原价 ¥49</p>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-2.5">
              {PAID_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                  <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/"
              className="mt-4 block text-center bg-white text-[#111118] text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
            >
              先免费测评，再解锁报告
            </Link>
          </div>
        </div>

        {/* 说明 */}
        <div className="rounded-2xl bg-white border border-black/8 p-5 space-y-3">
          <h2 className="font-semibold text-[#111118]">常见问题</h2>
          {[
            { q: '报告是否会过期？', a: '不会。付费解锁的深度报告永久有效，可随时回看，无需重复购买。' },
            { q: '可以退款吗？', a: '由于报告为 AI 即时生成的数字内容，生成后不支持退款。如生成失败或内容明显有误，请联系客服处理。' },
            { q: '支持哪些支付方式？', a: '目前支持微信支付和支付宝，均通过官方安全通道处理，不存储任何支付信息。' },
            { q: '报告针对我的职位生成吗？', a: '是的。每份报告都基于你填写的岗位、行业、工作年限、核心技能和日常任务生成，是专属于你的个性化分析，不是通用模板。' },
          ].map((item, i) => (
            <div key={i} className="border-t border-black/5 pt-3">
              <p className="text-sm font-medium text-[#111118]">{item.q}</p>
              <p className="text-sm text-[#9CA3AF] mt-1 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        {/* 样本报告入口 */}
        <div className="rounded-2xl bg-white border border-black/8 p-5 text-center">
          <p className="text-sm text-[#374151] mb-3">想先看看报告长什么样？</p>
          <Link
            href="/sample"
            className="inline-block border border-black/10 text-[#374151] text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#F5F6FA] transition-colors"
          >
            查看完整样本报告 →
          </Link>
        </div>

        <Footer />
      </div>
    </main>
  )
}

function Footer() {
  return (
    <footer className="py-6 text-center space-y-2">
      <div className="flex items-center justify-center gap-4 text-xs text-[#9CA3AF]">
        <Link href="/about" className="hover:text-[#374151] transition-colors">关于我们</Link>
        <span>·</span>
        <Link href="/pricing" className="hover:text-[#374151] transition-colors">定价说明</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-[#374151] transition-colors">服务条款</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-[#374151] transition-colors">隐私政策</Link>
      </div>
      <p className="text-xs text-[#9CA3AF]">© 2025 AI 职业危机指数测评</p>
    </footer>
  )
}
