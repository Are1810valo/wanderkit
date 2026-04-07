import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const sitePassword = process.env.SITE_PASSWORD

    // Si no hay password configurado, acceso libre
    if (!sitePassword) {
      return NextResponse.json({ success: true })
    }

    if (!password || password !== sitePassword) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    // Cookie con duración de 30 días
    response.cookies.set('wk_auth', sitePassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}