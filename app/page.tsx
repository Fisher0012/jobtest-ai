'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { BrainCircuit } from 'lucide-react'
// eslint-disable-next-line @next/next/no-img-element

// ── CountUp Hook ──────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 1800) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>()

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    if (!active) { setDisplay(0); stop(); return }

    const startTime = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(parseFloat((eased * target).toFixed(1)))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return stop
  }, [target, active, duration, stop])

  const done = display >= target - 0.05
  return done ? target : display
}

// ── 类型定义 ─────────────────────────────────────────────
type DimensionScore = { score: number; reason: string }
type RiskItem       = { task: string; why: string }

type AITool = {
  name:       string
  emoji:      string
  tagline:    string
  use_case:   string
  difficulty: 'easy' | 'medium' | 'hard'
  url:        string
  tips:       string
}

type DeepReport = {
  situation:   string
  timeline:    { year1: string; year3: string; year5: string }
  pivots:      Array<{ role: string; match: number; reason: string; skills: string[] }>
  action_plan: string[]
  ai_tools:    AITool[]
}

type AnalysisResult = {
  resultId:         string
  replacement_rate: number
  level:            number
  label:            string
  color:            string
  dimensions: {
    routine:    DimensionScore
    social_eq:  DimensionScore
    cognitive:  DimensionScore
    tech_trend: DimensionScore
  }
  top_risks:   RiskItem[]
  moat_skills: string[]
  is_mock:     boolean
}

type PayModal    = 'closed' | 'selecting' | 'paying' | 'success'
type PayProvider = 'mock' | 'wechat' | 'alipay'
type ReportTab   = 'timeline' | 'pivots' | 'actions' | 'tools'

// ── 常量 ─────────────────────────────────────────────────
const DIMENSIONS_META = {
  routine:    { label: '重复性指数',   icon: '🔄', desc: '任务重复性与可预测性', danger: true  },
  social_eq:  { label: '社交情商指数', icon: '🤝', desc: '共情与人际协调需求',   danger: false },
  cognitive:  { label: '认知复杂度',   icon: '🧠', desc: '非结构化决策复杂度',   danger: false },
  tech_trend: { label: 'AI覆盖率',     icon: '⚡', desc: '当前LLM/Agent渗透率',  danger: true  },
}

const INDUSTRY_CHIPS = [
  '互联网/科技', '金融/银行/证券', '教育/培训', '医疗/健康',
  '制造业', '零售/电商', '咨询/法律', '传媒/广告/公关', '政府/事业单位',
  '建筑/房地产', '餐饮/食品', '物流/供应链', '文化/娱乐/游戏',
  '旅游/酒店', '汽车/新能源', '农业/农林牧渔', '能源/化工',
]

// ── 职位→技能映射（最高分匹配：关键词越长越精确，分值越高）──
const ROLE_SKILL_MAP: { keywords: string[]; hard: string[]; soft: string[] }[] = [
  // 产品
  {
    keywords: ['产品经理', '产品总监', '产品负责人', '产品VP', 'PM', '产品策划'],
    hard: ['Axure', 'Figma', 'PRD写作', 'SQL', 'AIGC应用', '用户研究'],
    soft: ['项目管理', '沟通协调', '逻辑思维', '同理心', '跨部门协作'],
  },
  // 软件开发
  {
    keywords: ['程序员', '前端工程师', '后端工程师', '全栈工程师', '软件工程师',
               '架构师', '前端开发', '后端开发', '软件开发', '移动开发',
               'iOS开发', 'Android开发', '客户端工程师', '服务端工程师'],
    hard: ['Python', 'JavaScript', 'Java', 'SQL', 'Git', 'AIGC应用'],
    soft: ['解决问题', '逻辑思维', '自驱力', '抗压', '持续学习'],
  },
  // 运维 / DevOps
  {
    keywords: ['运维工程师', 'DevOps', '系统工程师', '网络工程师', '安全工程师', '云计算工程师'],
    hard: ['Linux', 'Docker', 'Kubernetes', 'Python', 'AIGC应用'],
    soft: ['细致严谨', '解决问题', '责任心', '抗压', '持续学习'],
  },
  // 测试 / QA
  {
    keywords: ['测试工程师', '质量工程师', 'QA工程师', '自动化测试', '性能测试'],
    hard: ['Python', 'Selenium', 'SQL', 'JIRA', 'AIGC应用'],
    soft: ['细致严谨', '逻辑思维', '沟通', '解决问题', '责任心'],
  },
  // 数据 / AI
  {
    keywords: ['数据分析师', '数据科学家', '数据工程师', '算法工程师',
               '机器学习工程师', 'AI工程师', '数据挖掘工程师', '大数据工程师'],
    hard: ['Python', 'SQL', '机器学习', 'Tableau', 'AIGC应用', 'Excel'],
    soft: ['逻辑思维', '解决问题', '自驱力', '业务理解', '持续学习'],
  },
  // 内容 / 新媒体运营
  {
    keywords: ['内容运营', '新媒体运营', '社群运营', '用户运营', '活动运营', '内容策划'],
    hard: ['Excel', 'AIGC应用', '数据分析', 'PPT', 'Photoshop'],
    soft: ['创造力', '用户洞察', '文案写作', '执行力', '沟通'],
  },
  // 电商运营
  {
    keywords: ['电商运营', '增长运营', '直播运营', '店铺运营', '流量运营', '推广运营'],
    hard: ['Excel', 'AIGC应用', '数据分析', '生意参谋', 'PPT'],
    soft: ['数据敏感', '执行力', '用户洞察', '抗压', '沟通'],
  },
  // 销售 / 商务
  {
    keywords: ['销售经理', '销售总监', '大客户经理', '客户经理', '商务拓展',
               'BD', '业务员', '销售代表', '销售顾问', '区域经理'],
    hard: ['Excel', 'PPT', 'CRM系统', 'AIGC应用'],
    soft: ['沟通谈判', '客户关系', '抗压', '目标导向', '演讲表达'],
  },
  // 财务 / 会计
  {
    keywords: ['财务经理', '财务总监', '财务分析师', '会计', '审计', '出纳',
               '税务', '成本会计', '总账会计', 'CFO', '财务'],
    hard: ['Excel', 'SAP', '财务软件', 'SQL', 'AIGC应用'],
    soft: ['数字敏感', '严谨细致', '风险意识', '合规意识', '沟通'],
  },
  // UI / UX 设计
  {
    keywords: ['UI设计师', 'UX设计师', '交互设计师', '用户体验设计师', 'UI/UX', '产品设计师'],
    hard: ['Figma', 'Photoshop', 'Sketch', 'AIGC应用', 'Midjourney'],
    soft: ['用户思维', '创造力', '细节把控', '沟通', '审美洞察'],
  },
  // 平面 / 品牌设计
  {
    keywords: ['平面设计师', '品牌设计师', '视觉设计师', '美工', '插画师', '图形设计'],
    hard: ['Photoshop', 'Illustrator', 'AIGC应用', 'Midjourney', 'Figma'],
    soft: ['创造力', '审美洞察', '细节把控', '执行力', '沟通'],
  },
  // 视频 / 影视
  {
    keywords: ['视频剪辑', '剪辑师', '导演', '摄影师', '摄像师', '影视制作', '短视频'],
    hard: ['PR/AE', 'Photoshop', 'AIGC应用', 'DaVinci', 'Final Cut'],
    soft: ['创造力', '审美洞察', '细节把控', '执行力', '沟通'],
  },
  // 人力资源
  {
    keywords: ['人力资源', 'HR经理', 'HRBP', '招聘经理', '人事经理',
               '薪酬福利', '组织发展', '培训发展', 'HR总监'],
    hard: ['Excel', 'PPT', 'AIGC应用', 'HRIS系统'],
    soft: ['沟通', '同理心', '组织协调', '判断力', '保密意识'],
  },
  // 市场 / 营销
  {
    keywords: ['市场经理', '市场总监', '品牌经理', '营销经理', '市场推广',
               '广告投放', '市场策划', 'CMO', '增长黑客'],
    hard: ['Excel', 'PPT', 'AIGC应用', 'Photoshop', '数据分析'],
    soft: ['创造力', '用户洞察', '项目管理', '演讲表达', '沟通'],
  },
  // 文案 / 编辑
  {
    keywords: ['文案策划', '文案编辑', '内容编辑', '文字编辑', '撰稿人', '创意文案'],
    hard: ['PPT', 'AIGC应用', 'Photoshop', 'Excel'],
    soft: ['创造力', '文案写作', '逻辑思维', '用户洞察', '细节把控'],
  },
  // 教育 / 教师
  {
    keywords: ['教师', '老师', '讲师', '班主任', '培训师', '教育顾问', '学科教师'],
    hard: ['PPT', 'AIGC应用', '课程设计', 'Excel'],
    soft: ['沟通表达', '同理心', '耐心', '持续学习', '课堂管理'],
  },
  // 医疗
  {
    keywords: ['医生', '护士', '医师', '药师', '主治医师', '主任医师',
               '外科医生', '内科医生', '全科医生', '医护人员'],
    hard: ['医疗信息系统', 'AIGC应用', '临床技能', '医学文献检索'],
    soft: ['同理心', '严谨细致', '沟通', '抗压', '责任心'],
  },
  // 法律
  {
    keywords: ['律师', '法务经理', '法务总监', '合规经理', '法律顾问',
               '知识产权', '法官', '检察官'],
    hard: ['法律文书', 'AIGC应用', '合同审查', '案例检索'],
    soft: ['逻辑思维', '沟通谈判', '严谨细致', '抗压', '保密意识'],
  },
  // 项目管理
  {
    keywords: ['项目经理', '项目总监', 'PMP', 'PMO', '敏捷教练', 'Scrum Master'],
    hard: ['Excel', 'PPT', 'AIGC应用', 'JIRA', 'MS Project'],
    soft: ['项目管理', '沟通协调', '风险意识', '领导力', '抗压'],
  },
  // 客服
  {
    keywords: ['客服', '售后', '用户支持', '客户服务', '在线客服', '客服主管'],
    hard: ['CRM系统', 'Excel', 'AIGC应用'],
    soft: ['沟通', '同理心', '耐心', '抗压', '解决问题'],
  },
  // 行政 / 助理
  {
    keywords: ['行政专员', '行政助理', '秘书', '总裁助理', '总助', '前台'],
    hard: ['Excel', 'PPT', 'AIGC应用', 'Office套件'],
    soft: ['沟通协调', '细致执行', '保密意识', '时间管理', '应变能力'],
  },
  // 供应链 / 采购
  {
    keywords: ['供应链', '采购经理', '采购专员', '物流经理', '仓储管理',
               '供应商管理', '进出口', '计划专员'],
    hard: ['Excel', 'SAP', 'ERP系统', 'AIGC应用'],
    soft: ['谈判', '风险意识', '沟通协调', '数据敏感', '解决问题'],
  },
  // 建筑 / 土木 / 机械工程
  {
    keywords: ['机械工程师', '土木工程师', '结构工程师', '建筑师', '暖通工程师',
               '电气工程师', '施工员', '建筑设计师', '工程造价'],
    hard: ['AutoCAD', 'BIM', 'Revit', 'AIGC应用', 'Excel'],
    soft: ['严谨细致', '解决问题', '沟通协调', '项目管理', '责任心'],
  },
  // 咨询 / 顾问
  {
    keywords: ['咨询顾问', '管理咨询', '战略咨询', '业务顾问', '实施顾问'],
    hard: ['Excel', 'PPT', 'AIGC应用', '数据分析', 'SQL'],
    soft: ['逻辑思维', '沟通表达', '解决问题', '客户关系', '持续学习'],
  },
  // 金融 / 投资
  {
    keywords: ['基金经理', '投资经理', '证券分析师', '研究员', '投行', '风控经理', '信贷'],
    hard: ['Excel', 'Python', 'SQL', 'AIGC应用', '数据分析'],
    soft: ['逻辑思维', '风险意识', '数字敏感', '抗压', '持续学习'],
  },
]

const DEFAULT_HARD_CHIPS = ['Excel', 'PPT', 'AIGC应用', 'SQL', 'Python', 'Figma', '数据分析']
const DEFAULT_SOFT_CHIPS = ['沟通', '项目管理', '解决问题', '同理心', '抗压', '创造力', '领导力']

// 关键词长度平方加权 → 越精确的关键词得分越高，取最高分条目
function getSkillsForRole(title: string): { hard: string[]; soft: string[] } {
  const lower = title.trim().toLowerCase()
  if (!lower) return { hard: DEFAULT_HARD_CHIPS, soft: DEFAULT_SOFT_CHIPS }

  let best: { hard: string[]; soft: string[] } | null = null
  let bestScore = 0

  for (const entry of ROLE_SKILL_MAP) {
    let score = 0
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length * kw.length
      }
    }
    if (score > bestScore) {
      bestScore = score
      best = { hard: entry.hard, soft: entry.soft }
    }
  }

  return best ?? { hard: DEFAULT_HARD_CHIPS, soft: DEFAULT_SOFT_CHIPS }
}

const SCAN_MESSAGES = [
  '扫描职业特征数据…',
  '比对 Oxford 自动化数据库…',
  '评估 LLM 渗透率…',
  '计算薪资风险曲线…',
  '生成个性化诊断…',
]

const REPORT_TABS: { id: ReportTab; label: string }[] = [
  { id: 'timeline', label: 'AI冲击轴' },
  { id: 'pivots',   label: '转型路径' },
  { id: 'actions',  label: '行动计划' },
  { id: 'tools',    label: 'AI工具箱' },
]

const DIFFICULTY_MAP = {
  easy:   { label: '入门', color: '#16A34A', bg: '#DCFCE7' },
  medium: { label: '进阶', color: '#D97706', bg: '#FEF3C7' },
  hard:   { label: '高阶', color: '#DC2626', bg: '#FEE2E2' },
}

// ── 工具函数 ─────────────────────────────────────────────
function toggleSkill(current: string, skill: string): string {
  const parts = current.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  const idx = parts.findIndex(s => s.toLowerCase() === skill.toLowerCase())
  if (idx >= 0) parts.splice(idx, 1)
  else parts.push(skill)
  return parts.join(', ')
}

function dimColor(score: number, danger: boolean) {
  if (danger) return score >= 70 ? '#DC2626' : score >= 40 ? '#EA580C' : '#16A34A'
  return score >= 70 ? '#16A34A' : score >= 40 ? '#D97706' : '#DC2626'
}

// ── 主页面 ────────────────────────────────────────────────
export default function Home() {
  const [step, setStep]     = useState<'form' | 'loading' | 'result'>('form')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError]   = useState<string | null>(null)

  const animatedRate = useCountUp(result?.replacement_rate ?? 0, step === 'result')

  // Form state
  const [industry, setIndustry]     = useState('')
  const [jobTitle, setJobTitle]     = useState('')
  const [tasks, setTasks]           = useState(['', '', ''])
  const [years, setYears]           = useState(3)
  const [hardSkills, setHardSkills] = useState('')
  const [softSkills, setSoftSkills] = useState('')
  const [taskSuggesting, setTaskSuggesting] = useState(false)
  const [suggestedSkills, setSuggestedSkills] = useState<{ hard: string[]; soft: string[] }>({
    hard: DEFAULT_HARD_CHIPS,
    soft: DEFAULT_SOFT_CHIPS,
  })

  // Scan animation
  const [scanIdx, setScanIdx] = useState(0)

  // Report + payment state
  const [reportLoading, setReportLoading]   = useState(false)
  const [streamingText, setStreamingText]   = useState('')
  const [deepReport, setDeepReport]         = useState<DeepReport | null>(null)
  const [reportElapsed, setReportElapsed]   = useState(0)
  const [payModal, setPayModal]           = useState<PayModal>('closed')
  const [orderId, setOrderId]             = useState<string | null>(null)
  const [payError, setPayError]           = useState<string | null>(null)
  const [deepReportTab, setDeepReportTab] = useState<ReportTab>('timeline')
  const [expandedTool, setExpandedTool]   = useState<number | null>(null)
  const [openid, setOpenid]               = useState<string | null>(null)

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 扫描动画：每 2.2s 切换一条文案
  useEffect(() => {
    if (step !== 'loading') return
    setScanIdx(0)
    const id = setInterval(() => setScanIdx(i => (i + 1) % SCAN_MESSAGES.length), 2200)
    return () => clearInterval(id)
  }, [step])

  // 深度报告计时器
  useEffect(() => {
    if (!reportLoading) { setReportElapsed(0); return }
    const id = setInterval(() => setReportElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [reportLoading])

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // 检测是否在微信环境
  const isWechatBrowser = typeof window !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent)

  // 微信环境下获取 openid
  useEffect(() => {
    if (!isWechatBrowser) return

    // 从 URL 获取 openid（回调后）
    const urlParams = new URLSearchParams(window.location.search)
    const callbackOpenid = urlParams.get('openid')

    if (callbackOpenid) {
      setOpenid(callbackOpenid)
      // 清除 URL 中的 openid 参数
      const cleanUrl = window.location.href.split('?')[0]
      window.history.replaceState({}, '', cleanUrl)
      return
    }

    // 没有 openid 则跳转授权
    if (!openid) {
      const redirect = window.location.pathname + window.location.search
      window.location.href = `/api/wechat/auth?redirect=${encodeURIComponent(redirect)}`
    }
  }, [isWechatBrowser, openid])

  // 任务建议
  const triggerSuggest = useCallback(async (title: string) => {
    if (title.trim().length < 2) return
    setTaskSuggesting(true)
    try {
      const res = await fetch('/api/suggest-tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobTitle: title.trim() }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.tasks?.length) {
        setTasks(prev => {
          const next = [...prev]
          ;(data.tasks as string[]).slice(0, 3).forEach((t, i) => { next[i] = t })
          return next
        })
      }
    } catch { /* 静默降级 */ }
    finally { setTaskSuggesting(false) }
  }, [])

  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (jobTitle.trim().length < 2) return
    suggestTimer.current = setTimeout(() => { triggerSuggest(jobTitle) }, 700)
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current) }
  }, [jobTitle, triggerSuggest])

  // 职位→技能标签联动（即时，无需 API）
  useEffect(() => {
    setSuggestedSkills(getSkillsForRole(jobTitle))
  }, [jobTitle])

  // 获取深度报告（mock成功、调试按钮、真实支付轮询成功，均走此函数）
  const fetchDeepReport = useCallback(async (oid: string) => {
    if (!result) return
    setPayModal('closed')
    setReportLoading(true)
    setStreamingText('')
    try {
      const reportRes = await fetch('/api/deep-report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          industry, jobTitle,
          tasks:             tasks.filter(t => t.trim().length >= 5),
          yearsOfExperience: years,
          skills: {
            hard: hardSkills.split(/[,，]/).map(s => s.trim()).filter(Boolean),
            soft: softSkills.split(/[,，]/).map(s => s.trim()).filter(Boolean),
          },
          replacement_rate: result.replacement_rate,
          label:            result.label,
          dimensions:       result.dimensions,
          orderId:          oid,
        }),
      })
      if (!reportRes.ok) throw new Error('生成失败')

      const reader  = reportRes.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()!
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          try {
            const evt = JSON.parse(payload)
            if (evt.type === 'chunk') {
              setStreamingText(t => t + evt.text)
            } else if (evt.type === 'done') {
              setDeepReport(evt.report)
              setStreamingText('')
              setDeepReportTab('timeline')
            } else if (evt.type === 'error') {
              throw new Error(evt.message)
            }
          } catch { /* ignore malformed event */ }
        }
      }
    } catch (e) {
      console.error('[fetchDeepReport]', e)
      setStreamingText('')
      setError('报告生成失败，请点击"解锁深度转型报告"重试')
    } finally {
      setReportLoading(false)
    }
  }, [result, industry, jobTitle, tasks, years, hardSkills, softSkills])

  // 支付并获取深度报告
  const handlePayOrder = useCallback(async (provider: PayProvider) => {
    if (!result) return
    setPayModal('paying')
    setPayError(null)

    try {
      const res = await fetch('/api/orders/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ provider, jobTitle, ...(openid ? { openid } : {}) }),
      })
      if (!res.ok) throw new Error('创建订单失败')
      const data = await res.json() as {
        orderId: string; mock: boolean; wechatH5Url?: string; alipayUrl?: string
      }

      setOrderId(data.orderId)

      if (data.wechatH5Url) window.open(data.wechatH5Url, '_blank')
      if (data.alipayUrl)   window.open(data.alipayUrl, '_blank')

      // Mock模式：客户端直接推进，不依赖服务端轮询（HMR 安全）
      if (data.mock) {
        setTimeout(() => {
          setPayModal('success')
          setTimeout(() => fetchDeepReport(data.orderId), 1200)
        }, 1500)
        return
      }

      // 真实支付：轮询订单状态
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/orders/${data.orderId}/status`)
          if (r.status === 404) {
            // 服务重启导致订单丢失，回到支付选择页
            clearInterval(pollRef.current!); pollRef.current = null
            setPayModal('selecting')
            return
          }
          if (!r.ok) return
          const { status } = await r.json() as { status: string }
          if (status === 'paid') {
            clearInterval(pollRef.current!); pollRef.current = null
            setPayModal('success')
            setTimeout(() => fetchDeepReport(data.orderId), 1200)
          } else if (status === 'expired') {
            clearInterval(pollRef.current!); pollRef.current = null
            setPayModal('closed')
          }
        } catch { /* ignore */ }
      }, 2000)

    } catch (err) {
      console.error('[handlePayOrder] 支付失败:', err)
      setPayError(err instanceof Error ? err.message : '支付失败，请重试')
      setPayModal('selecting')
    }
  }, [result, jobTitle, fetchDeepReport])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filledTasks = tasks.filter(t => t.trim().length >= 5)
    if (filledTasks.length < 2) {
      setError('请至少填写 2 条有效的工作任务（每条 5 字以上）')
      return
    }
    setError(null)
    setStep('loading')
    try {
      const res = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          industry:          industry.trim() || '其他',
          jobTitle,
          tasks:             filledTasks,
          yearsOfExperience: years,
          skills: {
            hard: hardSkills.split(/[,，]/).map(s => s.trim()).filter(Boolean),
            soft: softSkills.split(/[,，]/).map(s => s.trim()).filter(Boolean),
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? '服务器错误')
      }
      setResult(await res.json())
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误，请重试')
      setStep('form')
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F6FA] font-sans overflow-x-hidden">

      {/* 顶栏 */}
      <header className="border-b border-black/8 px-6 py-4 sticky top-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AI 未来感美女头像 — DiceBear lorelei */}
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-purple-200"
              style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 100%)', boxShadow: '0 2px 10px rgba(139,92,246,0.3)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.dicebear.com/9.x/lorelei/svg?seed=cyberqueen&backgroundColor=1a0533&backgroundType=solid&hairColor=7c3aed,6d28d9,a855f7"
                alt="AI"
                width={36}
                height={36}
              />
            </div>
            <div>
              <p className="font-bold text-base leading-none text-[#111118]">AI 职业危机指数</p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">Oxford · Goldman Sachs 模型</p>
            </div>
          </div>
          {step === 'result' && (
            <button
              onClick={() => { setStep('form'); setResult(null); setDeepReport(null) }}
              className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              重新测评 →
            </button>
          )}
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 py-8">

        {/* ══════════════ 表单页 ══════════════ */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-7">

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#111118]">你的职位会被 AI 取代吗？</h2>
              <p className="text-sm text-[#9CA3AF]">填写越详细，结果越准确 · 约 2 分钟</p>
            </div>

            {/* 行业 */}
            <Field label="所在行业" required>
              <div className="flex flex-wrap gap-2 mt-2 mb-2.5">
                {INDUSTRY_CHIPS.map(ind => (
                  <button
                    key={ind} type="button"
                    onClick={() => setIndustry(ind)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      industry === ind
                        ? 'bg-[#111118] text-white border-[#111118]'
                        : 'border-black/15 text-[#6B7280] hover:border-black/30 hover:text-[#374151]'
                    }`}
                  >{ind}</button>
                ))}
              </div>
              <input
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="或手动输入行业，如：新能源汽车、短视频、游戏开发…"
                className="w-full bg-[#F9FAFB] border border-black/10 rounded-lg px-3 py-2.5 text-sm text-[#111118] placeholder-black/25 focus:outline-none focus:border-black/30 transition-colors"
                maxLength={20}
              />
            </Field>

            {/* 岗位名称 */}
            <Field label="岗位名称" required>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="如：产品经理、财务分析师、运营专员"
                required maxLength={30}
                className="w-full mt-1 bg-[#F9FAFB] border border-black/10 rounded-lg px-3 py-2.5 text-sm text-[#111118] placeholder-black/25 focus:outline-none focus:border-black/30 transition-colors"
              />
            </Field>

            {/* 核心日常工作任务 */}
            <Field
              label="核心日常工作任务"
              required
              hint={taskSuggesting ? '正在生成…' : '填写 2-5 条，越具体越准'}
            >
              {!taskSuggesting && jobTitle.trim().length >= 2 && tasks.some(t => t) && (
                <div className="flex items-center justify-between mt-1.5 mb-1">
                  <p className="text-[11px] text-[#9CA3AF]">✦ 已根据岗位自动生成，可直接修改</p>
                  <button
                    type="button"
                    onClick={() => triggerSuggest(jobTitle)}
                    className="text-[11px] text-[#9CA3AF] hover:text-[#374151] flex items-center gap-1 transition-colors"
                  >
                    <span className="text-sm leading-none">↻</span> 换一批
                  </button>
                </div>
              )}
              {taskSuggesting && (
                <p className="text-[11px] text-[#9CA3AF] mt-1.5 mb-1 flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 border border-black/20 border-t-[#111118]/60 rounded-full animate-spin" />
                  AI 正在重新生成…
                </p>
              )}
              <div className="space-y-2 mt-1">
                {tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[#C4C4C4] text-xs w-4 shrink-0">{i + 1}.</span>
                    <input
                      value={t}
                      onChange={e => {
                        const next = [...tasks]; next[i] = e.target.value; setTasks(next)
                      }}
                      placeholder={i < 3 ? '请输入或修改工作任务' : '（选填）'}
                      className="flex-1 bg-[#F9FAFB] border border-black/10 rounded-lg px-3 py-2.5 text-sm text-[#111118] placeholder-black/20 focus:outline-none focus:border-black/30 transition-colors"
                      maxLength={80}
                    />
                  </div>
                ))}
                {tasks.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setTasks([...tasks, ''])}
                    className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors pl-6"
                  >
                    + 添加一条任务
                  </button>
                )}
              </div>
            </Field>

            {/* 从业年限 */}
            <Field label={`从业年限：${years} 年`}>
              <input
                type="range" min={0} max={20} value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full mt-2 accent-[#111118]"
              />
              <div className="flex justify-between text-[10px] text-[#C4C4C4] mt-1">
                <span>应届</span><span>5年</span><span>10年</span><span>15年</span><span>20年+</span>
              </div>
            </Field>

            {/* 技能 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="硬技能" hint="点选或输入">
                <input
                  value={hardSkills}
                  onChange={e => setHardSkills(e.target.value)}
                  placeholder="如：Python, SQL, Excel"
                  className="w-full mt-1 bg-[#F9FAFB] border border-black/10 rounded-lg px-3 py-2.5 text-sm text-[#111118] placeholder-black/25 focus:outline-none focus:border-black/30 transition-colors"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestedSkills.hard.map(chip => {
                    const active = hardSkills.split(/[,，]/).map(s => s.trim().toLowerCase()).includes(chip.toLowerCase())
                    return (
                      <button
                        key={chip} type="button"
                        onClick={() => setHardSkills(toggleSkill(hardSkills, chip))}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                          active
                            ? 'bg-[#111118] text-white border-[#111118]'
                            : 'border-black/15 text-[#6B7280] hover:border-black/30 hover:text-[#374151]'
                        }`}
                      >{chip}</button>
                    )
                  })}
                </div>
              </Field>
              <Field label="软技能" hint="点选或输入">
                <input
                  value={softSkills}
                  onChange={e => setSoftSkills(e.target.value)}
                  placeholder="如：沟通, 管理, 同理心"
                  className="w-full mt-1 bg-[#F9FAFB] border border-black/10 rounded-lg px-3 py-2.5 text-sm text-[#111118] placeholder-black/25 focus:outline-none focus:border-black/30 transition-colors"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestedSkills.soft.map(chip => {
                    const active = softSkills.split(/[,，]/).map(s => s.trim().toLowerCase()).includes(chip.toLowerCase())
                    return (
                      <button
                        key={chip} type="button"
                        onClick={() => setSoftSkills(toggleSkill(softSkills, chip))}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                          active
                            ? 'bg-[#111118] text-white border-[#111118]'
                            : 'border-black/15 text-[#6B7280] hover:border-black/30 hover:text-[#374151]'
                        }`}
                      >{chip}</button>
                    )
                  })}
                </div>
              </Field>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!jobTitle.trim()}
              className="w-full py-4 rounded-xl font-bold text-base bg-[#111118] text-white hover:bg-[#111118]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              开始测评 →
            </button>

            <p className="text-[10px] text-[#C4C4C4] text-center leading-relaxed">
              ⚠️ 测评结果仅供参考，基于公开学术模型推算，不代表任何就业建议或岗位价值判断。
            </p>
          </form>
        )}

        {/* ══════════════ 加载中（扫描动画）══════════════ */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-5">
            {/* 终端风格容器 */}
            <div className="w-full max-w-sm bg-[#111118] rounded-2xl p-6 shadow-xl">
              {/* 伪标题栏 */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="text-white/25 text-xs ml-2 font-mono">ai-career-scanner</span>
              </div>
              {/* 扫描消息列表 */}
              <div className="space-y-2.5 font-mono text-sm">
                {SCAN_MESSAGES.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 transition-all duration-500 ${
                      i < scanIdx  ? 'text-green-400' :
                      i === scanIdx ? 'text-green-300' : 'text-white/20'
                    }`}
                  >
                    <span className="text-white/30 shrink-0">{'>>'}</span>
                    <span>{msg}</span>
                    {i < scanIdx && <span className="text-green-500 ml-auto">✓</span>}
                    {i === scanIdx && (
                      <span className="ml-auto inline-block w-1.5 h-4 bg-green-400 animate-pulse-glow" />
                    )}
                  </div>
                ))}
              </div>
              {/* 进度条 */}
              <div className="mt-5 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-[2200ms]"
                  style={{ width: `${Math.min(((scanIdx + 1) / SCAN_MESSAGES.length) * 95, 95)}%` }}
                />
              </div>
            </div>
            <p className="text-[#C4C4C4] text-xs">通常需要 6–10 秒，请稍候</p>
          </div>
        )}

        {/* ══════════════ 结果页 ══════════════ */}
        {step === 'result' && result && (
          <div className="space-y-4">

            {result.is_mock && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span>⚠️</span>
                <span>演示模式（未配置 API Key），数据为示例数据</span>
              </div>
            )}

            {/* 核心数字卡 */}
            <div
              className="rounded-2xl p-6 border bg-white"
              style={{ borderColor: result.color + '30' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#9CA3AF] text-xs font-mono uppercase tracking-widest">AI 替代概率</p>
                  <p
                    className="font-display font-black mt-1 leading-none font-display-num animate-number-enter"
                    style={{ color: result.color, fontSize: 'clamp(56px, 18vw, 88px)' }}
                  >
                    {animatedRate === result.replacement_rate
                      ? (Number.isInteger(result.replacement_rate)
                          ? result.replacement_rate
                          : result.replacement_rate.toFixed(1))
                      : animatedRate.toFixed(1)}
                    <span style={{ fontSize: '40%' }}>%</span>
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block text-sm font-bold px-3 py-1.5 rounded-full"
                    style={{ background: result.color + '15', color: result.color }}
                  >
                    {result.label}
                  </span>
                  <p className="text-[#9CA3AF] text-xs mt-2">风险等级 {result.level}/5</p>
                </div>
              </div>
              <div className="mt-5 h-2 bg-black/6 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${result.replacement_rate}%`, background: result.color }}
                />
              </div>
            </div>

            {/* 四维分析 */}
            <div className="rounded-2xl bg-white border border-black/8 p-5">
              <p className="text-xs text-[#9CA3AF] font-mono uppercase tracking-widest mb-4">四维分析</p>
              <div className="space-y-4">
                {(Object.entries(DIMENSIONS_META) as [keyof typeof DIMENSIONS_META, (typeof DIMENSIONS_META)[keyof typeof DIMENSIONS_META]][]).map(([key, meta]) => {
                  const dim   = result.dimensions[key]
                  const color = dimColor(dim.score, meta.danger)
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{meta.icon}</span>
                          <span className="text-sm font-medium text-[#374151]">{meta.label}</span>
                          <span className="text-[10px] text-[#9CA3AF]">{meta.desc}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {meta.danger && <span className="text-[10px] text-[#C4C4C4]">危险↑</span>}
                          <span className="text-sm font-bold tabular-nums" style={{ color }}>{dim.score}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-black/6 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${dim.score}%`, background: color }}
                        />
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-1.5 leading-relaxed">{dim.reason}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 高危任务 */}
            <div className="rounded-2xl bg-white border border-red-200 p-5">
              <p className="text-xs text-red-500 font-mono uppercase tracking-widest mb-3">
                🔴 高危任务（最易被取代）
              </p>
              <ul className="space-y-4">
                {result.top_risks.map((risk, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-red-400 font-mono text-sm mt-0.5 shrink-0 w-4">{i + 1}.</span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[#111118] leading-snug">{risk.task}</p>
                      {risk.why && (
                        <p className="text-xs text-[#6B7280] leading-relaxed bg-red-50 rounded-md px-2.5 py-1.5">
                          💡 {risk.why}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 护城河 */}
            <div className="rounded-2xl bg-white border border-green-200 p-5">
              <p className="text-xs text-green-600 font-mono uppercase tracking-widest mb-3">
                🛡️ 职业护城河（AI 难以替代）
              </p>
              <ul className="space-y-2.5">
                {result.moat_skills.map((skill, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#374151]">
                    <span className="text-green-500">✓</span>
                    <span className="leading-relaxed">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── 深度转型报告 ── */}
            {!deepReport && !reportLoading && (
              <div className="rounded-2xl bg-white border border-black/8 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-3xl leading-none">📋</div>
                  <div>
                    <p className="text-sm font-bold text-[#111118]">深度转型报告</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      AI冲击时间轴 · 3条转型路径 · 90天行动计划 · AI工具箱
                    </p>
                  </div>
                </div>

                {/* 内容预览（模糊锁定） */}
                <div className="relative mb-4 rounded-xl overflow-hidden">
                  <div className="space-y-2 p-3 bg-[#F9FAFB] blur-[3px] select-none pointer-events-none">
                    <div className="h-3 bg-black/10 rounded w-3/4" />
                    <div className="h-3 bg-black/8 rounded w-full" />
                    <div className="h-3 bg-black/8 rounded w-5/6" />
                    <div className="h-3 bg-black/6 rounded w-2/3" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <span className="text-xs text-[#6B7280] font-medium">解锁后查看完整报告</span>
                  </div>
                </div>

                <button
                  onClick={() => setPayModal('selecting')}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#111118] text-white hover:bg-[#111118]/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>解锁深度转型报告</span>
                  <span className="text-white/60 font-normal text-xs">¥9.9</span>
                </button>
              </div>
            )}

            {/* 报告加载中 */}
            {reportLoading && (
              <div className="rounded-2xl bg-white border border-black/8 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 border-2 border-black/10 border-t-[#111118] rounded-full animate-spin flex-shrink-0" />
                  <p className="text-sm text-[#374151] font-medium">AI 正在生成报告… {reportElapsed}s</p>
                </div>
                {streamingText ? (
                  <div className="bg-[#F9FAFB] rounded-xl p-4 text-sm text-[#374151] leading-relaxed font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                    {streamingText}
                    <span className="inline-block w-0.5 h-4 bg-[#111118] animate-pulse ml-0.5 align-middle" />
                  </div>
                ) : (
                  <p className="text-xs text-[#9CA3AF]">正在连接 AI 模型…</p>
                )}
              </div>
            )}

            {/* 深度报告（Tab UI） */}
            {deepReport && (
              <div className="space-y-3">
                {/* 处境诊断（始终显示） */}
                <div className="rounded-2xl bg-[#111118] p-5">
                  <p className="text-xs text-white/40 font-mono uppercase tracking-widest mb-2.5">处境诊断</p>
                  <p className="text-white font-medium leading-relaxed">{deepReport.situation}</p>
                </div>

                {/* Tab 面板 */}
                <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                  {/* Tab 导航 */}
                  <div className="flex border-b border-black/8 overflow-x-auto">
                    {REPORT_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setDeepReportTab(tab.id)}
                        className={`flex-1 min-w-0 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                          deepReportTab === tab.id
                            ? 'text-[#111118] border-[#111118]'
                            : 'text-[#9CA3AF] border-transparent hover:text-[#374151]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">

                    {/* Tab: AI冲击时间轴 */}
                    {deepReportTab === 'timeline' && (
                      <div className="space-y-3.5">
                        {([
                          { year: '1年内', content: deepReport.timeline.year1, color: '#D97706' },
                          { year: '3年内', content: deepReport.timeline.year3, color: '#EA580C' },
                          { year: '5年后', content: deepReport.timeline.year5, color: '#DC2626' },
                        ] as const).map(item => (
                          <div key={item.year} className="flex gap-3">
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 self-start"
                              style={{ background: item.color + '15', color: item.color }}
                            >
                              {item.year}
                            </span>
                            <p className="text-sm text-[#374151] leading-relaxed">{item.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab: 推荐转型路径 */}
                    {deepReportTab === 'pivots' && (
                      <div className="space-y-3">
                        {deepReport.pivots.map((pivot, i) => (
                          <div key={i} className="border border-black/8 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-bold text-[#111118]">{pivot.role}</span>
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                                匹配 {pivot.match}%
                              </span>
                            </div>
                            <p className="text-xs text-[#6B7280] mb-2.5 leading-relaxed">{pivot.reason}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {pivot.skills.map((sk, j) => (
                                <span
                                  key={j}
                                  className="text-xs px-2 py-0.5 bg-[#F5F6FA] text-[#6B7280] rounded-full border border-black/8"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab: 90天行动计划 */}
                    {deepReportTab === 'actions' && (
                      <div className="space-y-3">
                        {deepReport.action_plan.map((action, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#F5F6FA] border border-black/8 flex items-center justify-center shrink-0 text-xs font-bold text-[#9CA3AF] mt-0.5">
                              {i + 1}
                            </div>
                            <p className="text-sm text-[#374151] leading-relaxed">{action}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab: AI工具箱 */}
                    {deepReportTab === 'tools' && (
                      <div className="space-y-2.5">
                        {deepReport.ai_tools.map((tool, i) => {
                          const diff    = DIFFICULTY_MAP[tool.difficulty] ?? DIFFICULTY_MAP.easy
                          const isOpen  = expandedTool === i
                          return (
                            <div
                              key={i}
                              className="border border-black/8 rounded-xl overflow-hidden"
                            >
                              {/* 标题行 */}
                              <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F9FAFB] transition-colors"
                                onClick={() => setExpandedTool(isOpen ? null : i)}
                              >
                                <span className="text-xl leading-none">{tool.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#111118]">{tool.name}</span>
                                    <span
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                      style={{ background: diff.bg, color: diff.color }}
                                    >
                                      {diff.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{tool.tagline}</p>
                                </div>
                                <span className={`text-[#C4C4C4] text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                                  ▾
                                </span>
                              </button>

                              {/* 展开内容 */}
                              {isOpen && (
                                <div className="px-4 pb-4 border-t border-black/6 pt-3 space-y-2">
                                  <p className="text-xs text-[#374151] leading-relaxed">
                                    <span className="font-medium text-[#111118]">场景：</span>{tool.use_case}
                                  </p>
                                  <p className="text-xs text-[#374151] leading-relaxed">
                                    <span className="font-medium text-[#111118]">技巧：</span>{tool.tips}
                                  </p>
                                  <a
                                    href={tool.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#111118] transition-colors underline-offset-2 hover:underline"
                                  >
                                    访问官网 →
                                  </a>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

            {/* 分享图生成 */}
            <div className="rounded-2xl bg-white border border-black/8 p-5">
              <p className="text-sm text-center text-[#374151] mb-1">
                你的替代率是{' '}
                <span className="font-bold" style={{ color: result.color }}>
                  {result.replacement_rate}%
                </span>
                ，你的朋友呢？
              </p>
              <p className="text-xs text-[#9CA3AF] text-center mb-5">
                生成精美分享图，截图发到小红书 @好友来测一测
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const params = new URLSearchParams({
                      rate:  String(result.replacement_rate),
                      label: result.label,
                      color: result.color,
                      job:   jobTitle,
                      ind:   industry,
                      r:     String(result.dimensions.routine.score),
                      s:     String(result.dimensions.social_eq.score),
                      c:     String(result.dimensions.cognitive.score),
                      t:     String(result.dimensions.tech_trend.score),
                      risk1: result.top_risks[0] ? `${result.top_risks[0].task}（${result.top_risks[0].why}）` : '',
                      risk2: result.top_risks[1] ? `${result.top_risks[1].task}（${result.top_risks[1].why}）` : '',
                      moat1: result.moat_skills[0] ?? '',
                      moat2: result.moat_skills[1] ?? '',
                      url:   window.location.origin,
                    })
                    window.open(`/api/share?${params}`, '_blank')
                  }}
                  className="py-3 rounded-xl text-sm font-bold bg-[#111118] text-white hover:bg-[#111118]/90 transition-all active:scale-95"
                >
                  生成分享图 →
                </button>
                <button
                  onClick={() => { setStep('form'); setResult(null); setDeepReport(null) }}
                  className="py-3 rounded-xl text-sm font-medium border border-black/15 text-[#6B7280] hover:border-black/30 hover:text-[#374151] transition-all"
                >
                  重新测评
                </button>
              </div>
            </div>

            <p className="text-[10px] text-[#C4C4C4] text-center leading-relaxed px-4">
              ⚠️ 本测评结果仅供参考，基于公开学术研究模型推算，不代表任何就业建议或岗位价值判断。
            </p>
          </div>
        )}
      </div>

      {/* ══════════════ 支付模态框 ══════════════ */}
      {payModal !== 'closed' && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget && payModal === 'selecting') setPayModal('closed') }}
        >
          <div className="w-full max-w-sm bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl">

            {/* 把手 */}
            <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mb-5" />

            {/* 选择支付方式 */}
            {payModal === 'selecting' && (
              <div>
                <p className="text-base font-bold text-[#111118] mb-1">解锁深度转型报告</p>
                <p className="text-xs text-[#9CA3AF] mb-5">
                  AI冲击时间轴 · 3条转型路径 · 90天行动计划 · AI工具箱（5-8个）
                </p>

                {/* 价格展示 */}
                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="text-3xl font-black text-[#111118]">¥9.9</span>
                  <span className="text-sm text-[#9CA3AF] line-through">¥29.9</span>
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full ml-1">限时</span>
                </div>

                {/* 支付错误提示 */}
                {payError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">支付失败</p>
                    <p className="text-xs text-red-600 mt-1">{payError}</p>
                    <p className="text-xs text-red-500 mt-2">请检查网络或稍后重试</p>
                  </div>
                )}

                <div className="space-y-2.5 mb-4">
                  <button
                    onClick={() => handlePayOrder('mock')}
                    className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#111118] text-white hover:bg-[#111118]/90 transition-all active:scale-95"
                  >
                    立即解锁（演示模式）
                  </button>
                  <button
                    onClick={() => handlePayOrder('wechat')}
                    className="w-full py-3.5 rounded-xl text-sm font-bold border-2 border-[#07C160] text-[#07C160] hover:bg-[#07C160]/5 transition-all active:scale-95"
                  >
                    微信支付
                  </button>
                  <button
                    onClick={() => handlePayOrder('alipay')}
                    className="w-full py-3.5 rounded-xl text-sm font-bold border-2 border-[#1677FF] text-[#1677FF] hover:bg-[#1677FF]/5 transition-all active:scale-95"
                  >
                    支付宝支付
                  </button>
                </div>
                <button
                  onClick={() => setPayModal('closed')}
                  className="w-full text-xs text-[#9CA3AF] hover:text-[#6B7280] py-2 transition-colors"
                >
                  取消
                </button>
              </div>
            )}

            {/* 支付中 */}
            {payModal === 'paying' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-12 h-12 border-2 border-black/10 border-t-[#111118] rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-bold text-[#111118]">等待支付确认…</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    支付完成后将自动生成报告，请勿关闭此页面
                  </p>
                </div>

                {/* 开发调试按钮：仅 PAYMENT_PROVIDER=mock 时显示 */}
                {process.env.NODE_ENV !== 'production' && orderId && (
                  <button
                    onClick={async () => {
                      const r = await fetch(`/api/orders/${orderId}/debug-pay`, { method: 'POST' })
                      if (!r.ok) return
                      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
                      setPayModal('success')
                      setTimeout(() => fetchDeepReport(orderId), 1200)
                    }}
                    className="mt-1 text-xs border border-dashed border-black/20 text-[#9CA3AF] hover:text-[#374151] hover:border-black/40 px-4 py-2 rounded-lg transition-colors"
                  >
                    🔧 模拟付款成功（仅开发调试）
                  </button>
                )}
              </div>
            )}

            {/* 支付成功 */}
            {payModal === 'success' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-2xl">
                  ✓
                </div>
                <p className="text-sm font-bold text-[#111118]">支付成功！</p>
                <p className="text-xs text-[#9CA3AF]">正在为你生成专属报告…</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-black/8 bg-white mt-6 py-5 px-4">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-[#9CA3AF]">
            <Link href="/sample" className="hover:text-[#374151] transition-colors">样本报告</Link>
            <span>·</span>
            <Link href="/pricing" className="hover:text-[#374151] transition-colors">定价说明</Link>
            <span>·</span>
            <Link href="/about" className="hover:text-[#374151] transition-colors">关于我们</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#374151] transition-colors">服务条款</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#374151] transition-colors">隐私政策</Link>
          </div>
          <p className="text-xs text-[#9CA3AF]">© 2025 AI 职业危机指数测评 · 基于 Oxford / Goldman Sachs 研究模型</p>
        </div>
      </footer>

    </main>
  )
}

// ── 通用字段组件 ──────────────────────────────────────────
function Field({
  label, hint, required, children,
}: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-[#374151] mb-1">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
        {hint && <span className="text-[#9CA3AF] text-xs font-normal">· {hint}</span>}
      </label>
      {children}
    </div>
  )
}
