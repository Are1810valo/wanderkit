import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateStore = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 120
const RATE_WINDOW = 60_000

function getRateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateStore.get(ip)
  if (!entry || now > entry.reset) {
    rateStore.set(ip, { count: 1, reset: now + RATE_WINDOW })
    return { ok: true, remaining: RATE_LIMIT - 1 }
  }
  if (entry.count >= RATE_LIMIT) return { ok: false, remaining: 0 }
  entry.count++
  return { ok: true, remaining: RATE_LIMIT - entry.count }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const { ok, remaining } = getRateLimit(ip)

    if (!ok) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta en un momento.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Limit': String(RATE_LIMIT), 'X-RateLimit-Remaining': '0' } }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  }

  const sitePassword = process.env.SITE_PASSWORD
const isAuth = pathname.startsWith('/api/auth') || pathname.startsWith('/login')
if (!isAuth) {
  const sessionToken = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token')
  if (!sessionToken) {
    if (sitePassword) {
      const cookie = request.cookies.get('wk_auth')
      if (cookie?.value !== sitePassword) return NextResponse.redirect(new URL('/login', request.url))
    }
  }
}
  

  return NextResponse.next()
}

export const config = {
matcher: ['/((?!_next/static|_next/image|favicon.ico|trips/.*?/public).*)'],
}