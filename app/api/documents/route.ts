import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO documents (id, trip_id, name, type, url, status, notes, visibility, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.tripId, body.name, body.type, body.url||null, body.status, body.notes||null, body.visibility||'grupal', body.created_by||null]
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear documento' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    await db.execute({
      sql: `UPDATE documents SET name=?, type=?, url=?, status=?, notes=?, visibility=?, has_it=?, packed=? WHERE id=?`,
      args: [body.name, body.type, body.url||null, body.status, body.notes||null, body.visibility||'grupal', body.has_it?1:0, body.packed?1:0, body.id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar documento' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await db.execute({ sql: 'DELETE FROM documents WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 })
  }
}