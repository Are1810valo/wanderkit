'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const fmt = (n: number, cur = 'USD') =>
  !n && n !== 0 ? '—' : new Intl.NumberFormat('es-CL',{style:'currency',currency:cur,maximumFractionDigits:0}).format(n)

export default function PublicTripPage() {
  const params = useParams()
  const tripId = params.id as string
  const [trip, setTrip] = useState<any>(null)
  const [items, setItems] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    Promise.all([
      fetch(`/api/trips/${tripId}/public`).then(r=>r.json()),
      fetch(`/api/trips/${tripId}/items`).then(r=>r.json()),
    ]).then(([t,i])=>{ setTrip(t); setItems(i) }).catch(()=>{}).finally(()=>setLoading(false))
  },[tripId])

  useEffect(()=>{
    const h = new Date().getHours()
    document.documentElement.setAttribute('data-theme', h>=7&&h<19?'light':'dark')
  },[])

  if(loading) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--navy)',opacity:0.5}}>Cargando...</div>
    </div>
  )

  if(!trip) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,fontWeight:300,color:'var(--navy)',marginBottom:12}}>Viaje no encontrado</div>
        <div style={{fontSize:14,color:'var(--text-light)'}}>Este link puede haber expirado o no existe.</div>
      </div>
    </div>
  )

  const est = items?.expenses?.reduce((s:number,e:any)=>s+(e.estimated||0),0)||0
  const real = items?.expenses?.reduce((s:number,e:any)=>s+(e.real||0),0)||0
  const fl = items?.flights||[]
  const itin = items?.itinerary||[]
  const places = items?.places||[]
  const days = [...new Set(itin.map((a:any)=>a.day))].sort((a:any,b:any)=>a-b) as number[]

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'DM Sans,sans-serif'}}>
      {/* Header */}
      <div style={{background:'var(--bg-sidebar)',padding:'20px 0',marginBottom:0}}>
        <div style={{maxWidth:800,margin:'0 auto',padding:'0 24px'}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:300,color:'#f0ece3',marginBottom:4}}>
            Wander<em style={{color:'#b87333',fontStyle:'italic'}}>Kit</em>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{background:'var(--bg-card)',borderBottom:'1px solid var(--border)',padding:'32px 0',marginBottom:32}}>
        <div style={{maxWidth:800,margin:'0 auto',padding:'0 24px'}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:8}}>
            {trip.status==='en curso'?'🟢 En curso':trip.status==='finalizado'?'🏁 Finalizado':'📋 Planificado'}
          </div>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:42,fontWeight:300,color:'var(--navy)',lineHeight:1,marginBottom:10}}>{trip.name}</div>
          <div style={{fontSize:14,color:'var(--text-mid)',marginBottom:6}}>📍 {trip.destination}</div>
          <div style={{fontSize:13,color:'var(--text-light)'}}>{trip.start_date} → {trip.end_date} · {fmt(trip.budget,trip.currency)}</div>
          <div style={{marginTop:16,display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',background:'rgba(138,138,170,0.08)',border:'1px solid var(--border)',borderRadius:20,fontSize:12,color:'var(--text-light)'}}>
            👁 Vista pública · Solo lectura
          </div>
        </div>
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'0 24px 64px'}}>

        {/* Vuelos */}
        {fl.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--navy)',marginBottom:16}}>Vuelos</div>
            {fl.map((f:any)=>(
              <div key={f.id} style={{background:'var(--bg-card)',borderRadius:14,padding:'16px 20px',border:'1px solid var(--border)',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
                  <span style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:f.type==='ida'?'rgba(74,127,165,0.1)':'rgba(74,124,89,0.1)',color:f.type==='ida'?'#4a7fa5':'#4a7c59'}}>{f.type==='ida'?'✈️ Ida':'🔄 Regreso'}</span>
                  {f.airline&&<span style={{fontSize:13,color:'var(--text-mid)'}}>{f.airline} {f.flight_number}</span>}
                  {f.price&&<span style={{fontSize:13,fontWeight:600,color:'var(--navy)',fontFamily:'Cormorant Garamond,serif'}}>{fmt(f.price,trip.currency)}</span>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,color:'var(--navy)'}}>{f.origin_airport||f.origin_city}</div>
                    <div style={{fontSize:12,color:'var(--text-light)',marginTop:2}}>{f.departure_date} · {f.departure_time}</div>
                  </div>
                  <div style={{fontSize:18}}>→</div>
                  <div style={{flex:1,textAlign:'right'}}>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,color:'var(--navy)'}}>{f.destination_airport||f.destination_city}</div>
                    <div style={{fontSize:12,color:'var(--text-light)',marginTop:2}}>{f.arrival_date} · {f.arrival_time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Itinerario */}
        {itin.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--navy)',marginBottom:16}}>Itinerario</div>
            {days.map(day=>{
              const acts = itin.filter((a:any)=>a.day===day).sort((a:any,b:any)=>(a.time||'').localeCompare(b.time||''))
              return (
                <div key={day} style={{marginBottom:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Día {day}</div>
                  {acts.map((a:any)=>(
                    <div key={a.id} style={{display:'flex',gap:12,padding:'12px 16px',background:'var(--bg-card)',borderRadius:12,marginBottom:6,border:'1px solid var(--border)',borderLeft:`4px solid ${a.status==='realizado'?'#4a7c59':a.status==='cancelado'?'#c45c5c':'#b87333'}`}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{a.name}</div>
                        <div style={{fontSize:12,color:'var(--text-light)',marginTop:2,display:'flex',gap:10}}>
                          {a.time&&<span>🕐 {a.time}</span>}
                          <span style={{textTransform:'capitalize'}}>{a.type}</span>
                        </div>
                      </div>
                      <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,alignSelf:'flex-start',background:a.status==='realizado'?'rgba(74,124,89,0.1)':a.status==='cancelado'?'rgba(196,92,92,0.1)':'rgba(184,115,51,0.1)',color:a.status==='realizado'?'#4a7c59':a.status==='cancelado'?'#c45c5c':'#b87333'}}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* Lugares */}
        {places.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--navy)',marginBottom:16}}>Lugares</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
              {places.map((p:any)=>(
                <div key={p.id} style={{background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)',borderTop:`3px solid ${p.visited?'#4a7c59':'var(--border)'}`}}>
                  <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{p.name}</div>
                  <div style={{fontSize:11,color:'var(--text-light)',marginTop:2}}>📍 {p.type}</div>
                  {p.rating>0&&<div style={{color:'#b87333',fontSize:12,marginTop:6}}>{[1,2,3,4,5].map(n=><span key={n} style={{opacity:n<=p.rating?1:0.2}}>★</span>)}</div>}
                  {p.lat&&p.lng&&<a href={`https://maps.google.com/?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#4a7fa5',textDecoration:'none',marginTop:6,display:'inline-block'}}>📍 Ver en GPS</a>}
                  {p.visited&&<div style={{fontSize:11,color:'#4a7c59',marginTop:4,fontWeight:600}}>✓ Visitado</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gastos */}
        {items?.expenses?.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--navy)',marginBottom:16}}>Presupuesto</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[{l:'Estimado',v:fmt(est,trip.currency),c:'#4a7fa5'},{l:'Real',v:fmt(real,trip.currency),c:'#4a7c59'},{l:'Diferencia',v:`${real-est>0?'+':''}${fmt(real-est,trip.currency)}`,c:real-est>0?'#c45c5c':'#4a7c59'}]
                .map((s,i)=>(
                  <div key={i} style={{background:'var(--bg-card)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)',textAlign:'center'}}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:6}}>{s.l}</div>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:s.c}}>{s.v}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:'center',paddingTop:32,borderTop:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:300,color:'var(--navy)',marginBottom:8}}>Wander<em style={{color:'#b87333',fontStyle:'italic'}}>Kit</em></div>
          <div style={{fontSize:12,color:'var(--text-light)',marginBottom:16}}>Planifica, ejecuta y recuerda cada aventura</div>
          <a href="/" style={{padding:'10px 24px',background:'#b87333',color:'white',borderRadius:10,fontSize:13,fontWeight:600,textDecoration:'none',display:'inline-block'}}>Crear mi viaje →</a>
        </div>
      </div>
    </div>
  )
}