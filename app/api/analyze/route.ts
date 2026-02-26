import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ── 输入验证 Schema ─────────────────────────────────────
const InputSchema = z.object({
  industry:           z.string().min(1),
  jobTitle:           z.string().min(1).max(30),
  tasks:              z.array(z.string().min(5)).min(2).max(5),
  yearsOfExperience:  z.number().min(0).max(40),
  skills: z.object({
    hard: z.array(z.string()),
    soft: z.array(z.string()),
  }),
})

type DimensionScore = { score: number; reason: string }
type Dimensions = {
  routine:    DimensionScore
  social_eq:  DimensionScore
  cognitive:  DimensionScore
  tech_trend: DimensionScore
}

// ── 评分计算（基于 Oxford/GS 权重模型）───────────────────
function calcReplacementRate(d: Dimensions) {
  const dangerScore = d.routine.score * 0.35 + d.tech_trend.score * 0.15
  const safetyScore = d.social_eq.score * 0.25 + d.cognitive.score * 0.25
  const raw = dangerScore - safetyScore * 0.6
  const rate = Math.max(5, Math.min(95, raw + 50))

  const riskLevel =
    rate >= 80 ? { level: 5, label: '极高危', color: '#DC2626' } :
    rate >= 60 ? { level: 4, label: '高风险',  color: '#EA580C' } :
    rate >= 40 ? { level: 3, label: '中等风险', color: '#D97706' } :
    rate >= 20 ? { level: 2, label: '低风险',  color: '#16A34A' } :
                 { level: 1, label: '极低危',  color: '#0891B2' }

  return { replacement_rate: Math.round(rate * 10) / 10, ...riskLevel }
}

// ── Mock 数据（无 API Key 时降级使用）────────────────────
function getMockResult(input: z.infer<typeof InputSchema>) {
  const mockDimensions: Dimensions = {
    routine:   { score: 72, reason: `${input.jobTitle}的日常任务中存在大量规则性、重复性工作，AI可高度覆盖。` },
    social_eq: { score: 58, reason: '岗位涉及一定程度的人际协调，但复杂度处于中等水平。' },
    cognitive: { score: 55, reason: '部分工作需要非结构化判断，AI在此维度覆盖率有限。' },
    tech_trend:{ score: 76, reason: '现有LLM/Agent工具已可处理该岗位约70%的核心输出。' },
  }
  const score = calcReplacementRate(mockDimensions)
  return {
    resultId:   'mock-' + Date.now(),
    ...score,
    dimensions: mockDimensions,
    top_risks: [
      { task: input.tasks[0] || '文档撰写与模板填写', why: 'GPT-4 可在 10 分钟内输出标准草稿，质量持平初级员工' },
      { task: input.tasks[1] || '数据整理与分析',     why: 'Agent 工具已可端到端执行，准确率超人工 20%+' },
      { task: '定期汇报与报表生成',                   why: '自动化率已超 80%，AI 直接输出可用 PPT' },
    ],
    moat_skills: [
      '复杂利益相关方的协调与博弈能力',
      '模糊需求场景下的商业判断力',
      '跨组织的信任构建与人际影响力',
    ],
    is_mock: true,
  }
}

// ── DeepSeek API 调用 ────────────────────────────────────
async function callDeepSeek(input: z.infer<typeof InputSchema>) {
  const prompt = `你是一名职业自动化分析专家，请基于Oxford自动化概率模型和Goldman Sachs AI就业研究框架评估以下岗位。

岗位信息：${input.jobTitle}（${input.industry}行业，${input.yearsOfExperience}年经验）
核心工作任务：
${input.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}
硬技能：${input.skills.hard.join('、') || '未填写'}
软技能：${input.skills.soft.join('、') || '未填写'}

请对以下四个维度分别打分（0-100整数），并给出每项的关键理由（1-2句，30字以内）：
- routine：任务的重复性与可预测性（越高=越危险）
- social_eq：共情、谈判、信任构建需求（越高=越安全）
- cognitive：非结构化决策复杂度（越高=越安全）
- tech_trend：当前LLM/Agent对该岗位任务的实际覆盖率（越高=越危险）

同时输出：
- top_risks：3个最容易被AI替代的具体任务，每项含 task（任务名称，10-20字）和 why（AI已能如何替代，10-20字，以"AI/GPT/Agent"开头）
- moat_skills：3个当前AI最难替代的核心护城河技能（每条10-20字）

严格输出JSON，不要有任何多余文字：
{
  "routine":    {"score": 数字, "reason": "字符串"},
  "social_eq":  {"score": 数字, "reason": "字符串"},
  "cognitive":  {"score": 数字, "reason": "字符串"},
  "tech_trend": {"score": 数字, "reason": "字符串"},
  "top_risks":   [{"task": "字符串", "why": "字符串"}, {"task": "字符串", "why": "字符串"}, {"task": "字符串", "why": "字符串"}],
  "moat_skills": ["字符串", "字符串", "字符串"]
}`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)

  const data = await res.json()
  const raw = JSON.parse(data.choices[0].message.content)

  const dimensions: Dimensions = {
    routine:    { score: Number(raw.routine?.score),    reason: raw.routine?.reason    ?? '' },
    social_eq:  { score: Number(raw.social_eq?.score),  reason: raw.social_eq?.reason  ?? '' },
    cognitive:  { score: Number(raw.cognitive?.score),  reason: raw.cognitive?.reason  ?? '' },
    tech_trend: { score: Number(raw.tech_trend?.score), reason: raw.tech_trend?.reason ?? '' },
  }

  const score = calcReplacementRate(dimensions)
  return {
    resultId:   crypto.randomUUID(),
    ...score,
    dimensions,
    top_risks:   (raw.top_risks ?? []).map((r: unknown) =>
      typeof r === 'string' ? { task: r, why: '' } : r
    ),
    moat_skills: raw.moat_skills ?? [],
    is_mock: false,
  }
}

// ── Route Handler ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = InputSchema.parse(body)

    const apiKey = process.env.DEEPSEEK_API_KEY
    const result = apiKey ? await callDeepSeek(input) : getMockResult(input)

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '输入格式错误', details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: '分析失败，请稍后重试' }, { status: 500 })
  }
}
