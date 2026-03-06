import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '样本报告 · AI 职业危机指数测评',
  description: '查看一份完整的 AI 冲击深度转型报告示例，了解报告包含的内容与分析维度。',
}

const SAMPLE = {
  jobTitle: '产品经理',
  industry: '互联网/科技',
  replacement_rate: 54,
  label: '中度风险',
  situation:
    '你所在的产品经理岗位正面临来自 AI 的结构性冲击。需求文档撰写、竞品分析、用户调研摘要等高频工作已有成熟 AI 工具可替代，这类任务约占日常工作量的 40%。然而，跨部门协调、商业判断与战略优先级决策是 AI 短期难以复制的核心壁垒。你 5 年经验积累的业务嗅觉与用户洞察是当前最大优势，但若不主动转型，3 年内将面临薪资竞争力显著下滑的风险。',
  timeline: {
    year1: 'AI Copilot 工具全面渗透 PRD 写作、用户故事拆分等环节，初级产品经理岗位需求下降约 30%，企业开始要求产品经理具备 Prompt 工程与 AI 工具选型能力，薪资两极分化加剧。',
    year3: '能独立主导 AI 产品设计与落地的产品经理成为稀缺人才，薪资溢价达 40-60%。传统 ToB 软件行业的纯功能型产品经理岗位压缩明显，AI Native 产品和出海产品方向需求显著增长。',
    year5: '产品经理这一职能不会消失，但工作内容将深度重构：战略制定、用户共情、跨组织协调占据 80% 精力。未完成 AI 能力升级的从业者将大量流向运营、咨询等方向，留存者薪资水位整体提升。',
  },
  pivots: [
    {
      role: 'AI 产品经理',
      match: 91,
      reason: '在现有产品思维基础上叠加 AI 能力认知与工程沟通能力，是最自然的升维路径。国内 AI 产品 PM 岗位需求 2024 年同比增长 210%，薪资中位数高出传统 PM 约 35%。',
      skills: ['LLM 产品设计', 'Prompt 工程', 'AI 效果评估', '数据飞轮设计'],
      timeline: '4-6 个月',
      challenges: ['需要补充大模型技术认知', '需要实际主导过一个 AI 功能上线'],
    },
    {
      role: '产品增长（PLG）负责人',
      match: 78,
      reason: '将产品思维与增长数据分析结合，适合具备用户研究背景的 PM 转型。PLG 模式在 SaaS 和工具类产品中快速普及，对懂产品又懂数据的复合型人才需求旺盛。',
      skills: ['增长实验设计', 'SQL/数据分析', '用户激活漏斗优化', 'A/B 测试'],
      timeline: '6-9 个月',
      challenges: ['需要系统学习增长方法论', '数据分析能力需要强化'],
    },
    {
      role: '出海产品顾问',
      match: 67,
      reason: '中国互联网出海进入第二波浪潮，具备国内产品方法论且能理解海外用户的 PM 供给稀缺。可先在现有公司参与出海项目积累经验，逐步切换到出海赛道。',
      skills: ['跨文化用户研究', '海外市场洞察', 'GTM 策略', '英语书面沟通'],
      timeline: '9-12 个月',
      challenges: ['海外用户认知需要时间积累', '英语沟通能力门槛较高'],
    },
  ],
  action_plan: [
    '第1个月：完成「AI 产品经理」系统课（推荐极客时间/得到），每周用 GPT-4o 完成 2 份 PRD，体感 AI 协作边界',
    '第2-3个月：主动认领一个含 AI 功能的需求，完整负责从调研到上线，积累可陈述的案例',
    '第4-5个月：在领英/Boss 更新简历，关键词加入"AI 产品"相关标签，内推优先，目标 3-5 个面试机会',
    '第6个月：拿到 offer 或在现岗获得 AI 方向项目，同步开始学习数据分析（SQL + Python 基础），为下一阶段打基础',
  ],
  ai_tools: [
    {
      name: 'ChatGPT / Claude',
      emoji: '🤖',
      tagline: 'PRD 写作提速 3 倍',
      use_case: '用结构化 Prompt 生成用户故事、竞品对比、功能优先级矩阵，将文档初稿时间从 4 小时压缩至 40 分钟',
      difficulty: 'easy' as const,
      url: 'https://chat.openai.com',
      tips: '先给 AI 角色设定（"你是有 10 年经验的产品经理"），输出质量提升显著',
      cost: '订阅制',
      learning_curve: '快速',
    },
    {
      name: 'Notion AI',
      emoji: '📋',
      tagline: '文档协作一体化',
      use_case: '在产品 Wiki、迭代记录、会议纪要中嵌入 AI 摘要与自动提炼，减少重复整理工作',
      difficulty: 'easy' as const,
      url: 'https://notion.so',
      tips: '用 "整理成表格" 指令处理用户访谈原始记录，效率最高',
      cost: '订阅制',
      learning_curve: '快速',
    },
    {
      name: 'Midjourney',
      emoji: '🎨',
      tagline: '低保真原型可视化',
      use_case: '在没有设计资源时，用文字描述快速生成 UI 概念图，用于需求评审和向 C 端用户验证方向',
      difficulty: 'medium' as const,
      url: 'https://midjourney.com',
      tips: '加 "--style raw" 参数生成更接近 UI 风格的界面概念图',
      cost: '订阅制',
      learning_curve: '中等',
    },
    {
      name: 'Maze / FullStory',
      emoji: '📊',
      tagline: 'AI 驱动用户行为洞察',
      use_case: '自动分析用户点击热图、流失节点，用 AI 摘要替代人工逐帧分析录屏，每周节省 3-5 小时',
      difficulty: 'medium' as const,
      url: 'https://maze.co',
      tips: '和设计师共享 Maze 测试链接，数据实时共享，减少评审会前的准备时间',
      cost: '付费',
      learning_curve: '中等',
    },
  ],
}

function RiskBadge({ rate, label }: { rate: number; label: string }) {
  const color = rate >= 70 ? '#EF4444' : rate >= 45 ? '#F59E0B' : '#10B981'
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: color + '18', color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label} · {rate}% AI 替代风险
    </span>
  )
}

function TabSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
      <div className="px-5 py-3 border-b border-black/8 bg-[#FAFAFA]">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function SamplePage() {
  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      {/* 顶部导航 */}
      <nav className="bg-white border-b border-black/8 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-sm font-bold text-[#111118]">AI 职业危机测评</Link>
        <Link href="/" className="text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors">
          ← 返回测评
        </Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 标题说明 */}
        <div className="rounded-2xl bg-[#111118] p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-white/40">样本报告</span>
            <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">示例 · 非真实数据</span>
          </div>
          <h1 className="text-xl font-bold mb-1">{SAMPLE.jobTitle}</h1>
          <p className="text-sm text-white/60 mb-3">{SAMPLE.industry} · 5 年经验</p>
          <RiskBadge rate={SAMPLE.replacement_rate} label={SAMPLE.label} />
        </div>

        {/* 处境诊断 */}
        <div className="rounded-2xl bg-white border border-black/8 p-5">
          <p className="text-xs text-[#9CA3AF] font-mono uppercase tracking-widest mb-2.5">处境诊断</p>
          <p className="text-[#111118] font-medium leading-relaxed">{SAMPLE.situation}</p>
        </div>

        {/* AI 冲击时间线 */}
        <TabSection title="AI 冲击时间线">
          <div className="space-y-4">
            {([['year1', '1 年内'], ['year3', '3 年后'], ['year5', '5 年后']] as const).map(([key, label]) => (
              <div key={key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#111118] text-white text-xs flex items-center justify-center font-mono flex-shrink-0">
                    {label[0]}
                  </div>
                  {key !== 'year5' && <div className="w-px flex-1 bg-black/8 mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-xs font-medium text-[#9CA3AF] mb-1">{label}</p>
                  <p className="text-sm text-[#374151] leading-relaxed">{SAMPLE.timeline[key]}</p>
                </div>
              </div>
            ))}
          </div>
        </TabSection>

        {/* 转型方向 */}
        <TabSection title="推荐转型方向">
          <div className="space-y-4">
            {SAMPLE.pivots.map((p, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#F9FAFB] border border-black/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#111118]">{p.role}</span>
                  <span className="text-sm font-bold text-emerald-600">{p.match}% 匹配</span>
                </div>
                <p className="text-sm text-[#374151] leading-relaxed mb-3">{p.reason}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.skills.map(s => (
                    <span key={s} className="text-xs bg-white border border-black/10 text-[#374151] px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-[#9CA3AF]">
                  <span>预计 {p.timeline}</span>
                  <span>挑战：{p.challenges[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </TabSection>

        {/* 行动计划 */}
        <TabSection title="6 个月行动计划">
          <ol className="space-y-3">
            {SAMPLE.action_plan.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#111118] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-[#374151] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </TabSection>

        {/* AI 工具推荐 */}
        <TabSection title="专属 AI 工具推荐">
          <div className="space-y-3">
            {SAMPLE.ai_tools.map((t, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-[#F9FAFB] border border-black/5">
                <span className="text-2xl leading-none flex-shrink-0">{t.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-[#111118]">{t.name}</span>
                    <span className="text-xs text-[#9CA3AF]">{t.tagline}</span>
                  </div>
                  <p className="text-xs text-[#374151] leading-relaxed mb-1.5">{t.use_case}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-[#9CA3AF]">
                    <span>{t.cost}</span>
                    <span>·</span>
                    <span>上手{t.learning_curve}</span>
                    <span>·</span>
                    <span>难度：{t.difficulty === 'easy' ? '低' : t.difficulty === 'medium' ? '中' : '高'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabSection>

        {/* CTA */}
        <div className="rounded-2xl bg-white border border-black/8 p-5 text-center">
          <p className="text-sm font-medium text-[#111118] mb-1">查看你的专属报告</p>
          <p className="text-xs text-[#9CA3AF] mb-4">基于你的真实职位、技能、行业生成，比样本更精准</p>
          <Link
            href="/"
            className="inline-block bg-[#111118] text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-black transition-colors"
          >
            立即测评
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
