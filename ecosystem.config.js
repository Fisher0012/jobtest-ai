module.exports = {
  apps: [{
    name: 'ai-career-test',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/jobtest-ai',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DEEPSEEK_API_KEY: 'sk-360700bc766b46eb8227b32f5e33e573',
      NEXT_PUBLIC_SHOP_URL: 'https://www.xiaohongshu.com/shop/your-shop-id',
      WECHAT_MCHID: '1643683525',
      WECHAT_APPID: 'wx913d3eea2b04ce29',
      WECHAT_SECRET: '2a79760b880fca4b937ec614654cb472',
      WECHAT_SERIAL_NO: '75F5E48600DF4E0180F9CFBD8173C82AE0DB9F55',
      WECHAT_API_V3_KEY: '8nS2GbP7vQcR9tY1kLz5xD4mF0hJ6wE3',
      WECHAT_PLATFORM_SERIAL: '489F90906E8BD46CD19D49F7D5BD6FEF2FAA575C',
      NEXT_PUBLIC_BASE_URL: 'https://aicareer.sque.site',
      PAYMENT_PROVIDER: 'wechat'
    }
  }]
}
