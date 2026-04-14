import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO expenses (id, trip_id, name, category, estimated, real, persons, paid_by, visibility, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.tripId, body.name, body.category, body.estimated||null, body.real||null, body.persons||1, body.paidBy||null, body.visibility||'grupal', body.created_by||null]
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    await db.execute({
      sql: `UPDATE expenses SET name=?, category=?, estimated=?, real=?, persons=?, paid_by=?, visibility=? WHERE id=?`,
      args: [body.name, body.category, body.estimated||null, body.real||null, body.persons||1, body.paid_by||body.paidBy||null, body.visibility||'grupal', body.id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar gasto' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await db.execute({ sql: 'DELETE FROM expenses WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 })
  }
}