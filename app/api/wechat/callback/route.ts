import { NextRequest, NextResponse } from 'next/server'

const WECHAT_APPID = process.env.WECHAT_APPID!
const WECHAT_SECRET = process.env.WECHAT_SECRET!

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') || '/'

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=no_code`)
  }

  try {
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.errcode) {
      throw new Error(tokenData.errmsg)
    }

    const openid = tokenData.openid
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${state}?openid=${openid}`

    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('[wechat/callback]', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=auth_failed`)
  }
}
