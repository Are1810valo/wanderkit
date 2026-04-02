import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO places (id, trip_id, name, type, visited, rating, note, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.tripId, body.name, body.type, body.visited ? 1 : 0, body.rating, body.note, body.lat, body.lng]
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear lugar' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    await db.execute({
      sql: `UPDATE places SET name=?, type=?, visited=?, rating=?, note=?, lat=?, lng=? WHERE id=?`,
      args: [body.name, body.type, body.visited ? 1 : 0, body.rating, body.note, body.lat, body.lng, body.id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar lugar' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await db.execute({ sql: 'DELETE FROM places WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar lugar' }, { status: 500 })
  }
}