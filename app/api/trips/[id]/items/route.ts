import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createTables } from '@/lib/schema'
import { getServerSession } from 'next-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    const email = session?.user?.email || null
    await createTables()

    // Verificar si es owner
    const tripResult = await db.execute({ sql: 'SELECT owner_id FROM trips WHERE id=?', args: [id] })
    const isOwner = tripResult.rows[0]?.owner_id === email

    const [flights, itinerary, expenses, places, documents, proposals, journal, checklist] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM flights WHERE trip_id=? ORDER BY departure_date, departure_time', args: [id] }),
      db.execute({ sql: 'SELECT * FROM itinerary WHERE trip_id=? ORDER BY day, time', args: [id] }),
      // Gastos: grupal + personales propios (owner ve todo)
      db.execute({ sql: isOwner
        ? 'SELECT * FROM expenses WHERE trip_id=?'
        : 'SELECT * FROM expenses WHERE trip_id=? AND (visibility=\'grupal\' OR visibility IS NULL OR created_by=?)',
        args: isOwner ? [id] : [id, email] }),
      db.execute({ sql: 'SELECT * FROM places WHERE trip_id=?', args: [id] }),
      // Documentos: grupal + personales propios (owner ve todo)
      db.execute({ sql: isOwner
        ? 'SELECT * FROM documents WHERE trip_id=?'
        : 'SELECT * FROM documents WHERE trip_id=? AND (visibility=\'grupal\' OR visibility IS NULL OR created_by=?)',
        args: isOwner ? [id] : [id, email] }),
      db.execute({ sql: 'SELECT * FROM proposals WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM journal WHERE trip_id=? ORDER BY day', args: [id] }),
      // Checklist: grupal + personales propios (owner ve todo)
      db.execute({ sql: isOwner
        ? 'SELECT * FROM checklist WHERE trip_id=?'
        : 'SELECT * FROM checklist WHERE trip_id=? AND (visibility=\'grupal\' OR visibility IS NULL OR created_by=?)',
        args: isOwner ? [id] : [id, email] }),
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