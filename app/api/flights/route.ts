import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const b = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO flights (id,trip_id,type,airline,flight_number,origin_airport,origin_city,destination_airport,destination_city,departure_date,departure_time,arrival_date,arrival_time,has_layover,layover_airport,layover_city,layover_arrival_time,layover_departure_time,layover_duration,price,persons,notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [id,b.tripId,b.type,b.airline,b.flightNumber,b.originAirport,b.originCity,b.destinationAirport,b.destinationCity,b.departureDate,b.departureTime,b.arrivalDate,b.arrivalTime,b.hasLayover?1:0,b.layoverAirport,b.layoverCity,b.layoverArrivalTime,b.layoverDepartureTime,b.layoverDuration,b.price||null,b.persons||1,b.notes]
    })
    return NextResponse.json({ id })
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function PUT(request: Request) {
  try {
    const b = await request.json()
    await db.execute({
      sql: `UPDATE flights SET type=?,airline=?,flight_number=?,origin_airport=?,origin_city=?,destination_airport=?,destination_city=?,departure_date=?,departure_time=?,arrival_date=?,arrival_time=?,has_layover=?,layover_airport=?,layover_city=?,layover_arrival_time=?,layover_departure_time=?,layover_duration=?,price=?,persons=?,notes=? WHERE id=?`,
      args: [b.type,b.airline,b.flight_number||b.flightNumber,b.origin_airport||b.originAirport,b.origin_city||b.originCity,b.destination_airport||b.destinationAirport,b.destination_city||b.destinationCity,b.departure_date||b.departureDate,b.departure_time||b.departureTime,b.arrival_date||b.arrivalDate,b.arrival_time||b.arrivalTime,b.has_layover?1:0,b.layover_airport||b.layoverAirport,b.layover_city||b.layoverCity,b.layover_arrival_time||b.layoverArrivalTime,b.layover_departure_time||b.layoverDepartureTime,b.layover_duration||b.layoverDuration,b.price||null,b.persons||1,b.notes,b.id]
    })
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    await db.execute({ sql: 'DELETE FROM flights WHERE id=?', args: [searchParams.get('id')] })
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}