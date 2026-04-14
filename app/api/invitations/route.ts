import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    const result = await db.execute({
      sql: `SELECT tm.*, t.name as trip_name, t.destination 
            FROM trip_members tm 
            JOIN trips t ON tm.trip_id = t.id 
            WHERE tm.invite_token=? AND tm.status='pendiente'`,
      args: [token]
    })
    if (!result.rows.length) return NextResponse.json({ error: 'Invitación inválida o ya usada' }, { status: 404 })
    return NextResponse.json(result.rows[0])
  } catch(e) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { tripId, email, role, access } = await request.json()
    if (!tripId || !email || !role) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    if (!['lector','escritor'].includes(role)) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })

    const trip = await db.execute({ sql: 'SELECT owner_id FROM trips WHERE id=?', args: [tripId] })
    if (!trip.rows.length) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    if (trip.rows[0].owner_id !== session.user.email) {
      const member = await db.execute({
        sql: `SELECT role FROM trip_members WHERE trip_id=? AND user_id=? AND role='escritor'`,
        args: [tripId, session.user.email]
      })
      if (!member.rows.length) return NextResponse.json({ error: 'Sin permisos para invitar' }, { status: 403 })
    }

    const existing = await db.execute({
      sql: 'SELECT id FROM trip_members WHERE trip_id=? AND user_id=?',
      args: [tripId, email]
    })
    if (existing.rows.length) return NextResponse.json({ error: 'Este usuario ya fue invitado' }, { status: 409 })

    const token = uid() + uid()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO trip_members (id, trip_id, user_id, role, invited_by, invite_token, status, access) 
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      args: [id, tripId, email, role, session.user.email, token, access||'grupal']
    })

    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${token}`
    return NextResponse.json({ success: true, inviteUrl, token })
  } catch(e) { return NextResponse.json({ error: 'Error al crear invitación' }, { status: 500 }) }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { token } = await request.json()
    const result = await db.execute({
      sql: `SELECT * FROM trip_members WHERE invite_token=? AND status='pendiente'`,
      args: [token]
    })
    if (!result.rows.length) return NextResponse.json({ error: 'Invitación inválida' }, { status: 404 })

    await db.execute({
      sql: `UPDATE trip_members SET status='activo', user_id=?, joined_at=datetime('now') WHERE invite_token=?`,
      args: [session.user.email, token]
    })
    return NextResponse.json({ success: true, tripId: result.rows[0].trip_id })
  } catch(e) { return NextResponse.json({ error: 'Error al aceptar invitación' }, { status: 500 }) }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')
    const userId = searchParams.get('userId')
    await db.execute({
      sql: 'DELETE FROM trip_members WHERE trip_id=? AND user_id=?',
      args: [tripId, userId]
    })
    return NextResponse.json({ success: true })
  } catch(e) { return NextResponse.json({ error: 'Error al eliminar miembro' }, { status: 500 }) }
}