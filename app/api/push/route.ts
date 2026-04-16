import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const subscriptions: any[] = []

export async function POST(req: NextRequest) {
  const body = await req.json()
  
  if(body.type === 'subscribe') {
    subscriptions.push(body.subscription)
    return NextResponse.json({ ok: true })
  }
  
  if(body.type === 'notify') {
    const payload = JSON.stringify({ title: body.title, body: body.body, url: body.url||'/' })
    await Promise.allSettled(subscriptions.map(sub => webpush.sendNotification(sub, payload)))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}