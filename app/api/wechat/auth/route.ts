import { NextRequest, NextResponse } from 'next/server'

const WECHAT_APPID = process.env.WECHAT_APPID!
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/wechat/callback'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const redirect = searchParams.get('redirect') || '/'

  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_APPID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=snsapi_base&state=${encodeURIComponent(redirect)}#wechat_redirect`

  return NextResponse.redirect(authUrl)
}
