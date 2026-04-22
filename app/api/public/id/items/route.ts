import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{id:string}> }) {
  const { id } = await params
  try {
    const [flights, itinerary, expenses, places] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM flights WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM itinerary WHERE trip_id=? ORDER BY day,time', args: [id] }),
      db.execute({ sql: "SELECT * FROM expenses WHERE trip_id=? AND visibility='grupal'", args: [id] }),
      db.execute({ sql: 'SELECT * FROM places WHERE trip_id=?', args: [id] }),
    ])
    return NextResponse.json({
      flights: flights.rows,
      itinerary: itinerary.rows,
      expenses: expenses.rows,
      places: places.rows,
    })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}