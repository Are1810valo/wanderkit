import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{id:string}> }) {
  const { id } = await params
  try {
    const res = await db.execute({ sql: 'SELECT * FROM trips WHERE id=?', args: [id] })
    if(!res.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(res.rows[0])
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}