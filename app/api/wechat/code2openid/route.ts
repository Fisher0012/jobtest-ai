import { NextRequest, NextResponse } from 'next/server'

const WECHAT_APPID = process.env.WECHAT_APPID!
const WECHAT_SECRET = process.env.WECHAT_SECRET!

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: '缺少 code 参数' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`
    )
    const data = await res.json()

    if (data.errcode) {
      return NextResponse.json({ error: data.errmsg }, { status: 400 })
    }

    return NextResponse.json({ openid: data.openid })
  } catch (err) {
    console.error('[wechat/code2openid]', err)
    return NextResponse.json({ error: '获取 openid 失败' }, { status: 500 })
  }
}
