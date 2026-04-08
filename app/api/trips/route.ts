import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createTables } from '@/lib/schema'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Desempaquetar el ID (Obligatorio en Next.js 15+)
    const { id } = await params
    
    // 2. Asegurar que las tablas existen
    await createTables()

    // 3. Consulta paralela de toda la información relacionada al viaje
    const [
      tripResult,
      flights,
      itinerary,
      expenses,
      places,
      documents,
      proposals,
      journal,
      checklist
    ] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM trips WHERE id = ?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM flights WHERE trip_id=? ORDER BY departure_date, departure_time', args: [id] }),
      db.execute({ sql: 'SELECT * FROM itinerary WHERE trip_id=? ORDER BY day, time', args: [id] }),
      db.execute({ sql: 'SELECT * FROM expenses WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM places WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM documents WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM proposals WHERE trip_id=?', args: [id] }),
      db.execute({ sql: 'SELECT * FROM journal WHERE trip_id=? ORDER BY day', args: [id] }),
      db.execute({ sql: 'SELECT * FROM checklist WHERE trip_id=?', args: [id] }),
    ])

    // 4. Verificar si el viaje existe
    if (!tripResult.rows || tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }

    // 5. Retornar objeto unificado (Datos del viaje + listas de detalles)
    return NextResponse.json({
      ...tripResult.rows[0],
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
    console.error('Error en API dynamic route:', error)
    return NextResponse.json(
      { error: 'Error interno al obtener los datos del viaje' }, 
      { status: 500 }
    )
  }
}