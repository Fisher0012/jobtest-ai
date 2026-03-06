import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '服务条款 · AI 职业危机指数测评',
  description: 'AI 职业危机指数测评服务条款，使用本服务即表示您同意以下条款。',
}

const SECTIONS = [
  {
    title: '1. 服务说明',
    content: [
      '「AI 职业危机指数测评」（以下简称"本服务"）是一款基于人工智能技术的职业风险量化工具，通过用户填写的岗位、行业、技能等信息，生成 AI 替代风险评分及深度转型报告。',
      '本服务提供的内容仅供参考，不构成任何形式的就业建议、投资建议或职业规划咨询服务。实际职业决策请综合考量个人情况，必要时咨询专业人士。',
    ],
  },
  {
    title: '2. 用户资格',
    content: [
      '使用本服务，表明您已年满 18 周岁，或在法定监护人的监督下使用。',
      '您承诺提供真实、准确的信息。因提供虚假信息导致报告质量偏差的，责任由用户自行承担。',
    ],
  },
  {
    title: '3. 付费与退款',
    content: [
      '基础测评（风险评分及雷达图）永久免费。深度转型报告为付费内容，一次付费，永久可看。',
      '由于深度报告为 AI 即时生成的数字内容，报告一经成功生成，不支持退款。若因系统故障导致报告未能正常生成，我们将全额退款或免费重新生成。',
      '付费金额以下单时页面显示为准，我们保留调整定价的权利，调价不影响已购用户。',
    ],
  },
  {
    title: '4. 知识产权',
    content: [
      '本服务的评分模型、算法逻辑、界面设计及所有原创内容，版权归本服务所有。',
      '用户生成的报告内容，用户享有个人使用权，可用于个人学习、分享等非商业目的。未经授权，不得将报告内容用于商业售卖或批量传播。',
    ],
  },
  {
    title: '5. 免责声明',
    content: [
      'AI 生成内容具有一定局限性，可能存在偏差或不准确之处。本服务不对报告结论的准确性、完整性或适用性作出任何明示或暗示的保证。',
      '本服务不对因使用或无法使用本服务造成的任何直接或间接损失承担责任。',
      '本服务依赖第三方 AI 服务（DeepSeek）生成报告内容，如遇第三方服务中断，可能影响深度报告功能，我们将尽力保障服务连续性。',
    ],
  },
  {
    title: '6. 条款变更',
    content: [
      '我们保留随时修改本条款的权利。条款更新后，我们将在网站显著位置提示。继续使用本服务视为您同意修改后的条款。',
      '如有疑问，请联系：support@aicareer.sque.site',
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      <nav className="bg-white border-b border-black/8 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-sm font-bold text-[#111118]">AI 职业危机测评</Link>
        <Link href="/" className="text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors">← 返回测评</Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl bg-[#111118] p-5 text-white">
          <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Terms</p>
          <h1 className="text-xl font-bold">服务条款</h1>
          <p className="text-xs text-white/40 mt-2">最后更新：2025 年 3 月</p>
        </div>

        <div className="rounded-2xl bg-white border border-black/8 p-5 space-y-6">
          {SECTIONS.map((section, i) => (
            <div key={i} className={i > 0 ? 'border-t border-black/5 pt-6' : ''}>
              <h2 className="font-semibold text-[#111118] mb-3">{section.title}</h2>
              <div className="space-y-2">
                {section.content.map((para, j) => (
                  <p key={j} className="text-sm text-[#374151] leading-relaxed">{para}</p>
                ))}
              </div>
            </div>
          ))}
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
