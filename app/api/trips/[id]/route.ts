import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    await db.execute({
      sql: `UPDATE trips SET name=?, destination=?, start_date=?, end_date=?, currency=?, budget=?, status=?, color_idx=? WHERE id=?`,
      args: [body.name, body.destination, body.startDate, body.endDate, body.currency, body.budget, body.status, body.colorIdx, id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar viaje' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.execute({
      sql: 'DELETE FROM trips WHERE id=?',
      args: [id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar viaje' }, { status: 500 })
  }
}