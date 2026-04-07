import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store — resetea cada vez que se reinicia el servidor
// En producción idealmente usar Redis, pero para este caso es suficiente
const rateStore = new Map<string, { count: number; reset: number }>()

const RATE_LIMIT = 120   // requests máximos
const RATE_WINDOW = 60_000  // por minuto

function getRateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateStore.get(ip)

  if (!entry || now > entry.reset) {
    rateStore.set(ip, { count: 1, reset: now + RATE_WINDOW })
    return { ok: true, remaining: RATE_LIMIT - 1 }
  }

  if (entry.count >= RATE_LIMIT) {
    return { ok: false, remaining: 0 }
  }

  entry.count++
  return { ok: true, remaining: RATE_LIMIT - entry.count }
}

// Limpiar entradas viejas cada 5 minutos para no acumular memoria
setInterval(() => {
  const now = Date.now()
  rateStore.forEach((val, key) => {
    if (now > val.reset) rateStore.delete(key)
  })
}, 300_000)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo aplica rate limiting a rutas API
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const { ok, remaining } = getRateLimit(ip)

    if (!ok) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta en un momento.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  }

  // Protección con password para rutas de página (no API)
  // Solo si SITE_PASSWORD está configurado en las variables de entorno
  const sitePassword = process.env.SITE_PASSWORD
  if (sitePassword && !pathname.startsWith('/api/') && !pathname.startsWith('/login')) {
    const cookie = request.cookies.get('wk_auth')
    if (cookie?.value !== sitePassword) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}