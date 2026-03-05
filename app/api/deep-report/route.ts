import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isPaid } from '@/app/lib/orders'

// ── 输入验证 ─────────────────────────────────────────────
const Schema = z.object({
  industry:          z.string(),
  jobTitle:          z.string().min(1).max(30),
  tasks:             z.array(z.string()).min(1),
  yearsOfExperience: z.number(),
  skills: z.object({
    hard: z.array(z.string()),
    soft: z.array(z.string()),
  }),
  // 来自 analyze 结果
  replacement_rate: z.number(),
  label:            z.string(),
  dimensions: z.object({
    routine:    z.object({ score: z.number(), reason: z.string() }),
    social_eq:  z.object({ score: z.number(), reason: z.string() }),
    cognitive:  z.object({ score: z.number(), reason: z.string() }),
    tech_trend: z.object({ score: z.number(), reason: z.string() }),
  }),
  // 支付验证（开启支付后必传）
  orderId: z.string().uuid().optional(),
})

// ── 返回类型 ─────────────────────────────────────────────
export type AITool = {
  name:       string
  emoji:      string
  tagline:    string
  use_case:   string
  difficulty: 'easy' | 'medium' | 'hard'
  url:        string
  tips:       string
}

export type DeepReportData = {
  situation:   string
  timeline:    { year1: string; year3: string; year5: string }
  pivots:      Array<{ role: string; match: number; reason: string; skills: string[] }>
  action_plan: string[]
  ai_tools:    AITool[]
}

// ── Mock AI 工具库（占位符，待后续注入真实数据）────────────
const MOCK_AI_TOOLS: AITool[] = [
  {
    name:       'Claude',
    emoji:      '🤖',
    tagline:    'AI思维伙伴',
    use_case:   '撰写报告、分析数据、起草方案，长文本推理首选',
    difficulty: 'easy',
    url:        'https://claude.ai',
    tips:       '把岗位职责发给 Claude，让它识别哪些任务可被自动化',
  },
  {
    name:       'Cursor',
    emoji:      '⌨️',
    tagline:    'AI 编程 IDE',
    use_case:   '无需写代码也能生成自动化脚本与数据处理工具',
    difficulty: 'medium',
    url:        'https://cursor.sh',
    tips:       '先描述业务问题，让 AI 生成 Python 脚本，再逐步调整',
  },
  {
    name:       'Midjourney',
    emoji:      '🎨',
    tagline:    'AI 图像生成',
    use_case:   '快速生成营销素材、产品概念图、PPT 插图',
    difficulty: 'easy',
    url:        'https://midjourney.com',
    tips:       '用具体场景 + 风格词，如"产品海报, 科技感, 蓝紫色调"',
  },
  {
    name:       'Notion AI',
    emoji:      '📝',
    tagline:    'AI 知识管理',
    use_case:   '自动整理会议纪要、生成文档框架、知识库问答',
    difficulty: 'easy',
    url:        'https://notion.so',
    tips:       '导入历史会议转录，让 AI 自动生成行动项与决策记录',
  },
  {
    name:       'n8n',
    emoji:      '⚙️',
    tagline:    'AI 工作流自动化',
    use_case:   '连接 30+ 个应用，无代码构建复杂自动化流程',
    difficulty: 'hard',
    url:        'https://n8n.io',
    tips:       '从"收到邮件→自动分类"开始，逐步添加 AI 处理节点',
  },
]

// ── Mock 数据 ─────────────────────────────────────────────
function getMock(jobTitle: string, label: string): DeepReportData {
  return {
    situation: `${jobTitle}的核心工作高度依赖规则化执行，AI工具已可复现80%以上的日常产出，竞争优势正快速收窄。`,
    timeline: {
      year1: 'AI助手接管文档生成与数据分析，同类岗位需求减少30%，薪资增速明显放缓',
      year3: '初中级岗位加速合并，能驾驭AI的个人产出是传统员工的3-5倍',
      year5: '纯执行型岗位基本消失，存活者转型为AI协调者或高阶决策者',
    },
    pivots: [
      {
        role:   'AI产品负责人',
        match:  88,
        reason: '已有业务理解与产品思维，补足AI工具评估能力即可快速切入',
        skills: ['Prompt工程', 'AI产品设计', '数据分析'],
      },
      {
        role:   '增长运营专家',
        match:  75,
        reason: '深度数据驱动，AI可放大运营效率10倍，稀缺性反而上升',
        skills: ['增长黑客', 'A/B测试', 'SQL'],
      },
      {
        role:   '行业咨询顾问',
        match:  70,
        reason: '行业经验积累不可复制，AI辅助交付可提升10倍客户价值',
        skills: ['解决方案设计', '客户管理', '演讲表达'],
      },
    ],
    action_plan: [
      '前2周：用 Cursor/Claude 完成1个完整自动化工作流，验证AI工具边界',
      '第3-4周：梳理哪些日常任务可被AI代劳，重新设计个人工作方式',
      '第2个月：系统学习1门核心新技能（推荐：数据分析或AI产品设计），输出作品',
      '第3个月：以「AI+行业专家」定位在小红书/公众号发布5篇内容，建立个人品牌',
      '90天结束：完成至少1次内外部职位探索谈话，收集真实市场反馈',
    ],
    ai_tools: MOCK_AI_TOOLS,
  }
}

// ── DeepSeek 调用 ─────────────────────────────────────────
async function callDeepSeek(
  input: z.infer<typeof Schema>,
): Promise<DeepReportData> {
  const { jobTitle, industry, yearsOfExperience, tasks, skills, replacement_rate, label, dimensions } = input

  const prompt = `职业顾问。为用户生成转型报告，严格输出JSON，不要多余文字。
岗位:${jobTitle}(${industry},${yearsOfExperience}年) AI替代:${replacement_rate}%(${label})
任务:${tasks.slice(0,3).join('、')} 技能:${[...skills.hard,...skills.soft].slice(0,4).join('、')||'无'}
维度:重复${dimensions.routine.score}/社交${dimensions.social_eq.score}/认知${dimensions.cognitive.score}/AI覆盖${dimensions.tech_trend.score}
{"situation":"处境诊断20字","timeline":{"year1":"1年冲击15字","year3":"3年变化15字","year5":"5年状态15字"},"pivots":[{"role":"方向8字","match":整数,"reason":"推荐原因15字","skills":["技能1","技能2","技能3"]},{"role":"...","match":0,"reason":"...","skills":[]},{"role":"...","match":0,"reason":"...","skills":[]}],"action_plan":["第1步15字","第2步","第3步","第4步","第5步"],"ai_tools":[{"name":"工具","emoji":"emoji","tagline":"定位6字","use_case":"用法20字","difficulty":"easy","url":"https://...","tips":"技巧20字"},{"name":"...","emoji":"...","tagline":"...","use_case":"...","difficulty":"easy","url":"...","tips":"..."},{"name":"...","emoji":"...","tagline":"...","use_case":"...","difficulty":"medium","url":"...","tips":"..."},{"name":"...","emoji":"...","tagline":"...","use_case":"...","difficulty":"medium","url":"...","tips":"..."},{"name":"...","emoji":"...","tagline":"...","use_case":"...","difficulty":"hard","url":"...","tips":"..."}]}`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model:           'deepseek-chat',
      messages:        [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature:     0.4,
      max_tokens:      1000,
    }),
    signal: AbortSignal.timeout(12000),
  })

  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`)

  const data = await res.json()
  const raw  = JSON.parse(data.choices[0].message.content)

  return {
    situation:   raw.situation   ?? '',
    timeline:    raw.timeline    ?? { year1: '', year3: '', year5: '' },
    pivots:      (raw.pivots     ?? []).slice(0, 3),
    action_plan: (raw.action_plan ?? []).slice(0, 5),
    ai_tools:    (raw.ai_tools   ?? MOCK_AI_TOOLS).slice(0, 8),
  }
}

// ── Route Handler ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body  = await req.json()
    const input = Schema.parse(body)

    // 支付验证：仅在生产且 PAYMENT_PROVIDER !== 'mock' 时强制校验
    const paymentEnabled = process.env.NODE_ENV === 'production' &&
                           process.env.PAYMENT_PROVIDER !== 'mock'
    if (paymentEnabled) {
      if (!input.orderId || !isPaid(input.orderId)) {
        return NextResponse.json({ error: '请先完成支付' }, { status: 402 })
      }
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    let report: DeepReportData
    if (apiKey) {
      try {
        report = await callDeepSeek(input)
      } catch (e) {
        console.error('[deep-report] DeepSeek failed, falling back to mock:', e)
        report = getMock(input.jobTitle, input.label)
      }
    } else {
      report = getMock(input.jobTitle, input.label)
    }

    return NextResponse.json(report)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '输入格式错误' }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: '报告生成失败，请稍后重试' }, { status: 500 })
  }
}
