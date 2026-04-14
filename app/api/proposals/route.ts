import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

const uid = () => Math.random().toString(36).slice(2, 10)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = uid()
    await db.execute({
      sql: `INSERT INTO proposals (id, trip_id, title, description, my_vote, module, votes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.tripId, body.title, body.description||null, null, body.module||null, '{}', 'abierta']
    })
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear propuesta' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const session = await getServerSession()
    const email = session?.user?.email

    if (body.my_vote !== undefined && !body.title) {
      const propResult = await db.execute({ sql: 'SELECT * FROM proposals WHERE id=?', args: [body.id] })
      if (!propResult.rows.length) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      const prop = propResult.rows[0]

      let votes: Record<string,string> = {}
      try { votes = JSON.parse(String(prop.votes||'{}')) } catch{}
      if (body.my_vote === null) delete votes[email!]
      else votes[email!] = body.my_vote

      const tripResult = await db.execute({ sql: 'SELECT owner_id FROM trips WHERE id=?', args: [prop.trip_id] })
      const membersResult = await db.execute({
        sql: `SELECT user_id FROM trip_members WHERE trip_id=? AND status='activo'`,
        args: [prop.trip_id]
      })
      const allMembers = new Set([
        String(tripResult.rows[0]?.owner_id||''),
        ...membersResult.rows.map((r:any)=>String(r.user_id))
      ].filter(Boolean))

      const voteValues = Object.values(votes)
      const totalVoted = voteValues.length
      const totalMembers = allMembers.size
      const siVotes = voteValues.filter(v=>v==='si').length
      const noVotes = voteValues.filter(v=>v==='no').length

      let newStatus = 'abierta'
      if (totalMembers > 0 && siVotes === totalMembers) newStatus = 'aprobada'
      else if (totalMembers > 0 && noVotes === totalMembers) newStatus = 'rechazada'
      else if (totalVoted === totalMembers && siVotes > noVotes) newStatus = 'aprobada'

      await db.execute({
        sql: `UPDATE proposals SET my_vote=?, votes=?, status=? WHERE id=?`,
        args: [body.my_vote, JSON.stringify(votes), newStatus, body.id]
      })

      if (newStatus === 'aprobada' && prop.module && prop.module !== 'general') {
        try {
          const itemId = uid()
          const module = String(prop.module)
          const title = String(prop.title)
          const tripId = String(prop.trip_id)

          if (module === 'itinerary') {
            await db.execute({
              sql: `INSERT INTO itinerary (id, trip_id, day, name, type, status, note, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [itemId, tripId, parseInt(String(body.day))||1, title, 'actividades', 'pendiente', 'Creado desde propuesta aprobada', body.time||null]
            })
          } else if (module === 'places') {
            await db.execute({
              sql: `INSERT INTO places (id, trip_id, name, type, visited, rating) VALUES (?, ?, ?, ?, ?, ?)`,
              args: [itemId, tripId, title, 'Lugar', 0, 0]
            })
          } else if (module === 'expenses') {
            await db.execute({
              sql: `INSERT INTO expenses (id, trip_id, name, category, estimated, visibility) VALUES (?, ?, ?, ?, ?, ?)`,
              args: [itemId, tripId, title, body.category||'otros', parseFloat(String(body.estimated))||0, 'grupal']
            })
          } else if (module === 'flights') {
            await db.execute({
              sql: `INSERT INTO flights (id, trip_id, type, origin_city, destination_city, departure_date) VALUES (?, ?, ?, ?, ?, ?)`,
              args: [itemId, tripId, 'ida', body.origin||'', body.destination||title, body.date||null]
            })
          }
        } catch(e) { console.error('Error creando ítem:', e) }
      }

      return NextResponse.json({ success: true, status: newStatus, votes })
    }

    await db.execute({
      sql: `UPDATE proposals SET title=?, description=?, module=? WHERE id=?`,
      args: [body.title, body.description||null, body.module||null, body.id]
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar propuesta' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await db.execute({ sql: 'DELETE FROM proposals WHERE id=?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar propuesta' }, { status: 500 })
  }
}