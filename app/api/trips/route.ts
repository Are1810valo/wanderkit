import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createTables } from '@/lib/schema'
import { z } from 'zod'
import { getServerSession } from 'next-auth'

const uid = () => Math.random().toString(36).slice(2, 10)

const TripSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  destination: z.string().max(200).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.number().min(0).optional().default(0),
  currency: z.string().length(3).optional().default('USD'),
  status: z.enum(['planificado', 'en curso', 'finalizado']).optional().default('planificado'),
  colorIdx: z.number().min(0).max(10).optional().default(0),
})

export async function GET() {
  try {
    await createTables()
    const session = await getServerSession()
    const email = session?.user?.email
    if (!email) return NextResponse.json([])
    const result = await db.execute({
      sql: `SELECT DISTINCT t.* FROM trips t
            LEFT JOIN trip_members tm ON t.id=tm.trip_id AND tm.user_id=? AND tm.status='activo'
            WHERE t.owner_id=? OR tm.user_id=?
            ORDER BY t.created_at DESC`,
      args: [email, email, email]
    })
    return NextResponse.json(result.rows)
  } catch(e) {
    return NextResponse.json({ error: 'Error al obtener viajes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = TripSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const d = parsed.data
    const id = uid()
    await db.execute({
      sql: `INSERT INTO trips (id, name, destination, start_date, end_date, currency, budget, status, color_idx)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, d.name, d.destination || null, d.startDate || null, d.endDate || null,
             d.currency, d.budget, d.status, d.colorIdx]
    })
    return NextResponse.json({ id })
  } catch (e) {
    return NextResponse.json({ error: 'Error al crear viaje' }, { status: 500 })
  }
}