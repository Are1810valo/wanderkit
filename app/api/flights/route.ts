import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO flights (id, trip_id, type, airline, flight_number, origin_airport, origin_city, destination_airport, destination_city, departure_date, departure_time, arrival_date, arrival_time, has_layover, layover_airport, layover_duration, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.tripId, body.type, body.airline, body.flightNumber, body.originAirport, body.originCity, body.destinationAirport, body.destinationCity, body.departureDate, body.departureTime, body.arrivalDate, body.arrivalTime, body.hasLayover ? 1 : 0, body.layoverAirport, body.layoverDuration, body.notes]
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear vuelo' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    await db.execute({
      sql: `UPDATE flights SET type=?, airline=?, flight_number=?, origin_airport=?, origin_city=?, destination_airport=?, destination_city=?, departure_date=?, departure_time=?, arrival_date=?, arrival_time=?, has_layover=?, layover_airport=?, layover_duration=?, notes=? WHERE id=?`,
      args: [body.type, body.airline, body.flightNumber, body.originAirport, body.originCity, body.destinationAirport, body.destinationCity, body.departureDate, body.departureTime, body.arrivalDate, body.arrivalTime, body.hasLayover ? 1 : 0, body.layoverAirport, body.layoverDuration, body.notes, body.id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar vuelo' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await db.execute({ sql: 'DELETE FROM flights WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar vuelo' }, { status: 500 })
  }
}