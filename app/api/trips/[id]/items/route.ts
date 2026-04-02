import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const [itinerary, expenses, places, documents, proposals, journal, checklist] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM itinerary WHERE trip_id=? ORDER BY day, time', args: [params.id] }),
      db.execute({ sql: 'SELECT * FROM expenses WHERE trip_id=?', args: [params.id] }),
      db.execute({ sql: 'SELECT * FROM places WHERE trip_id=?', args: [params.id] }),
      db.execute({ sql: 'SELECT * FROM documents WHERE trip_id=?', args: [params.id] }),
      db.execute({ sql: 'SELECT * FROM proposals WHERE trip_id=?', args: [params.id] }),
      db.execute({ sql: 'SELECT * FROM journal WHERE trip_id=? ORDER BY day', args: [params.id] }),
      db.execute({ sql: 'SELECT * FROM checklist WHERE trip_id=?', args: [params.id] }),
    ])
    return NextResponse.json({
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