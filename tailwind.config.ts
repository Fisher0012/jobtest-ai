import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 全站字体：Inter 负责数字/拉丁，后面是精选中文系统字体栈
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'Inter',
          '-apple-system',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Noto Sans CJK SC',
          'sans-serif',
        ],
        // 大数字专用：Inter 极粗权重，纯数字场景
        display: [
          'var(--font-inter)',
          'Inter',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: {
          bg:      '#F5F6FA',
          card:    '#FFFFFF',
          border:  '#0000001a',
          accent:  '#DC2626',
          orange:  '#EA580C',
          yellow:  '#D97706',
          green:   '#16A34A',
        }
      },
    },
  },
  plugins: [],
}
export default config
