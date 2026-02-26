import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({ jobTitle: z.string().min(2).max(30) })

// Mock 降级（无 API Key 时）
const MOCK_TASKS: Record<string, string[]> = {
  '产品经理': ['撰写产品需求文档，组织跨部门评审', '分析用户行为数据，输出迭代优化方案', '协调研发与设计资源，跟进项目排期'],
  '程序员':   ['编写业务功能代码，完成 Code Review', '排查线上故障，定位并修复 Bug', '参与技术方案评审，优化系统性能'],
  '运营':     ['策划并执行内容营销活动方案', '维护用户社群，监控数据指标', '撰写推文/笔记，分析投放效果'],
  '销售':     ['开拓新客户，完成月度销售指标', '跟进潜在客户，推进商务谈判', '维护老客户关系，挖掘续约机会'],
  '财务':     ['编制月度财务报表与预算分析', '审核报销单据，处理日常账务', '配合审计，整理税务申报材料'],
}

function getMockTasks(jobTitle: string): string[] {
  const key = Object.keys(MOCK_TASKS).find(k => jobTitle.includes(k))
  if (key) return MOCK_TASKS[key]
  return [
    `负责${jobTitle}的核心日常执行工作`,
    `整理相关报告与数据，输出分析结论`,
    `与上下游团队沟通协作，推进任务落地`,
  ]
}

export async function POST(req: NextRequest) {
  // 先做输入校验，校验失败返回 400（不静默）
  let jobTitle: string
  try {
    ;({ jobTitle } = Schema.parse(await req.json()))
  } catch {
    return NextResponse.json({ error: '岗位名称需 2-30 字' }, { status: 400 })
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY

    if (!apiKey) {
      return NextResponse.json({ tasks: getMockTasks(jobTitle) })
    }

    const prompt = `请为岗位"${jobTitle}"生成3条典型的日常核心工作任务描述。
要求：每条15-30字，真实具体，贴近实际工作场景，避免泛泛而谈。
直接输出JSON数组，不要有任何多余文字：["任务1", "任务2", "任务3"]`

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    const content = data.choices[0].message.content.trim()

    // 提取 JSON 数组（兼容模型输出有前后空白/markdown的情况）
    const match = content.match(/\[[\s\S]*\]/)
    const tasks: string[] = match ? JSON.parse(match[0]) : getMockTasks(jobTitle)

    return NextResponse.json({ tasks: tasks.slice(0, 3) })
  } catch {
    // AI 调用失败时静默降级，不阻断表单
    return NextResponse.json({ tasks: [] }, { status: 200 })
  }
}
