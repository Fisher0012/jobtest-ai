import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隐私政策 · AI 职业危机指数测评',
  description: '了解 AI 职业危机指数测评如何收集、使用和保护您的个人信息。',
}

const SECTIONS = [
  {
    title: '1. 我们收集哪些信息',
    content: [
      '测评信息：您填写的职位名称、所在行业、工作年限、核心技能、日常工作任务等，仅用于生成个性化评分和报告，不与您的真实身份绑定。',
      '支付信息：通过微信支付/支付宝完成付费时，我们仅接收支付平台返回的订单状态（成功/失败），不存储您的银行卡号、密码等敏感支付信息。',
      '设备信息：为正常提供服务，我们可能收集浏览器类型、操作系统、IP 地址等基础技术信息，用于排障和防止滥用。',
      '我们不收集您的姓名、手机号、邮箱或任何可直接识别您身份的信息，除非您主动联系客服提供。',
    ],
  },
  {
    title: '2. 信息如何使用',
    content: [
      '您填写的测评信息用于驱动 AI 模型生成评分和报告，生成完成后原始输入不会被永久存储到数据库中。',
      '我们使用匿名聚合数据分析产品使用情况，持续优化评分模型，这些数据无法追溯到个人。',
      '我们不会将您的任何信息出售、租赁给第三方，也不用于广告定向推送。',
    ],
  },
  {
    title: '3. 第三方服务',
    content: [
      'AI 报告生成：本服务使用 DeepSeek 大语言模型 API 生成深度报告内容。您的测评信息（非身份信息）将被发送至 DeepSeek 的 API 端点进行处理，DeepSeek 的隐私政策另行适用。',
      '支付处理：通过微信支付或支付宝完成支付，相关支付数据由对应平台处理，我们不介入支付数据的存储。',
    ],
  },
  {
    title: '4. 数据安全',
    content: [
      '我们采用 HTTPS 加密传输所有数据，支付相关的密钥和证书在服务器端加密存储。',
      '订单数据存储在内存中，服务重启后清除，不持久化到磁盘数据库（生产环境将迁移至加密数据库）。',
      '我们定期审查安全配置，如发现数据泄露，将在 24 小时内通过网站公告或联系方式通知受影响用户。',
    ],
  },
  {
    title: '5. Cookie 使用',
    content: [
      '本服务仅使用必要的 Session Cookie 维持您的登录状态和测评进度，不使用追踪 Cookie 或第三方广告 Cookie。',
      '您可以在浏览器设置中禁用 Cookie，但这可能影响部分功能的正常使用。',
    ],
  },
  {
    title: '6. 您的权利',
    content: [
      '您有权要求我们删除与您相关的任何数据。由于我们不收集身份信息，请通过您的订单号联系 support@aicareer.sque.site 提出请求。',
      '如您对本隐私政策有任何疑问或投诉，请联系：support@aicareer.sque.site，我们将在 5 个工作日内回复。',
    ],
  },
  {
    title: '7. 政策更新',
    content: [
      '本隐私政策可能因法律要求或服务变更而更新。更新后我们将在网站显著位置提示，重大变更将提前 7 天通知。继续使用本服务视为您接受更新后的政策。',
      '本政策最后更新日期：2025 年 3 月。',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      <nav className="bg-white border-b border-black/8 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-sm font-bold text-[#111118]">AI 职业危机测评</Link>
        <Link href="/" className="text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors">← 返回测评</Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl bg-[#111118] p-5 text-white">
          <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Privacy</p>
          <h1 className="text-xl font-bold">隐私政策</h1>
          <p className="text-xs text-white/40 mt-2">最后更新：2025 年 3 月</p>
        </div>

        <div className="rounded-2xl bg-white border border-black/8 p-4">
          <p className="text-sm text-[#374151] leading-relaxed">
            我们非常重视您的隐私。本政策说明我们如何处理您在使用「AI 职业危机指数测评」过程中产生的信息。<strong className="text-[#111118]">我们不收集您的真实姓名、手机号或任何可识别个人身份的信息。</strong>
          </p>
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
