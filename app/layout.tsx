import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Inter：数字与拉丁字符使用，variable 权重 100-900
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI 职业危机指数测评',
  description: '基于 Oxford / Goldman Sachs 研究模型，量化你的 AI 替代风险',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="bg-[#F5F6FA] text-[#111118] antialiased">{children}</body>
    </html>
  )
}
