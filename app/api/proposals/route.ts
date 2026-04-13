import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO proposals (id, trip_id, title, description, my_vote) VALUES (?, ?, ?, ?, ?)`,
      args: [id, body.tripId, body.title, body.description||null, null]
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear propuesta' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const session = await getServerSession()
    const email = session?.user?.email

    // Si solo viene my_vote, actualizar solo ese campo con el email del votante
    if (body.my_vote !== undefined && !body.title) {
      await db.execute({
        sql: `UPDATE proposals SET my_vote=? WHERE id=?`,
        args: [body.my_vote, body.id]
      })
      return NextResponse.json({ success: true })
    }

    await db.execute({
      sql: `UPDATE proposals SET title=?, description=?, my_vote=? WHERE id=?`,
      args: [body.title, body.description||null, body.my_vote||body.myVote||null, body.id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar propuesta' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await db.execute({ sql: 'DELETE FROM proposals WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar propuesta' }, { status: 500 })
  }
}