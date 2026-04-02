import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createTables } from '@/lib/schema'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function GET() {
  try {
    await createTables()
    const result = await db.execute('SELECT * FROM trips ORDER BY created_at DESC')
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener viajes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await createTables()
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO trips (id, name, destination, start_date, end_date, currency, budget, status, color_idx)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.name, body.destination, body.startDate, body.endDate, body.currency, body.budget, body.status, body.colorIdx]
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear viaje' }, { status: 500 })
  }
}