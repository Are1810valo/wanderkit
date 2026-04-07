import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const TripUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  destination: z.string().max(200).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.union([z.number(), z.string()]).transform(v => parseFloat(String(v)) || 0).optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(['planificado', 'en curso', 'finalizado']).optional(),
  color_idx: z.number().min(0).max(10).optional(),
  colorIdx: z.number().min(0).max(10).optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id || id.length > 20) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    const result = await db.execute({ sql: 'SELECT * FROM trips WHERE id=?', args: [id] })
    if (!result.rows.length) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(result.rows[0])
  } catch (e) {
    return NextResponse.json({ error: 'Error al obtener viaje' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id || id.length > 20) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const body = await request.json()
    const parsed = TripUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const b = parsed.data

    await db.execute({
      sql: `UPDATE trips SET name=?, destination=?, start_date=?, end_date=?, currency=?, budget=?, status=?, color_idx=? WHERE id=?`,
      args: [
        b.name,
        b.destination ?? null,
        b.start_date || b.startDate || null,
        b.end_date || b.endDate || null,
        b.currency || 'USD',
        b.budget ?? 0,
        b.status || 'planificado',
        b.color_idx ?? b.colorIdx ?? 0,
        id
      ]
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error al actualizar viaje' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id || id.length > 20) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    await db.execute({ sql: 'DELETE FROM trips WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error al eliminar viaje' }, { status: 500 })
  }
}