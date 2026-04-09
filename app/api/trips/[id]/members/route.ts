import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// GET /api/trips/[id]/members
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await db.execute({
      sql: `SELECT tm.user_id, tm.role, tm.status, tm.invited_by, tm.joined_at,
                   u.name, u.image
            FROM trip_members tm
            LEFT JOIN users u ON tm.user_id = u.email
            WHERE tm.trip_id=? AND tm.status='activo'`,
      args: [id]
    })
    return NextResponse.json(result.rows)
  } catch(e) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}