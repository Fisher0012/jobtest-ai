import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于我们 · AI 职业危机指数测评',
  description: '了解 AI 职业危机指数测评的服务背景、研究模型与团队介绍。',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      <nav className="bg-white border-b border-black/8 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-sm font-bold text-[#111118]">AI 职业危机测评</Link>
        <Link href="/" className="text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors">← 返回测评</Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl bg-[#111118] p-5 text-white">
          <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">About</p>
          <h1 className="text-xl font-bold">关于我们</h1>
        </div>

        <div className="rounded-2xl bg-white border border-black/8 p-5 space-y-4">
          <h2 className="font-semibold text-[#111118]">我们是谁</h2>
          <p className="text-sm text-[#374151] leading-relaxed">
            AI 职业危机指数测评是一款面向中国职场人的 AI 替代风险量化工具，帮助用户理性评估自身岗位受 AI 冲击的程度，并提供有针对性的转型建议。
          </p>
          <p className="text-sm text-[#374151] leading-relaxed">
            我们相信，了解风险是应对风险的第一步。与其在信息焦虑中迷失，不如用数据驱动的方式看清自己的处境，制定有效的行动计划。
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-black/8 p-5 space-y-4">
          <h2 className="font-semibold text-[#111118]">研究模型来源</h2>
          <p className="text-sm text-[#374151] leading-relaxed">
            本产品的评分模型参考了以下权威研究成果：
          </p>
          <ul className="space-y-3">
            {[
              { title: 'Oxford 大学 Carl Frey 研究', desc: '2013 年发表《The Future of Employment》，首次系统量化 702 种职业的计算机化概率，奠定岗位替代研究的方法论基础。' },
              { title: 'Goldman Sachs 2023 报告', desc: '《The Potentially Large Effects of Artificial Intelligence on Economic Growth》，预测全球 3 亿个工作岗位将受到生成式 AI 影响。' },
              { title: 'McKinsey Global Institute', desc: '《A new future of work》系列报告，细化了不同任务类型的自动化潜力评估框架。' },
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#111118] mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#111118]">{item.title}</p>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-black/8 p-5 space-y-4">
          <h2 className="font-semibold text-[#111118]">评分维度说明</h2>
          <p className="text-sm text-[#374151] leading-relaxed">我们从四个维度综合评估 AI 替代风险：</p>
          <div className="space-y-3">
            {[
              { name: '任务重复性', desc: '岗位日常工作中规则化、重复性任务的占比。重复性越高，AI 越容易替代。' },
              { name: '社交情商需求', desc: '岗位对人际沟通、情感共情、关系维护能力的依赖程度。越高则越难被替代。' },
              { name: '认知复杂度', desc: '岗位所需的创造性思维、战略判断和跨领域综合能力。越高则 AI 越难模仿。' },
              { name: 'AI 技术覆盖', desc: '当前 AI 技术对该岗位核心任务的已有覆盖程度，基于近两年 AI 工具发展现状评估。' },
            ].map((d, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-[#F9FAFB]">
                <span className="text-xs font-mono text-[#9CA3AF] w-4 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-[#111118]">{d.name}</p>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed mt-0.5">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-black/8 p-5 space-y-3">
          <h2 className="font-semibold text-[#111118]">联系我们</h2>
          <p className="text-sm text-[#374151] leading-relaxed">
            如有任何问题、建议或合作需求，欢迎通过以下方式联系：
          </p>
          <div className="space-y-2 text-sm text-[#374151]">
            <p>邮箱：support@aicareer.sque.site</p>
            <p>小红书：搜索「AI职业危机测评」</p>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-2">工作日回复，一般在 1-2 个工作日内。</p>
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
