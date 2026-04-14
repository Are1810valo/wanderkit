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

    const tripResult = await db.execute({ sql: 'SELECT owner_id FROM trips WHERE id=?', args: [id] })
    const isOwner = tripResult.rows[0]?.owner_id === email

    // Obtener access del miembro
    let memberAccess = 'grupal'
    if (!isOwner && email) {
      const memberResult = await db.execute({
        sql: `SELECT access FROM trip_members WHERE trip_id=? AND user_id=? AND status='activo'`,
        args: [id, email]
      })
      if (memberResult.rows.length) {
        memberAccess = String(memberResult.rows[0].access || 'grupal')
      }
    }

    // Owner ve todo
    // access='grupal' → ve grupales + personales propios
    // access='personal' → ve solo personales propios
    const [flights, itinerary, expenses, places, documents, proposals, journal, checklist] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM flights WHERE trip_id=? ORDER BY departure_date, departure_time', args: [id] }),
      db.execute({ sql: 'SELECT * FROM itinerary WHERE trip_id=? ORDER BY day, time', args: [id] }),
      isOwner
        ? db.execute({ sql: 'SELECT * FROM expenses WHERE trip_id=?', args: [id] })
        : memberAccess === 'personal'
          ? db.execute({ sql: `SELECT * FROM expenses WHERE trip_id=? AND (visibility='personal' OR visibility IS NULL) AND created_by=?`, args: [id, email] })
          : db.execute({ sql: `SELECT * FROM expenses WHERE trip_id=? AND (visibility='grupal' OR visibility IS NULL OR created_by=?)`, args: [id, email] }),
      db.execute({ sql: 'SELECT * FROM places WHERE trip_id=?', args: [id] }),
      isOwner
        ? db.execute({ sql: 'SELECT * FROM documents WHERE trip_id=?', args: [id] })
        : memberAccess === 'personal'
          ? db.execute({ sql: `SELECT * FROM documents WHERE trip_id=? AND (visibility='personal' OR visibility IS NULL) AND created_by=?`, args: [id, email] })
          : db.execute({ sql: `SELECT * FROM documents WHERE trip_id=? AND (visibility='grupal' OR visibility IS NULL OR created_by=?)`, args: [id, email] }),
      db.execute({ sql: 'SELECT * FROM proposals WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM journal WHERE trip_id=? ORDER BY day', args: [id] }),
      isOwner
        ? db.execute({ sql: 'SELECT * FROM checklist WHERE trip_id=?', args: [id] })
        : memberAccess === 'personal'
          ? db.execute({ sql: `SELECT * FROM checklist WHERE trip_id=? AND (visibility='personal' OR visibility IS NULL) AND created_by=?`, args: [id, email] })
          : db.execute({ sql: `SELECT * FROM checklist WHERE trip_id=? AND (visibility='grupal' OR visibility IS NULL OR created_by=?)`, args: [id, email] }),
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