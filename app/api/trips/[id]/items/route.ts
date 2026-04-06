import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createTables } from '@/lib/schema'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await createTables()
    const [flights, itinerary, expenses, places, documents, proposals, journal, checklist] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM flights WHERE trip_id=? ORDER BY departure_date, departure_time', args: [id] }),
      db.execute({ sql: 'SELECT * FROM itinerary WHERE trip_id=? ORDER BY day, time', args: [id] }),
      db.execute({ sql: 'SELECT * FROM expenses WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM places WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM documents WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM proposals WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM journal WHERE trip_id=? ORDER BY day', args: [id] }),
      db.execute({ sql: 'SELECT * FROM checklist WHERE trip_id=?', args: [id] }),
    ])
    return NextResponse.json({
      flights: flights.rows,
      itinerary: itinerary.rows,
      expenses: expenses.rows,
      places: places.rows,
      documents: documents.rows,
      proposals: proposals.rows,
      journal: journal.rows,
      checklist: checklist.rows,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}