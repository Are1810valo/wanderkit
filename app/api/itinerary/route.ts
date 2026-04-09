import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO itinerary (id, trip_id, day, name, time, time_real, type, status, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.tripId, body.day, body.name, body.time||null, body.time_real||body.timeReal||null, body.type, body.status, body.note||null]
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear actividad' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    await db.execute({
      sql: `UPDATE itinerary SET day=?, name=?, time=?, time_real=?, type=?, status=?, note=? WHERE id=?`,
      args: [body.day, body.name, body.time||null, body.time_real||body.timeReal||null, body.type, body.status, body.note||null, body.id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar actividad' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await db.execute({ sql: 'DELETE FROM itinerary WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar actividad' }, { status: 500 })
  }
}