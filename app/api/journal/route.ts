import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO journal (id, trip_id, day, date, title, text, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.tripId, body.day, body.date, body.title, body.text, body.rating]
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear entrada' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    await db.execute({
      sql: `UPDATE journal SET day=?, date=?, title=?, text=?, rating=? WHERE id=?`,
      args: [body.day, body.date, body.title, body.text, body.rating, body.id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar entrada' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await db.execute({ sql: 'DELETE FROM journal WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar entrada' }, { status: 500 })
  }
}