import { NextRequest, NextResponse } from 'next/server'
import { validateFreeLink } from '@/app/lib/free-links'
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
  // 免费链接验证（可选）
  token: z.string().optional(),
})

// ── 返回类型 ─────────────────────────────────────────────
export type AITool = {
  name: string
  emoji: string
  tagline: string
  use_case: string
  difficulty: 'easy' | 'medium' | 'hard'
  url: string
  tips: string
  cost: string
  learning_curve: string
}

export type Pivot = {
  role: string
  match: number
  reason: string
  skills: string[]
  timeline: string
  challenges: string[]
}

export type DeepReportData = {
  situation: string
  timeline: { year1: string; year3: string; year5: string }
  pivots: Pivot[]
  action_plan: string[]
  ai_tools: AITool[]
}

// ── 职业领域分类（用于职业相关性判断）────────────────
type CareerDomain =
  | 'medical'      // 医疗健康
  | 'education'    // 教育培训
  | 'construction'  // 建筑/工程
  | 'legal'        // 法律服务
  | 'finance'      // 金融财务
  | 'technology'   // 互联网/技术
  | 'retail'       // 零售/电商
  | 'consulting'   // 咨询/服务
  | 'manufacturing' // 制造/生产
  | 'creative'     // 设计/创意
  | 'service'      // 服务业
  | 'agriculture'  // 农业/农林
  | 'other'        // 其他

// ── 职业关键词映射到领域 ─────────────────────────────────
const DOMAIN_KEYWORDS: Record<CareerDomain, string[]> = {
  medical: ['医生', '护士', '药师', '医疗', '医院', '诊所', '外科', '内科', '牙科', '儿科', '中医', '康复', '护理', '体检', '健康管理', '医疗器械', '临床'],
  education: ['教师', '老师', '教育', '学校', '培训', '教员', '班主任', '讲师', '课程', '教学', '辅导', '幼儿园', '小学', '中学', '大学', '教育机构'],
  construction: ['建筑', '工程师', '施工', '工地', '土木', '建筑师', '设计师', '装修', '测量', '监理', '材料', '结构', '水电', '暖通', '装修公司'],
  legal: ['律师', '法务', '法律', '法官', '检察官', '法院', '律师事务所', '诉讼', '仲裁', '合同', '知识产权', '合规'],
  finance: ['财务', '会计', '审计', '出纳', '投资', '银行', '证券', '保险', '税务', '金融', '基金经理', '分析师', '风险管理'],
  technology: ['软件', '开发', '程序', '编程', '算法', '数据', 'AI', '互联网', '前端', '后端', '产品', '运营', '测试', '架构', '运维', '全栈', '移动端'],
  retail: ['销售', '零售', '超市', '电商', '导购', '客服', '运营', '门店', '连锁', '百货', '超市', '便利店', '电商运营'],
  consulting: ['咨询', '顾问', '策划', '管理', '战略', '研究', '分析', '顾问', '项目经理', '管理咨询', '战略咨询'],
  manufacturing: ['制造', '生产', '工厂', '流水线', '质量', '质检', '厂长', '车间', '设备', '工艺', '操作工', '技工', '装配'],
  creative: ['设计', '设计', '设计', 'UI', 'UX', '视觉', '品牌', '广告', '摄影', '视频', '动画', '插画', '创意', '设计师', '策划', '美术'],
  service: ['服务员', '酒店', '餐饮', '旅游', '快递', '物流', '家政', '保洁', '保姆', '护工', '美容', '美发', '健身', '教练', '服务', '客户服务'],
  agriculture: ['农业', '农民', '种植', '养殖', '农场', '果园', '渔业', '林业', '农机', '种子', '农药', '农产品', '农村'],
  other: []
}

// ── 根据职业判断领域 ─────────────────────────────────
function detectCareerDomain(jobTitle: string, industry: string): CareerDomain {
  const lowerJob = jobTitle.toLowerCase()
  const lowerInd = industry.toLowerCase()

  // 遍历所有领域，匹配关键词
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [CareerDomain, string[]][]) {
    for (const keyword of keywords) {
      if (lowerJob.includes(keyword) || lowerInd.includes(keyword)) {
        return domain
      }
    }
  }

  return 'other'
}

// ── 领域相关的 AI 工具库 ─────────────────────────────────
const DOMAIN_AI_TOOLS: Record<CareerDomain, AITool[]> = {
  medical: [
    {
      name: '医学影像AI助手',
      emoji: '🏥',
      tagline: '影像诊断增强',
      use_case: '辅助分析X光、CT、MRI等医学影像，提高诊断准确性',
      difficulty: 'medium',
      url: 'https://www.siemens-healthineers.com/medical-imaging-ai',
      tips: '结合临床经验，用AI工具快速定位病灶，但最终诊断仍需专业判断',
      cost: '付费',
      learning_curve: '需要时间'
    },
    {
      name: '临床决策支持系统',
      emoji: '🩺',
      tagline: '诊疗辅助决策',
      use_case: '基于患者症状和病史，提供诊断建议和治疗方案参考',
      difficulty: 'hard',
      url: 'https://www.ibm.com/watson-health',
      tips: '用于辅助判断，不能替代临床经验。定期更新医疗知识库。',
      cost: '订阅制',
      learning_curve: '需要时间'
    },
    {
      name: '医学文献快速检索',
      emoji: '📚',
      tagline: '文献调研助手',
      use_case: '快速检索最新医学文献、临床试验数据，辅助病例研究和学术发表',
      difficulty: 'easy',
      url: 'https://pubmed.ncbi.nlm.nih.gov/',
      tips: '用具体疾病关键词+时间范围检索，结合AI摘要快速筛选相关文献',
      cost: '免费',
      learning_curve: '快速'
    },
    {
      name: '病历自动生成工具',
      emoji: '✍️',
      tagline: '病历记录助手',
      use_case: '根据口述或检查结果，自动生成标准化病历记录',
      difficulty: 'easy',
      url: 'https://www.nuance.com/healthcare',
      tips: '用于提高病历书写效率，但必须由医生审核确认内容准确性',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: '手术模拟规划',
      emoji: '🔬',
      tagline: '手术预览工具',
      use_case: '基于CT/MRI数据进行手术路径规划和预演，提高手术精度',
      difficulty: 'hard',
      url: 'https://www.surgical-theater.com',
      tips: '仅用于术前规划，实际手术仍需根据具体情况灵活调整',
      cost: '付费',
      learning_curve: '需要时间'
    },
  ],
  education: [
    {
      name: '教案智能生成',
      emoji: '📝',
      tagline: '课程设计助手',
      use_case: '根据教学大纲和学生水平，自动生成教案、习题和教学资源',
      difficulty: 'easy',
      url: 'https://education.copilot.com',
      tips: 'AI生成后，需要根据班级实际情况调整，增加个性化教学元素',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: '作业自动批改',
      emoji: '✅',
      tagline: '批改效率工具',
      use_case: '辅助批改选择题、填空题等客观题，标注主观题要点',
      difficulty: 'medium',
      url: 'https://www.khanacademy.org',
      tips: '结合线下教学使用，不要完全依赖AI推荐。关注学生个体差异。',
      cost: '免费',
      learning_curve: '快速'
    },
    {
      name: '家长沟通助手',
      emoji: '💬',
      tagline: '家校沟通工具',
      use_case: '自动生成家长通知、学生表现报告模板，提高沟通效率',
      difficulty: 'easy',
      url: 'https://www.classdojo.com',
      tips: '保持个性化沟通，AI仅提供模板建议，内容需人工审核',
      cost: '免费+付费',
      learning_curve: '快速'
    },
    {
      name: '多媒体课件制作',
      emoji: '🎬',
      tagline: 'PPT/视频生成',
      use_case: '快速生成教学PPT、知识图谱动画、视频讲解片段',
      difficulty: 'medium',
      url: 'https://gamma.app',
      tips: '用于提高课件制作效率，但需保证教学内容的准确性和教育价值',
      cost: '付费',
      learning_curve: '中等'
    },
  ],
  construction: [
    {
      name: 'BIM建模AI助手',
      emoji: '🏗',
      tagline: '建筑信息建模',
      use_case: '基于图纸快速生成3D建筑模型，进行碰撞检测和成本估算',
      difficulty: 'hard',
      url: 'https://www.autodesk.com/bim',
      tips: '前期设计阶段使用，施工前仍需人工复核细节和可行性',
      cost: '付费',
      learning_curve: '需要时间'
    },
    {
      name: '施工安全监控系统',
      emoji: '🛡️',
      tagline: '安全风险预警',
      use_case: '基于摄像头实时监控工地安全，识别违规操作和风险隐患',
      difficulty: 'medium',
      url: 'https://www.procore.com',
      tips: '辅助安全管理，不能替代人工安全巡查。定期测试系统准确性。',
      cost: '付费',
      learning_curve: '中等'
    },
    {
      name: '材料需求预测',
      emoji: '📊',
      tagline: '材料采购优化',
      use_case: '根据施工进度和项目计划，预测材料需求，优化采购成本',
      difficulty: 'easy',
      url: 'https://www.procore.com/materials',
      tips: '结合实际施工情况调整，保留一定的材料富余应对突发情况',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: '工期优化分析',
      emoji: '📅',
      tagline: '进度管理AI',
      use_case: '分析历史项目数据，优化施工计划，提高工期预测准确性',
      difficulty: 'medium',
      url: 'https://www.primavera.com',
      tips: '用于辅助规划，实际施工受天气、材料供应等多因素影响需灵活调整',
      cost: '付费',
      learning_curve: '中等'
    },
  ],
  legal: [
    {
      name: '法律文书AI生成',
      emoji: '⚖️',
      tagline: '文书起草助手',
      use_case: '辅助起草合同、起诉书、辩护词等法律文书，提高效率',
      difficulty: 'medium',
      url: 'https://www.lawgeex.com',
      tips: 'AI生成后必须由执业律师审核修改，确保法律效力和准确性',
      cost: '付费',
      learning_curve: '中等'
    },
    {
      name: '案例检索分析',
      emoji: '🔍',
      tagline: '案例研究工具',
      use_case: '快速检索类似案例和判例，分析胜诉率和关键法律点',
      difficulty: 'easy',
      url: 'https://www.courtlistener.com',
      tips: '用于研究参考，每个案件具体情况不同，不能完全依赖历史案例',
      cost: '免费',
      learning_curve: '快速'
    },
    {
      name: '合规风险扫描',
      emoji: '✓',
      tagline: '合同审查AI',
      use_case: '自动扫描合同条款，识别潜在风险点和不公平条款',
      difficulty: 'medium',
      url: 'https://www.lawgeex.com/compliance',
      tips: '用于初步审查，最终合规判断仍需人工专业审核',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: '庭审提词辅助',
      emoji: '📋',
      tagline: '庭审准备工具',
      use_case: '根据案件材料生成庭审提纲、质询问题列表、证据组织建议',
      difficulty: 'medium',
      url: 'https://www.lawgeex.com/court',
      tips: '用于庭审准备，实际庭审需根据法官反应和对方辩护灵活调整',
      cost: '付费',
      learning_curve: '中等'
    },
  ],
  finance: [
    {
      name: '财务数据分析AI',
      emoji: '📈',
      tagline: '财务洞察助手',
      use_case: '自动分析财务报表，识别异常、预测趋势、生成可视化图表',
      difficulty: 'medium',
      url: 'https://quickbooks.intuit.com/ai',
      tips: '用于提高财务分析效率，但重要财务决策仍需人工判断',
      cost: '付费',
      learning_curve: '中等'
    },
    {
      name: '税务筹划助手',
      emoji: '💰',
      tagline: '税务优化建议',
      use_case: '根据收入结构和税法变化，提供税务筹划建议和风险提示',
      difficulty: 'hard',
      url: 'https://www.turbotax.com',
      tips: '用于初步参考，最终税务筹划需咨询专业税务师',
      cost: '付费',
      learning_curve: '需要时间'
    },
    {
      name: '投资组合分析',
      emoji: '📊',
      tagline: '投资决策支持',
      use_case: '分析投资组合风险和收益，提供资产配置建议',
      difficulty: 'hard',
      url: 'https://www.morningstar.com/ai',
      tips: '用于研究参考，投资有风险，决策需结合个人风险承受能力',
      cost: '付费',
      learning_curve: '需要时间'
    },
  ],
  technology: [
    {
      name: 'GitHub Copilot',
      emoji: '🤖',
      tagline: 'AI编程助手',
      use_case: '自动补全代码、生成代码片段、重构代码、写单元测试',
      difficulty: 'easy',
      url: 'https://github.com/features/copilot',
      tips: '提高编码效率，但要审查生成的代码质量和安全性',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: 'Cursor',
      emoji: '⌨️',
      tagline: 'AI编程IDE',
      use_case: '通过自然语言描述生成完整功能和代码，无需手写',
      difficulty: 'easy',
      url: 'https://cursor.sh',
      tips: '适合快速原型开发，复杂项目仍需系统设计和架构思考',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: 'Replit AI',
      emoji: '🔧',
      tagline: '在线编程环境',
      use_case: 'AI辅助调试、代码解释、项目协作、一键部署',
      difficulty: 'medium',
      url: 'https://replit.com/ai',
      tips: '用于学习和中小型项目，大型项目需要本地IDE',
      cost: '免费+付费',
      learning_curve: '快速'
    },
    {
      name: 'Vercel AI SDK',
      emoji: '▲',
      tagline: 'AI应用开发',
      use_case: '快速开发AI应用，集成AI模型到现有项目中',
      difficulty: 'medium',
      url: 'https://vercel.com/ai',
      tips: '用于快速搭建AI应用原型，生产环境需考虑性能和成本',
      cost: '免费+付费',
      learning_curve: '中等'
    },
  ],
  retail: [
    {
      name: '电商文案AI',
      emoji: '✍️',
      tagline: '商品描述生成',
      use_case: '根据产品特点自动生成吸引人的商品文案、广告语、直播话术',
      difficulty: 'easy',
      url: 'https://www.copy.ai',
      tips: '用于提高文案创作效率，但需人工审核确保符合平台规则和品牌调性',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: '智能客服机器人',
      emoji: '🤖',
      tagline: '自动客服系统',
      use_case: '24小时自动回答常见问题，提高客户响应速度',
      difficulty: 'medium',
      url: 'https://www.intercom.com/ai',
      tips: '用于处理常规咨询，复杂问题仍需人工介入',
      cost: '付费',
      learning_curve: '中等'
    },
    {
      name: '销售话术AI',
      emoji: '💬',
      tagline: '销售沟通助手',
      use_case: '根据客户类型和场景，生成个性化销售话术和跟进策略',
      difficulty: 'easy',
      url: 'https://www.gong.io/ai-sales',
      tips: '用于培训参考，实际沟通仍需根据客户反应灵活调整',
      cost: '付费',
      learning_curve: '快速'
    },
  ],
  consulting: [
    {
      name: '报告生成AI',
      emoji: '📊',
      tagline: '分析报告助手',
      use_case: '自动生成市场分析、行业报告、竞品分析、用户画像报告',
      difficulty: 'medium',
      url: 'https://www.deck.gl',
      tips: '用于提高报告生成效率，数据分析和洞察仍需人工深度思考',
      cost: '付费',
      learning_curve: '中等'
    },
    {
      name: '会议纪要AI',
      emoji: '📝',
      tagline: '会议记录助手',
      use_case: '自动记录会议内容、生成行动项、提取决策点',
      difficulty: 'easy',
      url: 'https://notion.so/ai',
      tips: '用于提高会议记录效率，重要决策仍需会后确认',
      cost: '免费+付费',
      learning_curve: '快速'
    },
    {
      name: '项目管理AI',
      emoji: '📅',
      tagline: '项目规划助手',
      use_case: '自动生成项目计划、分配任务、跟踪进度、预警风险',
      difficulty: 'medium',
      url: 'https://www.monday.com/ai',
      tips: '用于辅助项目管理，实际执行需团队协作和灵活调整',
      cost: '付费',
      learning_curve: '中等'
    },
  ],
  creative: [
    {
      name: 'Midjourney',
      emoji: '🎨',
      tagline: 'AI图像生成',
      use_case: '快速生成设计稿、插画、海报、产品概念图、LOGO草稿',
      difficulty: 'easy',
      url: 'https://midjourney.com',
      tips: '用于创意灵感，实际设计交付需人工精细化调整',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: 'Figma AI',
      emoji: '🎨',
      tagline: '设计协作AI',
      use_case: '自动生成设计变体、配色方案、布局建议、快速原型',
      difficulty: 'easy',
      url: 'https://www.figma.com/ai',
      tips: '用于提高设计效率，最终设计需符合品牌和用户体验要求',
      cost: '免费+付费',
      learning_curve: '快速'
    },
    {
      name: 'Runway ML',
      emoji: '🎬',
      tagline: '视频生成AI',
      use_case: '根据文本生成视频片段、动画效果、转场',
      difficulty: 'medium',
      url: 'https://www.runwayml.com',
      tips: '用于创意灵感和快速制作，高质量视频需专业制作',
      cost: '付费',
      learning_curve: '中等'
    },
  ],
  manufacturing: [
    {
      name: '工业质检AI',
      emoji: '🔬',
      tagline: 'AI视觉质量检测',
      use_case: '基于机器视觉自动识别产品缺陷，替代人工抽检，漏检率降低80%',
      difficulty: 'medium',
      url: 'https://www.landing.ai',
      tips: '先从固定工位的外观检测开始试点，积累数据后逐步扩大覆盖范围',
      cost: '付费',
      learning_curve: '需要时间'
    },
    {
      name: '预测性维护系统',
      emoji: '⚙️',
      tagline: '设备故障预警',
      use_case: '通过传感器数据分析设备运行状态，提前预警故障，减少非计划停机',
      difficulty: 'medium',
      url: 'https://www.uptake.com',
      tips: '从关键设备开始部署，结合历史故障数据训练模型，逐步提升预警准确率',
      cost: '付费',
      learning_curve: '需要时间'
    },
    {
      name: 'AI智能排产',
      emoji: '📅',
      tagline: '生产计划优化',
      use_case: '根据订单、库存、产能自动生成最优生产计划，减少换线损耗',
      difficulty: 'medium',
      url: 'https://www.o9solutions.com',
      tips: '先输入历史排产数据让系统学习规律，再逐步接受AI建议调整计划',
      cost: '付费',
      learning_curve: '中等'
    },
    {
      name: '数字孪生工厂',
      emoji: '🏭',
      tagline: '虚拟工厂仿真',
      use_case: '构建工厂数字模型，模拟生产流程优化方案，降低实际改造风险',
      difficulty: 'hard',
      url: 'https://www.ptc.com/digital-twin',
      tips: '先从单条生产线开始建模，验证仿真结果与实际数据的一致性',
      cost: '付费',
      learning_curve: '需要时间'
    },
  ],
  service: [
    {
      name: '服务流程AI',
      emoji: '🔄',
      tagline: '服务优化助手',
      use_case: '分析服务流程，识别瓶颈，提出优化建议，自动生成SOP',
      difficulty: 'medium',
      url: 'https://www.process.st/ai',
      tips: '用于流程优化参考，实际实施需考虑团队和客户接受度',
      cost: '付费',
      learning_curve: '中等'
    },
    {
      name: '培训内容AI',
      emoji: '📚',
      tagline: '培训材料生成',
      use_case: '自动生成培训课件、考试题、学习指南',
      difficulty: 'easy',
      url: 'https://www.ispring.com/ai',
      tips: '用于提高培训材料制作效率，内容需符合培训目标和学员水平',
      cost: '付费',
      learning_curve: '快速'
    },
  ],
  agriculture: [
    {
      name: '智能农业监测',
      emoji: '🌾',
      tagline: '农田监控AI',
      use_case: '通过卫星图像和传感器数据，监测作物生长、病虫害、土壤湿度',
      difficulty: 'medium',
      url: 'https://www.climate.com/ai',
      tips: '用于辅助农业决策，实际种植仍需人工经验和现场判断',
      cost: '付费',
      learning_curve: '需要时间'
    },
    {
      name: '农业大数据分析',
      emoji: '📊',
      tagline: '农情分析工具',
      use_case: '分析市场价格、产量预测、种植优化建议',
      difficulty: 'medium',
      url: 'https://www.climate.com/ai/agriculture',
      tips: '用于决策参考，实际经营需结合当地气候和市场情况',
      cost: '付费',
      learning_curve: '中等'
    },
  ],
  other: [
    {
      name: 'ChatGPT',
      emoji: '🤖',
      tagline: '通用AI助手',
      use_case: '文档撰写、数据分析、创意生成、问题解答、代码辅助',
      difficulty: 'easy',
      url: 'https://chat.openai.com',
      tips: '根据具体场景选择使用模式，重要决策需人工判断',
      cost: '免费+付费',
      learning_curve: '快速'
    },
    {
      name: 'Claude',
      emoji: '🤖',
      tagline: 'AI思维伙伴',
      use_case: '长文本分析、复杂推理、代码生成、报告撰写、数据分析',
      difficulty: 'easy',
      url: 'https://claude.ai',
      tips: '适合需要深度思考的任务，输出质量高，注意信息准确性',
      cost: '付费',
      learning_curve: '快速'
    },
    {
      name: 'Notion AI',
      emoji: '📝',
      tagline: '知识管理',
      use_case: '文档管理、知识库、笔记整理、项目管理、协作',
      difficulty: 'easy',
      url: 'https://notion.so/ai',
      tips: '用于提高个人和团队知识管理效率',
      cost: '免费+付费',
      learning_curve: '快速'
    },
  ],
}

// ── 根据领域获取相关AI工具 ─────────────────────────────────
function getDomainAITools(domain: CareerDomain): AITool[] {
  const tools = DOMAIN_AI_TOOLS[domain] || DOMAIN_AI_TOOLS.other

  // 根据用户的硬技能，动态添加通用工具
  // 这里可以进一步优化，根据技能关键词匹配工具
  return tools.slice(0, 8)
}

// ── Mock 数据（根据领域动态生成）────────────────────────────
function getMock(jobTitle: string, label: string, domain: CareerDomain): DeepReportData {
  const domainTools = getDomainAITools(domain)

  // 根据领域生成相关的转型方向
  const domainPivots: Pivot[] = (() => {
    switch (domain) {
      case 'medical':
        return [
          {
            role: '医学AI应用专家',
            match: 85,
            reason: '医学背景+AI工具能力=黄金组合。AI在医学影像、病理诊断、药物研发等领域需求增长60%，且薪资溢价明显。',
            skills: ['医学影像分析', 'AI诊断工具使用', '临床决策支持', '医疗数据管理'],
            timeline: '6个月',
            challenges: ['需要学习AI技术', '医疗责任重大', '新技术应用需谨慎验证'],
          },
          {
            role: '远程医疗运营',
            match: 78,
            reason: '远程医疗是未来趋势，具备医疗运营经验可快速切入。远程医疗市场规模年增长25%，政策支持力度大。',
            skills: ['远程诊疗流程', '患者管理', '数字医疗工具', '跨部门协作'],
            timeline: '3个月',
            challenges: ['需熟悉数字医疗平台', '患者信任度建立', '技术稳定性要求高'],
          },
          {
            role: '医疗数据分析专家',
            match: 72,
            reason: '医疗大数据和精准医疗是发展方向。数据分析师+医疗知识=稀缺复合人才。需求增长40%。',
            skills: ['医疗数据清洗', '统计分析', '数据可视化', '隐私保护'],
            timeline: '9个月',
            challenges: ['需要补充统计学知识', '医疗数据敏感性高', '需要数据科学技能'],
          },
        ]
      case 'education':
        return [
          {
            role: '在线教育产品经理',
            match: 88,
            reason: '教育背景+产品思维=在线教育核心能力。在线教育持续增长，对懂教育的产品经理需求旺盛。',
            skills: ['教育产品设计', '在线教学平台', '用户体验', '教育技术'],
            timeline: '6个月',
            challenges: ['需了解不同年龄段学习特点', '教育效果量化难', '竞争激烈'],
          },
          {
            role: '教育科技专家',
            match: 80,
            reason: 'AI+教育是未来。教育科技应用需求增长70%，薪资比传统教师高30%。',
            skills: ['教育AI工具开发', '教学设计', '儿童心理学', '产品运营'],
            timeline: '9个月',
            challenges: ['需要技术转型', '学习曲线陡峭', '教育效果验证复杂'],
          },
          {
            role: '企业培训顾问',
            match: 75,
            reason: '企业培训需求持续增长。具备教学经验+企业服务能力=稳定高薪职业。',
            skills: ['课程设计', '企业培训运营', '需求分析', '客户管理'],
            timeline: '6个月',
            challenges: ['需要了解企业运营', 'B2B销售能力', '培训效果评估'],
          },
        ]
      case 'construction':
        return [
          {
            role: '智慧建筑项目经理',
            match: 82,
            reason: '智慧建筑是趋势。具备现场经验+BIM技术=稀缺人才。需求增长45%。',
            skills: ['BIM建模', '项目数字化管理', '智慧工地系统', '成本控制'],
            timeline: '6个月',
            challenges: ['需要学习BIM技术', '现场经验仍重要', '新技术推广有阻力'],
          },
          {
            role: '绿色建筑专家',
            match: 76,
            reason: '绿色建筑是政策方向。具备建筑经验+节能技术=高薪且稳定。',
            skills: ['节能技术', '环保材料', '绿色建筑认证', '可持续设计'],
            timeline: '9个月',
            challenges: ['需要补充环保知识', '成本控制难度大', '政策变化快'],
          },
          {
            role: '建筑安全工程师',
            match: 70,
            reason: '安全是工地生命线。AI安全监控+人工安全=黄金组合。安全工程师需求稳定。',
            skills: ['安全管理', 'AI监控系统', '风险识别', '应急处理'],
            timeline: '6个月',
            challenges: ['责任重大', '需要现场经验', '新技术验证周期长'],
          },
        ]
      case 'legal':
        return [
          {
            role: '法律科技产品经理',
            match: 85,
            reason: '法律+AI+产品=黄金三角。法律科技是投资热点，复合人才极度稀缺。',
            skills: ['法律知识', '产品思维', 'AI技术理解', '法律科技应用'],
            timeline: '9个月',
            challenges: ['需要跨领域学习', '学习曲线陡峭', '市场需求变化快'],
          },
          {
            role: '企业合规顾问',
            match: 78,
            reason: '合规需求持续增长。具备法律+企业服务=稳定高薪职业。',
            skills: ['合规体系设计', '风险管理', '合同审查', '政策解读'],
            timeline: '6个月',
            challenges: ['政策变化快', '责任重大', '跨部门协调复杂'],
          },
          {
            role: '知识产权运营',
            match: 72,
            reason: 'IP运营是高价值工作。法律+运营=稀缺复合能力。',
            skills: ['IP管理', '版权保护', '品牌建设', '法务流程'],
            timeline: '6个月',
            challenges: ['需要商业思维', 'IP价值评估复杂', '市场竞争激烈'],
          },
        ]
      case 'finance':
        return [
          {
            role: '金融科技分析师',
            match: 84,
            reason: 'FinTech是投资热点。金融+技术=高薪方向。需求增长50%。',
            skills: ['金融分析', '编程', '数据分析', '产品理解'],
            timeline: '12个月',
            challenges: ['需要学习技术', '跨领域知识要求高', '竞争激烈'],
          },
          {
            role: '企业财务顾问',
            match: 76,
            reason: '企业财务咨询需求稳定。具备财务+咨询能力=高薪职业。',
            skills: ['财务分析', '税务筹划', '成本控制', '战略规划'],
            timeline: '6个月',
            challenges: ['需要企业经验', '责任重大', '销售能力要求'],
          },
          {
            role: '数据分析总监',
            match: 70,
            reason: '数据驱动决策是趋势。财务+数据分析=高价值组合。',
            skills: ['高级分析', '数据可视化', '商业洞察', '团队管理'],
            timeline: '12个月',
            challenges: ['需要高级分析能力', '经验要求高', '向上汇报压力大'],
          },
        ]
      case 'technology':
        return [
          {
            role: 'AI应用架构师',
            match: 88,
            reason: 'AI应用架构是核心。开发+AI知识=稀缺能力。需求增长60%。',
            skills: ['AI模型设计', '系统架构', '云服务', '性能优化'],
            timeline: '12个月',
            challenges: ['技术更新快', '需要深度学习', '复杂系统设计'],
          },
          {
            role: 'AI产品经理',
            match: 80,
            reason: 'AI产品需求旺盛。开发+产品+AI=黄金组合。薪资溢价30%。',
            skills: ['AI产品规划', '技术理解', '用户研究', '市场分析'],
            timeline: '9个月',
            challenges: ['需要技术理解', '产品定位难', '市场竞争激烈'],
          },
          {
            role: 'AI训练师',
            match: 72,
            reason: 'AI训练师是新职业。具备数据+AI模型能力=入场券。需求快速增长。',
            skills: ['数据标注', '模型训练', '评估优化', '领域知识'],
            timeline: '6个月',
            challenges: ['需要学习AI原理', '工作内容重复', '薪资增长空间有限'],
          },
        ]
      case 'retail':
        return [
          {
            role: '电商运营专家',
            match: 85,
            reason: '电商+AI运营是趋势。具备零售+数据+AI=高薪方向。',
            skills: ['电商运营', '数据分析', 'AI工具使用', '用户运营'],
            timeline: '6个月',
            challenges: ['结果导向压力大', '需要数据敏感度', '快速变化'],
          },
          {
            role: '数字营销专家',
            match: 78,
            reason: '数字营销需求持续增长。具备营销+AI工具=竞争优势。',
            skills: ['内容创作', 'AI文案', 'SEO', '数据分析'],
            timeline: '6个月',
            challenges: ['效果量化难', '创意不可替代', '平台算法变化'],
          },
          {
            role: '供应链优化师',
            match: 70,
            reason: '供应链+AI=效率提升方向。数据驱动供应链是趋势。',
            skills: ['供应链管理', '数据分析', '库存优化', '风险预测'],
            timeline: '9个月',
            challenges: ['需要跨部门协调', '数据准确性要求高', '影响重大'],
          },
        ]
      case 'consulting':
        return [
          {
            role: '数字化转型顾问',
            match: 87,
            reason: '数字化转型是各行业需求。咨询+技术=稀缺能力。',
            skills: ['数字化转型', '技术理解', '项目管理', '变革管理'],
            timeline: '9个月',
            challenges: ['项目周期长', '变革阻力大', '跨领域知识要求'],
          },
          {
            role: '数据分析顾问',
            match: 80,
            reason: '数据驱动决策是趋势。咨询+数据分析=高价值组合。',
            skills: ['数据分析', '业务洞察', '报告撰写', '客户沟通'],
            timeline: '9个月',
            challenges: ['需要深度分析能力', '结果量化难', '客户期望管理'],
          },
          {
            role: '行业研究分析师',
            match: 75,
            reason: '行业研究需求稳定。具备研究+AI工具=高效率分析师。',
            skills: ['行业研究', '数据收集', 'AI工具使用', '报告撰写'],
            timeline: '6个月',
            challenges: ['信息获取难度大', '需要领域知识', '研究成果验证复杂'],
          },
        ]
      case 'manufacturing':
        return [
          {
            role: '智能制造工程师',
            match: 83,
            reason: '智能制造是趋势。制造+技术+AI=高薪方向。',
            skills: ['工业自动化', '机器人', '数据分析', '系统维护'],
            timeline: '9个月',
            challenges: ['需要技术转型', '现场环境复杂', '设备成本高'],
          },
          {
            role: '质量管理体系负责人',
            match: 76,
            reason: '质量是制造生命线。具备制造+质量+AI=高价值。',
            skills: ['质量管理', 'AI质量检测', '数据分析', '持续改进'],
            timeline: '6个月',
            challenges: ['责任重大', '细节要求高', '跨部门协调'],
          },
          {
            role: '供应链数字化专家',
            match: 70,
            reason: '数字化供应链是趋势。制造+供应链+数据=高薪方向。',
            skills: ['供应链管理', '数据分析', '数字化工具', '成本控制'],
            timeline: '9个月',
            challenges: ['跨企业协调复杂', '数据准确性要求高', '影响重大'],
          },
        ]
      case 'creative':
        return [
          {
            role: 'AIGC设计师',
            match: 86,
            reason: 'AIGC是设计革命。设计+AI工具=未来核心竞争力。',
            skills: ['设计软件', 'AIGC工具', '创意思维', '品牌理解'],
            timeline: '6个月',
            challenges: ['需要快速学习新工具', '创意难量化', '版权问题复杂'],
          },
          {
            role: '视觉设计总监',
            match: 78,
            reason: '设计总监+AI工具=效率提升。AI可处理重复工作，聚焦创意。',
            skills: ['高级设计', '团队管理', '品牌策略', 'AI工具应用'],
            timeline: '12个月',
            challenges: ['需要丰富经验', '创意压力', '团队管理复杂'],
          },
          {
            role: '用户体验设计师',
            match: 74,
            reason: 'UX是产品关键。设计+UX+AI=高价值组合。',
            skills: ['UX设计', '用户研究', '数据分析', 'AI原型'],
            timeline: '9个月',
            challenges: ['需要用户研究', '平衡创意和可用性', '跨团队协作'],
          },
        ]
      case 'service':
        return [
          {
            role: '服务运营优化专家',
            match: 82,
            reason: '服务+数据+AI=效率提升。服务业数字化是趋势。',
            skills: ['服务运营', '数据分析', 'AI工具', '流程优化'],
            timeline: '6个月',
            challenges: ['结果量化难', '服务质量要求高', '标准化难度大'],
          },
          {
            role: '客户体验经理',
            match: 76,
            reason: '客户体验是竞争关键。服务+数据+设计=高价值。',
            skills: ['客户洞察', '服务设计', '数据分析', '团队协作'],
            timeline: '6个月',
            challenges: ['客户期望管理', '跨部门协调', '效果量化复杂'],
          },
          {
            role: '培训师（服务业）',
            match: 70,
            reason: '服务标准化培训需求持续增长。具备服务+培训=高薪方向。',
            skills: ['培训课程设计', 'SOP制定', '培训执行', '效果评估'],
            timeline: '6个月',
            challenges: ['需要提炼经验', '培训效果量化难', '持续迭代'],
          },
        ]
      case 'agriculture':
        return [
          {
            role: '智慧农业技术员',
            match: 80,
            reason: '智慧农业是政策方向。农业+技术+数据=稀缺人才。',
            skills: ['农业技术', '传感器使用', '数据分析', '自动化系统'],
            timeline: '9个月',
            challenges: ['需要技术学习', '工作环境艰苦', '新技术推广慢'],
          },
          {
            role: '农业电商运营',
            match: 75,
            reason: '农产品电商是趋势。农业+电商=高附加值方向。',
            skills: ['电商平台运营', '农产品营销', '供应链管理', '客户服务'],
            timeline: '6个月',
            challenges: ['需要学习电商运营', '物流协调复杂', '品质控制难度大'],
          },
          {
            role: '农业数据分析师',
            match: 68,
            reason: '农业大数据是趋势。农业+数据分析=新方向。',
            skills: ['农业数据', '统计分析', '预测分析', '报告撰写'],
            timeline: '9个月',
            challenges: ['需要补充统计学', '数据获取难度大', '预测准确性难保证'],
          },
        ]
      default: // 'other'
        return [
          {
            role: 'AI应用产品经理',
            match: 85,
            reason: 'AI产品需求旺盛。各行业+AI+产品=通用转型方向。',
            skills: ['AI应用理解', '产品思维', '项目管理', '用户研究'],
            timeline: '9个月',
            challenges: ['需要快速学习各行业', '技术理解要求高', '竞争激烈'],
          },
          {
            role: '企业数字化转型顾问',
            match: 78,
            reason: '数字化转型是各行业需求。咨询+技术=稀缺能力。',
            skills: ['数字化转型', '技术理解', '项目管理', '变革管理'],
            timeline: '9个月',
            challenges: ['项目周期长', '变革阻力大', '跨领域知识要求'],
          },
          {
            role: 'AI培训师（通用）',
            match: 70,
            reason: 'AI培训需求持续增长。领域知识+AI工具=高价值组合。',
            skills: ['领域知识', 'AI工具使用', '培训课程设计', '效果评估'],
            timeline: '6个月',
            challenges: ['需要持续学习新技术', '培训效果量化难', '跨领域沟通'],
          },
        ]
    }
  })()

  // 根据领域生成相关的时间和行动计划
  const domainTimeline = (() => {
    switch (domain) {
      case 'medical':
        return {
          year1: 'AI辅助诊断工具快速普及，远程医疗渗透率提升至35%，基层医疗资源分配更高效。医学教育加速向AI+实践结合转型，传统纯手工诊断需求减少40%。',
          year3: '个性化治疗方案成为标配，AI手术机器人开始辅助复杂手术。医疗数据平台打通，跨院诊疗效率提升50%。医疗工作者需要掌握AI工具使用，"人类医生+AI"协作模式成为主流。',
          year5: '预防性医疗成为主流，AI健康监测实现早发现早干预。医生角色向"健康管理者"转变，治疗占比下降50%。医疗行业进入"精准医疗+健康管理"双轮驱动时代，技术型医疗人才需求大幅增长。',
        }
      case 'education':
        return {
          year1: 'AI助教系统在K12快速普及，个性化学习需求增长60%。传统"一刀切"教学方式被AI个性化学习替代30%。教师角色向"学习引导者"转变，重复性教学工作被AI接管。',
          year3: '在线教育深度融合AI，虚拟教师+真人教师成为标配。学习效果数据化，教育公平性提升。需要教师掌握AI工具，从"知识传授者"升级为"学习设计师"。',
          year5: '教师传统角色基本消失，转型为"AI课程设计师"和"学习成长顾问"。纯知识传授岗位需求锐减80%。具备AI工具应用能力的教育人才薪资溢价明显，教育行业进入"AI+人"深度融合新阶段。',
        }
      case 'construction':
        return {
          year1: '建筑机器人和BIM技术加速普及，施工效率提升40%。安全监控系统在工地广泛应用，安全事故率下降60%。传统建筑工人需要学习基础数字技能。',
          year3: '装配式建筑成为主流，现场施工需求减少50%。建筑行业进入"工厂化建造+现场组装"新模式，对工人技能要求降低但对设备操作要求提高。',
          year5: '现场施工人员需求减少70%，主要岗位是"建筑机器人操作员"和"现场监督员"。建筑设计师和BIM工程师需求增长80%。传统"体力型"建筑岗位基本消失，转型为"技术型"管理岗位。',
        }
      case 'legal':
        return {
          year1: 'AI法律助手广泛使用，文书起草效率提升80%。案例检索和分析时间从小时级降至分钟级。律师可以更专注于复杂案件和高端法律问题。',
          year3: 'AI辅助法庭辩论成为标配，胜诉率数据化。法律科技公司推出"AI+人工"混合法律服务，成本低50%。需要律师掌握AI工具使用，建立"AI工具+专业判断"工作模式。',
          year5: '传统文书工作需求减少90%，律师转型为"AI法律顾问"和"复杂案件策略家"。AI可处理90%的常规案件，人类律师聚焦10%的复杂战略案件。法律服务价格体系重构，按价值收费成为趋势。',
        }
      case 'finance':
        return {
          year1: 'AI量化分析和自动报表工具快速普及，财务人员重复性录入工作减少60%。监管科技（RegTech）兴起，合规审查自动化率提升40%。财务岗位向"数据解读+决策支持"转型。',
          year3: 'AI风控模型替代传统人工审核，银行贷款审批时间从天级降至秒级。RPA+AI组合覆盖80%的标准财务流程。财务BP（业务伙伴）需求大幅增长，纯核算岗位持续萎缩。',
          year5: '初级财务岗位需求减少75%，CFO角色向"AI财务策略官"演进。FinTech平台提供"财务即服务"，中小企业外包财务成主流。具备数据分析+AI工具+商业洞察的复合型财务人才薪资溢价超50%。',
        }
      case 'technology':
        return {
          year1: 'AI编程助手（Copilot/Cursor）渗透率超60%，初级开发效率提升40%。低代码平台侵蚀部分CRUD开发需求，但AI应用开发岗位爆发式增长。技术人员需要从"写代码"升级为"设计AI系统"。',
          year3: 'AI可自主完成中等复杂度的功能开发，代码Review和测试高度自动化。全栈AI应用工程师成为核心岗位，薪资溢价30%+。纯前端/纯后端岗位边界模糊，系统设计和架构能力更加关键。',
          year5: '大部分标准化开发工作由AI代理完成，人类工程师聚焦架构设计、AI系统治理和创新性问题。软件工程师数量减少但人均产出提升5倍，顶级工程师价值持续提升，初级岗位入场门槛大幅提高。',
        }
      case 'retail':
        return {
          year1: 'AI个性化推荐和智能客服普及，电商转化率提升25%。直播电商与AI内容生成结合，运营效率大幅提高。传统门店导购需求下降，线上运营和数据分析岗位需求增长50%。',
          year3: '无人零售和AI选品系统成熟，仓储物流自动化率超70%。消费者画像精准度提升，千人千面营销成为标配。零售运营从"经验驱动"全面转向"数据驱动"，不具备数据能力的岗位将被淘汰。',
          year5: '传统零售门店减少40%，但体验型实体零售逆势增长。AI商品规划、自动补货、智能定价全面普及。零售从业者主要聚焦品牌体验设计、供应链策略和高价值客户关系，基础运营岗位需求减少65%。',
        }
      case 'consulting':
        return {
          year1: 'AI分析报告工具大幅压缩数据收集和初稿撰写时间，初级咨询顾问效率提升50%。客户开始要求"AI增强型"咨询服务，传统纯人工报告竞争力下降。知识管理和洞察提炼能力愈发关键。',
          year3: '标准化行业报告和竞品分析基本由AI完成，咨询公司顾问人数减少但项目质量提升。高价值咨询转向"战略共创+变革落地"，客户关系管理和跨组织影响力成为核心竞争壁垒。',
          year5: 'AI咨询平台提供中低端策略建议，人类顾问聚焦复杂变革管理和高端战略。中小型咨询公司面临生存压力，具备深厚行业Know-how+AI工具应用能力的顾问价值大幅提升，行业两极分化加剧。',
        }
      case 'manufacturing':
        return {
          year1: '工业机器人+AI视觉检测系统在流水线广泛部署，质检效率提升60%、漏检率下降80%。预测性维护减少设备宕机30%。操作工转型为"设备监控员"，技术技能要求提高。',
          year3: '柔性制造和智能排产系统成熟，定制化生产成本接近批量生产。数字孪生工厂普及，设计到量产周期压缩50%。传统流水线操作岗减少40%，工业数据工程师和自动化维护工程师需求翻倍。',
          year5: '高度自动化工厂实现"熄灯生产"，人工干预仅限于异常处理和创新研发。制造岗位从体力密集转向技术密集，人均产值提升3倍。具备AI+制造知识的复合人才极度稀缺，薪资溢价显著。',
        }
      case 'creative':
        return {
          year1: 'AIGC工具（Midjourney/Sora/Runway）进入创意工作流，设计初稿和视频素材生产效率提升5倍。客户要求缩短交付周期，纯手工设计报价优势下降。掌握AI工具成为设计师基础门槛。',
          year3: 'AI生成内容与人工创意深度融合，"AI+人"协作成为行业标准。纯执行型设计岗位需求减少50%，创意总监和品牌策略师价值大幅提升。版权和原创性成为核心竞争差异点。',
          year5: '初级设计外包市场萎缩70%，但顶级创意工作室产值翻倍。具备品牌战略思维+AI工具应用+跨媒介创作能力的设计师成为稀缺人才。AI负责执行，人类负责方向、情感和文化洞察。',
        }
      case 'service':
        return {
          year1: 'AI客服和语音机器人处理60%以上的标准咨询，人工客服转向复杂投诉处理。餐饮、酒店等行业引入AI点单和服务机器人，前台岗位需求下降20%。服务从业者需要学习AI工具操作。',
          year3: '服务业全面数字化，客户体验管理平台整合AI分析，服务质量实时监控。标准化服务流程自动化率超50%，人工服务聚焦高价值客户和复杂场景。情感陪伴和个性化服务溢价显著提升。',
          year5: '基础服务岗位（收银、前台、标准客服）需求减少60%，高端服务和体验设计岗位逆势增长。服务业分化为"低价自动化"和"高端人工"两极，从业者需要向体验设计师或服务运营专家转型。',
        }
      case 'agriculture':
        return {
          year1: '智慧农业传感器和无人机植保快速普及，农药化肥使用效率提升40%、成本降低25%。AI病虫害识别工具进入县域农业推广，产量预测准确率大幅提升。农业从业者需要学习数字化工具。',
          year3: '无人农机和精准灌溉系统覆盖规模农业，劳动力需求减少35%。农业大数据平台打通产销链路，订单农业和溯源农业快速发展。农村电商和农业数字化运营岗位需求增长，传统体力农业从业者面临转型压力。',
          year5: '规模化农场基本实现无人化作业，传统农业劳动力需求减少50%。农业价值链向品牌、加工、体验延伸，农业从业者转型为"乡村产业运营者"。具备农业技术+数字化运营能力的复合人才成为乡村振兴核心力量。',
        }
      default: // 'other'
        return {
          year1: 'AI工具渗透到各行业日常工作，平均效率提升30%。数据驱动决策成为标准，决策时间缩短50%。各岗位都需要学习AI工具使用，"人+AI"协作成为基本技能。',
          year3: '跨行业AI平台整合，企业级AI解决方案普及。数据分析师和AI应用工程师需求增长80%。需要根据行业特性定制AI应用，避免"一刀切"的AI工具使用。',
          year5: 'AI成为基础生产力工具，各行业进入"AI原生化"新时代。纯重复性岗位需求减少70%，人类聚焦创新、战略和复杂决策。需要持续学习新技术，保持"AI+人类"的竞争优势。',
        }
    }
  })()

  const domainActionPlan = (() => {
    switch (domain) {
      case 'medical':
        return [
          '第1-2周：学习医学影像AI基础，熟悉常用诊断工具，完成3个案例练习',
          '第3-4周：选择一个AI工具深度使用，在非关键环节辅助工作，积累实战经验',
          '第1个月：系统学习临床决策支持系统，参加线上培训课程，输出学习笔记',
          '第2个月：在导师指导下，用AI工具完成1个完整病例分析，验证效果',
          '第3个月：探索"AI+医疗"的跨领域应用（如医学影像AI+临床），建立个人品牌',
        ]
      case 'education':
        return [
          '第1-2周：学习AI教案生成工具，尝试生成3个课程大纲，对比人工优化',
          '第3-4周：在教学中引入AI助教功能，收集学生反馈，调整使用策略',
          '第1个月：学习AI个性化学习系统，分析班级学情数据，生成个性化教学方案',
          '第2个月：设计1门"AI+教学"的创新课程，在教研组分享经验',
          '第3个月：以"教育科技专家"定位，在小红书/公众号发布5篇AI教育内容',
        ]
      case 'finance':
        return [
          '第1-2周：学习AI财务分析工具（如QuickBooks AI/万得），完成1份自动化财务报表',
          '第3-4周：用RPA工具（如UiPath）自动化1个重复性财务流程，记录节省的时间',
          '第1个月：系统学习Power BI或Tableau，完成1个可视化财务仪表盘',
          '第2个月：补充Python基础数据分析能力，用pandas处理1个真实财务数据集',
          '第3个月：考取CFA或数据分析相关认证，强化"财务+数据"复合能力背书',
          '第4-6个月：以"AI财务分析师"定位输出内容，积累个人品牌，探索财务BP转型机会',
        ]
      case 'technology':
        return [
          '第1周：立即安装Cursor/GitHub Copilot，在真实项目中使用满1周，感受能力边界',
          '第2-3周：用AI完成1个完整功能模块（从需求到测试），对比纯手写效率差异',
          '第1个月：学习Prompt Engineering和AI系统设计基础，输出1篇技术博客',
          '第2个月：搭建1个AI应用原型（如RAG问答/Agent工具），部署到线上可访问',
          '第3个月：深入学习LangChain/LlamaIndex或云AI服务（AWS/Azure AI），完成1个完整项目',
          '第4-6个月：以"AI应用工程师"定位投递岗位或对外接单，验证市场价值',
        ]
      case 'retail':
        return [
          '第1-2周：学习AI文案工具（Copy.ai/通义万相），批量生成商品描述，对比人工效率',
          '第3-4周：搭建基础数据看板，用AI分析销售数据，找出1个可优化的运营节点',
          '第1个月：系统学习电商数据分析（生意参谋/达摩盘），完成1份竞品分析报告',
          '第2个月：学习直播电商工具和AI选品方法，策划并执行1次直播活动',
          '第3个月：考取电商运营相关认证（天猫/京东认证），强化平台专业能力',
          '第4-6个月：向数据运营或供应链方向转型，争取跨部门项目机会积累经验',
        ]
      case 'consulting':
        return [
          '第1-2周：用AI工具（Perplexity/ChatGPT）重构1份行业报告的研究流程，记录提效点',
          '第3-4周：学习Notion AI或飞书AI，建立个人知识库，沉淀行业洞察',
          '第1个月：掌握1个数据可视化工具（Tableau/PowerPoint AI），提升报告视觉表达',
          '第2个月：主导1个"AI+咨询"的小型项目，验证AI工具在客户交付中的价值',
          '第3个月：深耕1-2个垂直行业，建立不可复制的行业知识壁垒',
          '第4-6个月：以"数字化转型顾问"定位对外输出，发展个人咨询品牌',
        ]
      case 'manufacturing':
        return [
          '第1-2周：学习工业物联网基础和常见传感器，了解智能工厂架构，完成在线课程',
          '第3-4周：研究1个AI质检或预测性维护案例，分析在本工厂的适用性',
          '第1个月：学习MES（制造执行系统）基础操作，参与数字化改造项目',
          '第2个月：考取工业互联网或智能制造相关证书，增强转型背书',
          '第3个月：主导推动1个生产环节的自动化改造试点，输出量化收益报告',
          '第4-6个月：向智能制造工程师或质量管理体系方向转型，争取内部晋升或跳槽机会',
        ]
      case 'creative':
        return [
          '第1周：注册Midjourney和即梦AI，用自己的真实项目测试AIGC出图能力和边界',
          '第2-3周：学习AI提示词工程（Prompt设计），完成10个高质量商业级设计案例',
          '第1个月：掌握1个视频AI工具（Runway/Pika），完成1个AI+人工混剪的成片',
          '第2个月：重构1个完整品牌视觉项目（VI/海报/动效），全程融入AI工具',
          '第3个月：在Behance/小红书发布"AI+设计"作品集，建立AIGC设计师个人品牌',
          '第4-6个月：向创意总监或品牌策略转型，用AI提高执行效率，聚焦策略价值',
        ]
      case 'service':
        return [
          '第1-2周：梳理当前服务流程，识别3个可被AI工具替代的重复性环节',
          '第3-4周：学习AI客服工具（如Intercom AI/智能回复），搭建1个FAQ自动回复流程',
          '第1个月：系统学习客户体验设计方法（CX设计），完成1份服务旅程地图',
          '第2个月：参与或主导1个服务流程优化项目，用数据验证改善效果',
          '第3个月：学习NPS/CSAT等客户满意度分析方法，建立数据化服务评估体系',
          '第4-6个月：向服务运营专家或客户体验经理方向发展，积累跨部门协作经验',
        ]
      case 'agriculture':
        return [
          '第1-2周：下载农业AI应用（农管家/大丰收），学习病虫害识别和生长监测功能',
          '第3-4周：了解无人机植保操作，考取无人机驾驶证（CAAC认证）',
          '第1个月：学习农业电商基础（拼多多农货/抖音兴农），开设1个农产品直播账号',
          '第2个月：学习农业数据分析和气象预报工具，建立种植决策数据化流程',
          '第3个月：参加县级或省级智慧农业培训项目，争取成为村级数字农业推广员',
          '第4-6个月：向农业电商运营或智慧农业技术员方向转型，探索农业品牌化机会',
        ]
      case 'legal':
        return [
          '第1-2周：学习AI法律工具（无讼/法狗狗/ChatLaw），用真实案件测试文书生成能力',
          '第3-4周：建立AI辅助的案例检索流程，对比传统检索效率，输出工作流文档',
          '第1个月：深入1个细分法律领域（如知识产权/合规），建立不可替代的专业壁垒',
          '第2个月：学习合规科技基础知识，考取法律合规相关认证',
          '第3个月：参与1个法律科技产品的用户调研或顾问项目，积累跨界经验',
          '第4-6个月：以"法律科技"方向对外输出内容，建立复合型法律人才个人品牌',
        ]
      default:
        return [
          '前2周：用 Cursor/Claude 完成1个完整自动化工作流，验证AI工具边界',
          '第3-4周：梳理哪些日常任务可被AI代劳，重新设计个人工作方式',
          '第2个月：系统学习1门核心新技能（推荐：数据分析或AI产品设计），输出作品',
          '第3个月：以"AI+行业专家"定位在小红书/公众号发布5篇内容，建立个人品牌',
        ]
    }
  })()

  return {
    situation: `${jobTitle}的核心工作具有${domain === 'medical' ? '高专业性和责任感' : domain === 'education' ? '知识传播和价值创造' : '重要性和专业价值'}，AI工具正在深刻改变该行业的工作方式。根据相关行业研究报告，${jobTitle}在未来3年内面临显著的技术变革。${domain === 'medical' ? 'AI在医学影像、病理诊断、药物研发等领域快速发展，但在手术操作、临床判断等核心环节仍需要人类专业经验。建议学习AI辅助工具，提升工作效率，同时强化不可替代的临床技能。' : domain === 'education' ? 'AI在教案生成、作业批改、个性化学习等方面已展现出显著效果，但在情感交流、价值引导、创新教育等方面仍需人类教师。建议将AI作为教学助手，更多时间关注学生全面发展和创新能力培养。' : 'AI可以自动化大量重复性工作，但核心价值创造、复杂决策、人际协调等能力仍需人类。建议积极学习AI工具，同时强化那些AI难以替代的核心竞争力。'}`,
    timeline: domainTimeline,
    pivots: domainPivots,
    action_plan: domainActionPlan,
    ai_tools: domainTools,
  }
}

// ── DeepSeek 调用 ─────────────────────────────────────────
async function callDeepSeek(
  input: z.infer<typeof Schema>,
): Promise<DeepReportData> {
  const { jobTitle, industry, yearsOfExperience, tasks, skills, replacement_rate, label, dimensions } = input

  // 检测职业领域
  const domain = detectCareerDomain(jobTitle, industry)

  const prompt = `你是一名资深的职业发展顾问，拥有10年+的AI行业咨询经验，特别擅长${domain === 'medical' ? '医疗健康' : domain === 'education' ? '教育培训' : '职业发展'}领域。请为以下用户生成一份专业、深入、可执行的深度转型报告。

## 用户信息
- 岗位：${jobTitle}（${industry}行业）
- 工作年限：${yearsOfExperience}年
- 核心任务：${tasks.slice(0, 3).join('、')}
- 硬技能：${skills.hard.slice(0, 4).join('、') || '未填写'}
- 软技能：${skills.soft.slice(0, 4).join('、') || '未填写'}
- 职业领域：${domain === 'medical' ? '医疗健康' : domain === 'education' ? '教育培训' : '职业发展'}

## 风险评估
- AI替代率：${replacement_rate}%（${label}）
- 重复性任务：${dimensions.routine.score}/100（${dimensions.routine.reason}）
- 社交情商：${dimensions.social_eq.score}/100（${dimensions.social_eq.reason}）
- 认知复杂度：${dimensions.cognitive.score}/100（${dimensions.cognitive.reason}）
- AI技术覆盖：${dimensions.tech_trend.score}/100（${dimensions.tech_trend.reason}）

## 报告要求

### 1. 处境诊断（200-300字）
不要简单描述替代率，要深入分析：
- 当前岗位的核心价值和风险点
- AI对该岗位的具体冲击机制
- 用户的技能优势和不足
- 竞争环境的变化趋势
- **特别关注该职业领域的具体变化趋势**

### 2. 时间线分析
针对1年、3年、5年三个时间点，分别分析：
- 技术发展对该岗位的影响
- 市场需求和人才结构变化
- 可能的职业机会和挑战
每个时间点80-120字，要有具体的数据或趋势支撑。

### 3. 转型方向（3-5个）
基于用户的技能、经验、行业趋势，推荐3-5个具体的转型方向：
**重要：转型方向必须与用户的职业领域密切相关，避免推荐完全不相关的岗位！**

每个转型方向包含：
- role: 转型后的岗位名称（明确具体，必须与${jobTitle}所在的领域相关）
- match: 匹配度（1-100的整数，基于用户技能的实际情况）
- reason: 推荐理由（60-100字，充分说明为什么这个方向适合，要结合用户的经验背景）
- skills: 需要/提升的核心技能（3-5个具体技能，要与${jobTitle}领域相关）
- timeline: 预计转型时间（3个月/6个月/1年）
- challenges: 主要挑战（2-3点，现实且具体）

**转型方向示例参考（根据不同领域）：**
- 医疗领域：医学影像AI专家、远程医疗运营、医疗数据分析师、医学AI产品经理
- 教育领域：在线教育产品经理、教育科技专家、AI课程设计师、企业培训顾问
- 建筑领域：智慧建筑项目经理、绿色建筑专家、建筑安全工程师、BIM建模师
- 法律领域：法律科技产品经理、企业合规顾问、知识产权运营、法律AI应用开发
- 技术领域：AI应用架构师、AI产品经理、AI训练师、数据科学家
- 制造领域：智能制造工程师、质量管理体系负责人、供应链数字化专家
- 零售领域：电商运营专家、数字营销专家、供应链优化师
- 服务业：服务运营优化专家、客户体验经理、培训师
- 其他领域：AI应用产品经理、数字化转型顾问、AI培训师

### 4. 行动计划（5-8步）
制定具体、可执行的行动计划，每步包含：
- 时间节点（如"第1-2周"、"第1个月"）
- 具体行动（可量化的目标）
- 学习资源（课程、书籍、工具）
- 成本估计（时间/金钱）
- 成功指标（如何判断完成）

### 5. AI工具推荐（5-8个）
**重要：AI工具必须与用户的职业领域密切相关！**

根据用户的具体任务和技能背景，推荐最适合的AI工具：
每个工具包含：
- name: 工具名称（明确具体，必须与${jobTitle}领域相关）
- emoji: 相关emoji
- tagline: 一句话定位（6-10字）
- use_case: 具体使用场景（根据用户的任务定制，30-50字，必须说明在${jobTitle}工作中的具体应用）
- difficulty: 难度评级（easy/medium/hard）
- url: 官方链接
- tips: 实用技巧（针对用户的具体情况，20-40字）
- cost: 成本（免费/付费/订阅制）
- learning_curve: 学习曲线（快速/中等/需要时间）

**AI工具必须与用户职业领域相关，例如：**
- 医生：医学影像AI、临床决策支持系统、医学文献检索、病历生成工具
- 教师：教案生成AI、作业批改工具、个性化学习系统、家校沟通助手
- 建筑工人：BIM建模AI、安全监控系统、材料需求预测、工期优化分析
- 律师：法律文书AI、案例检索工具、合规风险扫描、庭审提词辅助
- 程序员：GitHub Copilot、Cursor、Replit AI、Vercel AI SDK
- 运营：电商文案AI、智能客服、销售话术AI

## 输出要求
严格输出以下JSON格式，不要任何多余文字：
{
  "situation": "处境诊断200-300字",
  "timeline": {
    "year1": "1年内分析80-120字",
    "year3": "3年内分析80-120字",
    "year5": "5年后分析80-120字"
  },
  "pivots": [
    {
      "role": "转型岗位名称（必须与${jobTitle}领域相关）",
      "match": 匹配度(1-100),
      "reason": "推荐理由60-100字",
      "skills": ["技能1", "技能2", "技能3", "技能4"],
      "timeline": "预计转型时间",
      "challenges": ["挑战1", "挑战2", "挑战3"]
    }
  ],
  "action_plan": [
    "第1步：具体行动和目标...",
    "第2步：具体行动和目标..."
  ],
  "ai_tools": [
    {
      "name": "工具名称（必须与${jobTitle}领域相关）",
      "emoji": "emoji",
      "tagline": "定位6-10字",
      "use_case": "具体场景30-50字（必须说明在${jobTitle}工作中的具体应用）",
      "difficulty": "easy",
      "url": "https://...",
      "tips": "实用技巧20-40字",
      "cost": "免费/付费/订阅制",
      "learning_curve": "快速/中等/需要时间"
    }
  ]
}

注意事项：
1. 内容要专业、客观、有建设性
2. 避免夸大或过于乐观的描述
3. 提供具体可执行的步骤
4. 考虑用户可能的限制（时间、金钱、学习能力）
5. **转型方向和AI工具必须与用户的职业领域高度相关，避免推荐完全不相关的岗位或工具**
6. 引用具体的行业趋势或数据（如"根据麦肯锡2024年报告..."）`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model:           'deepseek-chat',
      messages:        [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature:     0.4,
      max_tokens:      2500,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`)

  const data = await res.json()
  const raw  = JSON.parse(data.choices[0].message.content)

  return {
    situation:   raw.situation   ?? '',
    timeline:    raw.timeline    ?? { year1: '', year3: '', year5: '' },
    pivots:      (raw.pivots     ?? []).slice(0, 5).map((p: Pivot) => ({
      ...p,
      timeline: p.timeline ?? '6个月',
      challenges: p.challenges ?? [],
    })),
    action_plan: (raw.action_plan ?? []).slice(0, 8),
    ai_tools:    (raw.ai_tools   ?? []).slice(0, 8).map((t: AITool) => ({
      ...t,
      cost: t.cost ?? '付费',
      learning_curve: t.learning_curve ?? '中等',
    })),
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
      const orderIdValid = input.orderId && isPaid(input.orderId)
      const tokenValid = input.token && validateFreeLink(input.token).valid
      if (!orderIdValid && !tokenValid) {
        return NextResponse.json({ error: '请先完成支付或使用有效的免费链接' }, { status: 403 })
      }
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    let report: DeepReportData
    if (apiKey) {
      try {
        // 检测职业领域
        const domain = detectCareerDomain(input.jobTitle, input.industry)
        report = await callDeepSeek(input)
      } catch (e) {
        console.error('[deep-report] DeepSeek failed, falling back to mock:', e)
        const domain = detectCareerDomain(input.jobTitle, input.industry)
        report = getMock(input.jobTitle, input.label, domain)
      }
    } else {
      const domain = detectCareerDomain(input.jobTitle, input.industry)
      report = getMock(input.jobTitle, input.label, domain)
    }

    return NextResponse.json(report)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '输入格式错误', details: err.errors }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: '报告生成失败，请稍后重试' }, { status: 500 })
  }
}
