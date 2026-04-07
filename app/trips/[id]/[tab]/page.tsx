'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useParams } from 'next/navigation'
import { useTripContext } from '@/lib/context/TripContext'
import axios from 'axios'

const fmt = (n: number, cur = 'USD') =>
  !n && n !== 0 ? '—' : new Intl.NumberFormat('es-CL',{style:'currency',currency:cur,maximumFractionDigits:0}).format(n)

/* ── TOAST ── */
type TT = 'success'|'error'|'info'
let _tid = 0, _add: ((m:string,t:TT)=>void)|null = null
const toast = (m:string, t:TT='success') => _add?.(m,t)

function Toasts() {
  const [list,setList] = useState<{id:number,msg:string,type:TT,out?:boolean}[]>([])
  const add = useCallback((msg:string,type:TT)=>{
    const id=++_tid; setList(l=>[...l,{id,msg,type}])
    setTimeout(()=>{ setList(l=>l.map(x=>x.id===id?{...x,out:true}:x)); setTimeout(()=>setList(l=>l.filter(x=>x.id!==id)),300) },3500)
  },[])
  useEffect(()=>{ _add=add; return()=>{ _add=null } },[add])
  return (
    <div className="toast-container">
      {list.map(t=><div key={t.id} className={`toast ${t.type}${t.out?' leaving':''}`}><span>{t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'}</span>{t.msg}</div>)}
    </div>
  )
}

/* ── ANIMATED NUMBER ── */
function AN({ value, dur=800 }: { value:number, dur?:number }) {
  const [d,setD] = useState(0); const fr = useRef<number|undefined>(undefined)
  useEffect(()=>{
    const s=performance.now()
    const run=(n:number)=>{ const p=Math.min((n-s)/dur,1); setD(Math.round(value*(1-Math.pow(1-p,3)))); if(p<1)fr.current=requestAnimationFrame(run) }
    fr.current=requestAnimationFrame(run); return()=>{ if(fr.current)cancelAnimationFrame(fr.current) }
  },[value,dur])
  return <>{d}</>
}

/* ── LAZY MAP — solo carga el iframe cuando entra en viewport ── */
function LazyMap({ lat, lng, active, onActivate }: { lat:number, lng:number, active:boolean, onActivate:()=>void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(()=>{
    const obs = new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting) { setVisible(true); obs.disconnect() }
    },{ threshold:0.1 })
    if(ref.current) obs.observe(ref.current)
    return()=>obs.disconnect()
  },[])

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`

  return (
    <div ref={ref} style={{position:'relative',height:130,overflow:'hidden',cursor:'pointer'}} onClick={onActivate}>
      {visible ? (
        <iframe src={src} style={{width:'100%',height:'100%',border:'none',pointerEvents:active?'auto':'none'}} loading="lazy" />
      ) : (
        <div style={{width:'100%',height:'100%',background:'var(--bg-cream-dark)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="skeleton" style={{position:'absolute',inset:0,borderRadius:0}} />
        </div>
      )}
      {!active&&visible&&(
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.12)'}}>
          <span style={{background:'white',borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:600,color:'#1a2744'}}>🗺️ Ver mapa</span>
        </div>
      )}
    </div>
  )
}

/* ── SHARED UI ── */
const Modal = memo(({ title, onClose, children }: any) => {
  useEffect(()=>{ document.body.style.overflow='hidden'; return()=>{ document.body.style.overflow='' } },[])
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(8,14,28,0.75)',backdropFilter:'blur(12px)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:2000,padding:'20px',overflowY:'auto'}} onClick={onClose}>
      <div style={{background:'var(--bg)',borderRadius:20,padding:'32px 36px',width:'100%',maxWidth:580,marginTop:'auto',marginBottom:'auto',border:'1px solid var(--border)',position:'relative'}} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,width:28,height:28,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--bg-cream)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'var(--text-light)'}}>✕</button>
        <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:26,fontWeight:300,color:'var(--navy)',marginBottom:22,paddingRight:32}}>{title}</div>
        {children}
      </div>
    </div>
  )
})
Modal.displayName='Modal'

const FG = memo(({ label, children }: any) => (
  <div style={{marginBottom:14}}>
    <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--text-mid)',marginBottom:6}}>{label}</label>
    {children}
  </div>
))
FG.displayName='FG'

const Btn = ({ onClick, primary, disabled, loading, children, style={} }: any) => (
  <button onClick={onClick} disabled={disabled||loading} style={{padding:primary?'10px 20px':'10px 16px',background:primary?(disabled||loading?'rgba(184,115,51,0.5)':'#b87333'):'transparent',color:primary?'white':'var(--text-mid)',border:primary?'none':'1px solid var(--border)',borderRadius:10,fontSize:13,fontWeight:600,cursor:(disabled||loading)?'not-allowed':'pointer',fontFamily:'DM Sans,sans-serif',boxShadow:primary&&!disabled?'0 4px 16px rgba(184,115,51,0.28)':'none',transition:'all 0.15s',display:'inline-flex',alignItems:'center',gap:6,opacity:(disabled&&!loading)?0.6:1,...style}}>
    {loading?'⏳ Guardando...':children}
  </button>
)

const IBtn = ({ onClick, color, children }: any) => (
  <button onClick={onClick} style={{width:30,height:30,borderRadius:8,border:'1px solid var(--border)',background:'var(--bg-card)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:color||'var(--text-mid)',transition:'all 0.15s',flexShrink:0}}>
    {children}
  </button>
)

const Empty = ({ icon, title, sub }: any) => (
  <div style={{textAlign:'center',padding:'60px 20px',background:'var(--bg-card)',borderRadius:16,border:'1px dashed var(--border)',marginBottom:24}}>
    <div style={{fontSize:36,opacity:0.2,marginBottom:12}}>{icon}</div>
    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:300,color:'var(--navy)',marginBottom:6}}>{title}</div>
    <div style={{fontSize:13,color:'var(--text-light)'}}>{sub}</div>
  </div>
)

const ErrMsg = ({ msg }: { msg:string }) => !msg ? null : (
  <div style={{padding:'10px 14px',background:'rgba(196,92,92,0.08)',border:'1px solid rgba(196,92,92,0.2)',borderRadius:10,fontSize:13,color:'#c45c5c',marginBottom:14}}>{msg}</div>
)

const Skel = ({ h=80 }: { h?:number }) => <div className="skeleton" style={{height:h,borderRadius:14,marginBottom:10}} />

/* ── MAIN PAGE ── */
export default function TabPage() {
  const params  = useParams()
  const tripId  = params.id as string
  const tab     = params.tab as string
  const [trip, setTrip] = useState<any>(null)

  // Usar Context en vez de useTripItems — datos compartidos entre tabs, sin refetch al navegar
  const { items, loading, addItem, updateItem, deleteItem } = useTripContext()

  useEffect(()=>{
    axios.get('/api/trips')
      .then(r=>setTrip(r.data.find((t:any)=>t.id===tripId)||null))
      .catch(()=>toast('Error cargando datos del viaje','error'))
  },[tripId])

  const add = useCallback(async(type:string,data:any)=>{ await addItem(type,data); toast('Agregado correctamente') },[addItem])
  const upd = useCallback(async(type:string,data:any)=>{ await updateItem(type,data); toast('Guardado') },[updateItem])
  const del = useCallback(async(type:string,id:string)=>{ await deleteItem(type,id); toast('Eliminado','info') },[deleteItem])

  return (
    <div className="tab-content-responsive fade-in" style={{padding:'32px 44px 64px'}}>
      <Toasts />
      {loading ? (
        <>{[1,2,3,4].map(i=><Skel key={i} h={i===1?180:90} />)}</>
      ) : (
        <>
          {tab==='overview'  && <TabOverview   trip={trip} items={items} />}
          {tab==='flights'   && <TabFlights    trip={trip} items={items} add={add} upd={upd} del={del} />}
          {tab==='itinerary' && <TabItinerary  trip={trip} items={items} add={add} upd={upd} del={del} />}
          {tab==='expenses'  && <TabExpenses   trip={trip} items={items} add={add} upd={upd} del={del} />}
          {tab==='places'    && <TabPlaces     trip={trip} items={items} add={add} upd={upd} del={del} />}
          {tab==='documents' && <TabDocuments  trip={trip} items={items} add={add} upd={upd} del={del} />}
          {tab==='checklist' && <TabChecklist  trip={trip} items={items} add={add} upd={upd} del={del} />}
          {tab==='proposals' && <TabProposals  trip={trip} items={items} add={add} upd={upd} del={del} />}
          {tab==='journal'   && <TabJournal    trip={trip} items={items} add={add} upd={upd} del={del} />}
          {tab==='summary'   && <TabSummary    trip={trip} items={items} />}
        </>
      )}
    </div>
  )
}

/* ── OVERVIEW ── */
function TabOverview({ trip, items }: any) {
  const est  = items?.expenses?.reduce((s:number,e:any)=>s+(e.estimated||0),0)||0
  const real = items?.expenses?.reduce((s:number,e:any)=>s+(e.real||0),0)||0
  const budget = trip?.budget||est||1
  const pct  = Math.min(120,Math.round(real/budget*100))
  const diff = real-est
  const done = items?.itinerary?.filter((a:any)=>a.status==='realizado').length||0
  const acts = items?.itinerary?.length||0
  const vis  = items?.places?.filter((p:any)=>p.visited).length||0
  const ck   = items?.checklist?.filter((i:any)=>i.checked).length||0
  const ckT  = items?.checklist?.length||0
  const fl   = items?.flights?.length||0

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
      <div className="fade-up" style={{gridColumn:'1/-1',background:'var(--bg-card)',borderRadius:16,padding:'26px 30px',border:'1px solid var(--border)',boxShadow:'var(--shadow-card)'}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:18}}>Presupuesto — Plan vs Real</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:real>0?20:0}}>
          {[
            {label:'Estimado',value:fmt(est||budget,trip?.currency),acc:'#4a7fa5',bg:'rgba(74,127,165,0.05)',br:'rgba(74,127,165,0.15)'},
            {label:'Real gastado',value:fmt(real,trip?.currency),acc:'#4a7c59',bg:'rgba(74,124,89,0.05)',br:'rgba(74,124,89,0.15)'},
            {label:'Diferencia',value:`${diff>0?'+':''}${fmt(diff,trip?.currency)}`,acc:diff>0?'#c45c5c':'#4a7c59',bg:diff>0?'rgba(196,92,92,0.05)':'rgba(74,124,89,0.05)',br:diff>0?'rgba(196,92,92,0.15)':'rgba(74,124,89,0.15)'},
          ].map((c,i)=>(
            <div key={i} style={{padding:'14px 16px',borderRadius:12,background:c.bg,border:`1px solid ${c.br}`}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:c.acc,marginBottom:8}}>{c.label}</div>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:300,color:'var(--navy)',lineHeight:1}}>{c.value}</div>
            </div>
          ))}
        </div>
        {real>0&&(
          <>
            <div style={{background:'var(--bg-cream-dark)',borderRadius:4,height:5,overflow:'hidden'}}>
              <div style={{width:`${Math.min(100,pct)}%`,height:'100%',borderRadius:4,background:pct>100?'#c45c5c':pct>80?'#b87333':'#4a7c59',transition:'width 1s cubic-bezier(0.16,1,0.3,1)'}} />
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'var(--text-light)'}}>
              <span><AN value={pct} />% del presupuesto</span>
              <span style={{fontWeight:600,color:diff>0?'#c45c5c':'#4a7c59'}}>{diff>0?`+${fmt(diff)} sobre estimado`:diff<0?`${fmt(Math.abs(diff))} ahorrado`:'Exacto al estimado'}</span>
            </div>
          </>
        )}
      </div>
      {[
        {label:'Vuelos',num:fl,total:null,color:'#4a7fa5',sub:'registrados'},
        {label:'Actividades',num:done,total:acts,color:'#4a7fa5',sub:'realizadas'},
        {label:'Lugares',num:vis,total:items?.places?.length||0,color:'#4a7c59',sub:'visitados'},
        {label:'Equipaje',num:ck,total:ckT,color:'#b87333',sub:'ítems listos'},
      ].map((it,i)=>(
        <div key={i} style={{background:'var(--bg-card)',borderRadius:16,padding:'22px 24px',border:'1px solid var(--border)',boxShadow:'var(--shadow-card)'}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:14}}>{it.label}</div>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:48,fontWeight:300,color:'var(--navy)',lineHeight:1}}>
            <AN value={it.num} />{it.total!==null&&<span style={{fontSize:26,color:'var(--text-light)'}}>/{it.total}</span>}
          </div>
          <div style={{fontSize:12,color:'var(--text-light)',marginTop:5}}>{it.sub}</div>
          {it.total!==null&&it.total>0&&(
            <div style={{background:'var(--bg-cream-dark)',borderRadius:3,height:4,overflow:'hidden',marginTop:14}}>
              <div style={{width:`${Math.round(it.num/it.total*100)}%`,height:'100%',borderRadius:3,background:it.color,transition:'width 1s cubic-bezier(0.16,1,0.3,1)'}} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── FLIGHTS ── */
function TabFlights({ trip, items, add, upd, del }: any) {
  const [modal,setModal] = useState(false)
  const [editing,setEditing] = useState<any>(null)
  const flights = items?.flights||[]
  const ida = flights.filter((f:any)=>f.type==='ida')
  const reg = flights.filter((f:any)=>f.type==='regreso')

  const FlightCard = ({ f }: { f:any }) => (
    <div style={{background:'var(--bg-card)',borderRadius:16,border:'1px solid var(--border)',padding:'20px 24px',marginBottom:12,boxShadow:'var(--shadow-card)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <span style={{padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:700,background:f.type==='ida'?'rgba(74,127,165,0.1)':'rgba(74,124,89,0.1)',color:f.type==='ida'?'#4a7fa5':'#4a7c59'}}>
            {f.type==='ida'?'✈️ Ida':'🔄 Regreso'}
          </span>
          {f.airline&&<span style={{fontSize:13,color:'var(--text-mid)',fontWeight:500}}>{f.airline} {f.flight_number}</span>}
          {f.price&&<span style={{fontSize:14,fontWeight:600,color:'var(--navy)',fontFamily:'Cormorant Garamond,serif'}}>{fmt(f.price,trip?.currency)}{f.persons>1&&<span style={{fontSize:11,color:'var(--text-light)',fontFamily:'DM Sans,sans-serif'}}> · {fmt(f.price/f.persons,trip?.currency)}/p</span>}</span>}
        </div>
        <div style={{display:'flex',gap:6}}>
          <IBtn onClick={()=>{setEditing(f);setModal(true)}}>✏️</IBtn>
          <IBtn onClick={()=>del('flights',f.id)} color="#c45c5c">🗑</IBtn>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:f.has_layover?16:0,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:100}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:26,fontWeight:300,color:'var(--navy)'}}>{f.origin_airport||'—'}</div>
          <div style={{fontSize:12,color:'var(--text-mid)',marginTop:2}}>{f.origin_city}</div>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginTop:4}}>{f.departure_date} · {f.departure_time}</div>
        </div>
        <div style={{textAlign:'center',flex:'0 0 60px'}}>
          <div style={{fontSize:18}}>{f.has_layover?'🛫':'✈️'}</div>
          <div style={{height:1,background:'var(--border)',margin:'6px 0'}} />
          <div style={{fontSize:10,color:'var(--text-light)'}}>{f.has_layover?`via ${f.layover_airport||'escala'}`:'directo'}</div>
        </div>
        <div style={{flex:1,textAlign:'right',minWidth:100}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:26,fontWeight:300,color:'var(--navy)'}}>{f.has_layover?(f.layover_airport||'—'):f.destination_airport||'—'}</div>
          <div style={{fontSize:12,color:'var(--text-mid)',marginTop:2}}>{f.has_layover?(f.layover_city||'Escala'):f.destination_city}</div>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginTop:4}}>{f.has_layover?f.layover_arrival_time:(f.arrival_date+' · '+f.arrival_time)}</div>
        </div>
      </div>
      {f.has_layover===1&&(
        <>
          <div style={{padding:'10px 14px',background:'rgba(184,115,51,0.06)',border:'1px solid rgba(184,115,51,0.15)',borderRadius:10,fontSize:12,color:'var(--text-mid)',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            🕐 Escala en {f.layover_airport||'—'}{f.layover_duration?` · ${f.layover_duration}`:''}{f.layover_departure_time?` · Sale: ${f.layover_departure_time}`:''}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:100}}>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:300,color:'var(--navy)'}}>{f.layover_airport||'—'}</div>
              <div style={{fontSize:12,color:'var(--text-mid)',marginTop:2}}>{f.layover_city}</div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginTop:4}}>{f.layover_departure_time}</div>
            </div>
            <div style={{textAlign:'center',flex:'0 0 60px'}}><div style={{fontSize:16}}>✈️</div><div style={{height:1,background:'var(--border)',margin:'6px 0'}} /></div>
            <div style={{flex:1,textAlign:'right',minWidth:100}}>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:300,color:'var(--navy)'}}>{f.destination_airport||'—'}</div>
              <div style={{fontSize:12,color:'var(--text-mid)',marginTop:2}}>{f.destination_city}</div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginTop:4}}>{f.arrival_date} · {f.arrival_time}</div>
            </div>
          </div>
        </>
      )}
      {f.notes&&<div style={{marginTop:12,fontSize:12,color:'var(--text-light)',fontStyle:'italic',borderTop:'1px solid var(--border)',paddingTop:10}}>{f.notes}</div>}
    </div>
  )

  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div style={{fontSize:13,color:'var(--text-mid)'}}>{flights.length} vuelo{flights.length!==1?'s':''} registrado{flights.length!==1?'s':''}</div>
        <Btn onClick={()=>{setEditing(null);setModal(true)}} primary>＋ Agregar vuelo</Btn>
      </div>
      {flights.length===0&&<Empty icon="✈️" title="Sin vuelos registrados" sub="Agrega los detalles de tu vuelo de ida y regreso" />}
      {ida.length>0&&(<div style={{marginBottom:28}}><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:12}}>Vuelo de ida</div>{ida.map((f:any)=><FlightCard key={f.id} f={f} />)}</div>)}
      {reg.length>0&&(<div><div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:12}}>Vuelo de regreso</div>{reg.map((f:any)=><FlightCard key={f.id} f={f} />)}</div>)}
      {modal&&(
        <Modal title={editing?'Editar vuelo':'Nuevo vuelo'} onClose={()=>{setModal(false);setEditing(null)}}>
          <FlightForm flight={editing} currency={trip?.currency} onSave={async(data:any)=>{
            editing?await upd('flights',{...editing,...data}):await add('flights',data)
            setModal(false);setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function FlightForm({ flight, currency, onSave }: any) {
  const [f,setF] = useState({
    type:flight?.type||'ida', airline:flight?.airline||'', flightNumber:flight?.flight_number||'',
    originAirport:flight?.origin_airport||'', originCity:flight?.origin_city||'',
    destinationAirport:flight?.destination_airport||'', destinationCity:flight?.destination_city||'',
    departureDate:flight?.departure_date||'', departureTime:flight?.departure_time||'',
    arrivalDate:flight?.arrival_date||'', arrivalTime:flight?.arrival_time||'',
    hasLayover:flight?.has_layover===1||false,
    layoverAirport:flight?.layover_airport||'', layoverCity:flight?.layover_city||'',
    layoverArrivalTime:flight?.layover_arrival_time||'',
    layoverDepartureTime:flight?.layover_departure_time||'',
    layoverDuration:flight?.layover_duration||'',
    price:flight?.price||'', persons:flight?.persons||1, notes:flight?.notes||'',
  })
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const s=(k:string,v:any)=>setF(p=>({...p,[k]:v}))
  const hk=(e:React.KeyboardEvent)=>{if(e.key==='Enter')e.preventDefault()}

  const handleSave = async() => {
    if(!f.originAirport&&!f.originCity){setError('Ingresa al menos el aeropuerto o ciudad de origen');return}
    setSaving(true);setError('')
    try{await onSave(f)}catch(e){setError('Error al guardar. Intenta nuevamente.');setSaving(false)}
  }

  return (
    <div>
      <ErrMsg msg={error} />
      <FG label="Tipo de vuelo">
        <select className="form-input" value={f.type} onChange={e=>s('type',e.target.value)}>
          <option value="ida">✈️ Vuelo de ida</option>
          <option value="regreso">🔄 Vuelo de regreso</option>
        </select>
      </FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Aerolínea"><input className="form-input" value={f.airline} onChange={e=>s('airline',e.target.value)} onKeyDown={hk} placeholder="LATAM, American..." /></FG>
        <FG label="N° vuelo"><input className="form-input" value={f.flightNumber} onChange={e=>s('flightNumber',e.target.value)} onKeyDown={hk} placeholder="LA800" /></FG>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label={`Precio total (${currency||'USD'})`}><input className="form-input" type="number" min="0" value={f.price} onChange={e=>s('price',e.target.value)} onKeyDown={hk} placeholder="0" /></FG>
        <FG label="N° personas">
          <select className="form-input" value={f.persons} onChange={e=>s('persons',parseInt(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n===1?'👤 1 persona':`👥 ${n} personas`}</option>)}
          </select>
        </FG>
      </div>
      {f.price&&f.persons>1&&(
        <div style={{padding:'8px 14px',background:'rgba(74,127,165,0.06)',border:'1px solid rgba(74,127,165,0.15)',borderRadius:10,fontSize:13,color:'var(--text-mid)',marginBottom:14}}>
          💡 Por persona: <strong style={{color:'var(--navy)'}}>{fmt(parseFloat(String(f.price))/f.persons,currency)}</strong>
        </div>
      )}
      <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-light)',margin:'16px 0 10px',paddingBottom:6,borderBottom:'1px solid var(--border)'}}>🛫 Origen</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Código aeropuerto"><input className="form-input" value={f.originAirport} onChange={e=>s('originAirport',e.target.value.toUpperCase())} onKeyDown={hk} placeholder="SCL" maxLength={4} /></FG>
        <FG label="Ciudad"><input className="form-input" value={f.originCity} onChange={e=>s('originCity',e.target.value)} onKeyDown={hk} placeholder="Santiago" /></FG>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Fecha salida"><input className="form-input" type="date" value={f.departureDate} onChange={e=>s('departureDate',e.target.value)} /></FG>
        <FG label="Hora salida"><input className="form-input" type="time" value={f.departureTime} onChange={e=>s('departureTime',e.target.value)} /></FG>
      </div>
      <div style={{margin:'16px 0',padding:'14px 16px',background:'var(--bg-cream)',borderRadius:12,border:'1px solid var(--border)'}}>
        <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',marginBottom:f.hasLayover?14:0}}>
          <input type="checkbox" checked={f.hasLayover} onChange={e=>s('hasLayover',e.target.checked)} style={{width:16,height:16}} />
          <span style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>🔀 Este vuelo tiene escala</span>
        </label>
        {f.hasLayover&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <FG label="Código aeropuerto escala"><input className="form-input" value={f.layoverAirport} onChange={e=>s('layoverAirport',e.target.value.toUpperCase())} onKeyDown={hk} placeholder="MIA" maxLength={4} /></FG>
              <FG label="Ciudad de escala"><input className="form-input" value={f.layoverCity} onChange={e=>s('layoverCity',e.target.value)} onKeyDown={hk} placeholder="Miami" /></FG>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <FG label="Llegada a escala"><input className="form-input" type="time" value={f.layoverArrivalTime} onChange={e=>s('layoverArrivalTime',e.target.value)} /></FG>
              <FG label="Salida de escala"><input className="form-input" type="time" value={f.layoverDepartureTime} onChange={e=>s('layoverDepartureTime',e.target.value)} /></FG>
              <FG label="Tiempo espera"><input className="form-input" value={f.layoverDuration} onChange={e=>s('layoverDuration',e.target.value)} onKeyDown={hk} placeholder="2h 30min" /></FG>
            </div>
          </>
        )}
      </div>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-light)',margin:'0 0 10px',paddingBottom:6,borderBottom:'1px solid var(--border)'}}>🛬 Destino final</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Código aeropuerto"><input className="form-input" value={f.destinationAirport} onChange={e=>s('destinationAirport',e.target.value.toUpperCase())} onKeyDown={hk} placeholder="GIG" maxLength={4} /></FG>
        <FG label="Ciudad"><input className="form-input" value={f.destinationCity} onChange={e=>s('destinationCity',e.target.value)} onKeyDown={hk} placeholder="Río de Janeiro" /></FG>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Fecha llegada"><input className="form-input" type="date" value={f.arrivalDate} onChange={e=>s('arrivalDate',e.target.value)} /></FG>
        <FG label="Hora llegada"><input className="form-input" type="time" value={f.arrivalTime} onChange={e=>s('arrivalTime',e.target.value)} /></FG>
      </div>
      <FG label="Notas (reserva, asiento, equipaje...)"><textarea className="form-input" rows={2} value={f.notes} onChange={e=>s('notes',e.target.value)} /></FG>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        <Btn onClick={handleSave} primary loading={saving}>{flight?'Guardar cambios':'Agregar vuelo'}</Btn>
      </div>
    </div>
  )
}

/* ── ITINERARY ── */
function TabItinerary({ trip, items, add, upd, del }: any) {
  const [modal,setModal] = useState(false)
  const [editing,setEditing] = useState<any>(null)
  const itin = items?.itinerary||[]
  const days = [...new Set(itin.map((a:any)=>a.day))].sort((a:any,b:any)=>a-b) as number[]
  if(!days.length) days.push(1)

  return (
    <div className="fade-in">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
          {[{c:itin.filter((a:any)=>a.status==='realizado').length,l:'realizadas',col:'#4a7c59'},
            {c:itin.filter((a:any)=>a.status==='pendiente').length,l:'pendientes',col:'#b87333'},
            {c:itin.filter((a:any)=>a.status==='cancelado').length,l:'canceladas',col:'#c45c5c'},
          ].map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'baseline',gap:5}}>
              <span style={{fontFamily:'Cormorant Garamond,serif',fontSize:30,fontWeight:300,color:s.col}}>{s.c}</span>
              <span style={{fontSize:12,color:'var(--text-light)'}}>{s.l}</span>
            </div>
          ))}
        </div>
        <Btn onClick={()=>{setEditing(null);setModal(true)}} primary>＋ Actividad</Btn>
      </div>
      {days.map(day=>{
        const acts=itin.filter((a:any)=>a.day===day).sort((a:any,b:any)=>(a.time||'').localeCompare(b.time||''))
        return (
          <div key={day} style={{marginBottom:36}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14,paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:400,color:'var(--navy)'}}>Día {day}</div>
              <div style={{fontSize:12,color:'var(--text-light)'}}>{acts.length} actividad{acts.length!==1?'es':''}</div>
            </div>
            {acts.map((a:any)=>(
              <div key={a.id} className="row-hover" style={{display:'flex',alignItems:'flex-start',gap:12,padding:'14px 18px',background:'var(--bg-card)',borderRadius:14,marginBottom:8,border:'1px solid var(--border)',boxShadow:'var(--shadow-card)',borderLeft:`4px solid ${a.status==='realizado'?'#4a7c59':a.status==='cancelado'?'#c45c5c':'#b87333'}`,opacity:a.status==='cancelado'?0.6:1,transition:'all 0.15s'}}>
                <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,background:a.status==='realizado'?'rgba(74,124,89,0.1)':a.status==='cancelado'?'rgba(196,92,92,0.1)':'rgba(184,115,51,0.1)'}}>
                  {a.status==='realizado'?'✅':a.status==='cancelado'?'❌':'⏳'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{a.name}</div>
                  <div style={{display:'flex',gap:10,marginTop:3,fontSize:12,color:'var(--text-light)',flexWrap:'wrap'}}>
                    {a.time&&<span>🕐 {a.time}</span>}
                    {a.time_real&&<span style={{color:'#4a7c59',fontWeight:500}}>✅ {a.time_real}</span>}
                    <span style={{background:'var(--bg-cream-dark)',padding:'1px 7px',borderRadius:5,fontSize:10,fontWeight:600,textTransform:'uppercase'}}>{a.type}</span>
                  </div>
                  {a.note&&<div style={{marginTop:7,padding:'7px 10px',background:'var(--bg-cream)',borderRadius:8,borderLeft:'3px solid var(--border)',fontSize:13,color:'var(--text-mid)',fontStyle:'italic'}}>"{a.note}"</div>}
                </div>
                <div style={{display:'flex',gap:4,flexShrink:0}}>
                  {a.status!=='realizado'&&<IBtn onClick={()=>upd('itinerary',{...a,status:'realizado'})} color="#4a7c59">✓</IBtn>}
                  {a.status!=='cancelado'&&<IBtn onClick={()=>upd('itinerary',{...a,status:'cancelado'})} color="#c45c5c">✕</IBtn>}
                  {a.status!=='pendiente'&&<IBtn onClick={()=>upd('itinerary',{...a,status:'pendiente'})}>↺</IBtn>}
                  <IBtn onClick={()=>{setEditing(a);setModal(true)}}>✏️</IBtn>
                  <IBtn onClick={()=>del('itinerary',a.id)} color="#c45c5c">🗑</IBtn>
                </div>
              </div>
            ))}
          </div>
        )
      })}
      {modal&&(
        <Modal title={editing?'Editar actividad':'Nueva actividad'} onClose={()=>{setModal(false);setEditing(null)}}>
          <ActivityForm act={editing} onSave={async(data:any)=>{
            editing?await upd('itinerary',{...editing,...data}):await add('itinerary',data)
            setModal(false);setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function ActivityForm({ act, onSave }: any) {
  const [f,setF] = useState({name:act?.name||'',day:act?.day||1,time:act?.time||'',time_real:act?.time_real||'',type:act?.type||'actividades',status:act?.status||'pendiente',note:act?.note||''})
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const s=(k:string,v:any)=>setF(p=>({...p,[k]:v}))
  const hk=(e:React.KeyboardEvent)=>{if(e.key==='Enter')e.preventDefault()}
  const handleSave=async()=>{
    if(!f.name.trim()){setError('El nombre es requerido');return}
    setSaving(true);setError('')
    try{await onSave(f)}catch(e){setError('Error al guardar. Intenta nuevamente.');setSaving(false)}
  }
  return (
    <div>
      <ErrMsg msg={error} />
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e=>s('name',e.target.value)} onKeyDown={hk} autoFocus /></FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Día"><input className="form-input" type="number" min="1" value={f.day} onChange={e=>s('day',parseInt(e.target.value)||1)} onKeyDown={hk} /></FG>
        <FG label="Tipo">
          <select className="form-input" value={f.type} onChange={e=>s('type',e.target.value)}>
            {['actividades','alojamiento','transporte','comida','otros'].map(t=><option key={t}>{t}</option>)}
          </select>
        </FG>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Hora planificada"><input className="form-input" type="time" value={f.time} onChange={e=>s('time',e.target.value)} /></FG>
        <FG label="Hora real"><input className="form-input" type="time" value={f.time_real} onChange={e=>s('time_real',e.target.value)} /></FG>
      </div>
      <FG label="Estado">
        <select className="form-input" value={f.status} onChange={e=>s('status',e.target.value)}>
          <option value="pendiente">⏳ Pendiente</option>
          <option value="realizado">✅ Realizado</option>
          <option value="cancelado">❌ Cancelado</option>
        </select>
      </FG>
      <FG label="Notas"><textarea className="form-input" rows={3} value={f.note} onChange={e=>s('note',e.target.value)} /></FG>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        <Btn onClick={handleSave} primary loading={saving}>{act?'Guardar cambios':'Agregar'}</Btn>
      </div>
    </div>
  )
}

/* ── EXPENSES ── */
function TabExpenses({ trip, items, add, upd, del }: any) {
  const [modal,setModal] = useState(false)
  const [editing,setEditing] = useState<any>(null)
  const exp = items?.expenses||[]
  const CE: Record<string,string> = {alojamiento:'🏨',transporte:'✈️',comida:'🍽️',actividades:'🎭',compras:'🛍️',otros:'📌'}
  const est=exp.reduce((s:number,e:any)=>s+(e.estimated||0),0)
  const real=exp.reduce((s:number,e:any)=>s+(e.real||0),0)
  const diff=real-est

  return (
    <div className="fade-in">
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
        {[{l:'Estimado total',v:fmt(est,trip?.currency),c:'#4a7fa5'},{l:'Real gastado',v:fmt(real,trip?.currency),c:'#4a7c59'},{l:'Diferencia',v:`${diff>0?'+':''}${fmt(diff,trip?.currency)}`,c:diff>0?'#c45c5c':'#4a7c59'}]
          .map((s,i)=>(
            <div key={i} style={{background:'var(--bg-card)',borderRadius:14,padding:'18px 20px',border:'1px solid var(--border)',textAlign:'center'}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:8}}>{s.l}</div>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:300,color:s.c}}>{s.v}</div>
            </div>
          ))}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <Btn onClick={()=>{setEditing(null);setModal(true)}} primary>＋ Gasto</Btn>
      </div>
      {exp.length===0&&<Empty icon="💰" title="Sin gastos registrados" sub="Agrega tu primer gasto" />}
      {exp.map((e:any)=>{
        const d=(e.real||0)-(e.estimated||0)
        return (
          <div key={e.id} className="row-hover" style={{display:'flex',alignItems:'flex-start',gap:12,padding:'14px 18px',background:'var(--bg-card)',borderRadius:14,border:'1px solid var(--border)',marginBottom:8,flexWrap:'wrap'}}>
            <div style={{width:38,height:38,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,background:'var(--bg-cream)',flexShrink:0}}>{CE[e.category]||'📌'}</div>
            <div style={{flex:1,minWidth:120}}>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{e.name}</div>
              <div style={{fontSize:11,color:'var(--text-light)',marginTop:2,textTransform:'capitalize'}}>{e.category}</div>
              <div style={{display:'flex',gap:10,marginTop:3,flexWrap:'wrap'}}>
                {e.persons>1&&<span style={{fontSize:11,color:'var(--text-mid)'}}>👥 {e.persons}p · {fmt((e.real||0)/e.persons,trip?.currency)}/c/u</span>}
                {e.paid_by&&<span style={{fontSize:11,color:'var(--text-mid)'}}>💳 {e.paid_by}</span>}
              </div>
            </div>
            <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:9,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>Est.</div>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:16,color:'var(--text-light)'}}>{fmt(e.estimated,trip?.currency)}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:9,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>Real</div>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:18,color:'var(--navy)'}}>{e.real!=null?fmt(e.real,trip?.currency):'—'}</div>
              </div>
              {e.real!=null&&<span style={{padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:d>0?'rgba(196,92,92,0.1)':'rgba(74,124,89,0.1)',color:d>0?'#c45c5c':'#4a7c59'}}>{d>0?`+${fmt(d)}`:fmt(d)}</span>}
            </div>
            <div style={{display:'flex',gap:5}}>
              <IBtn onClick={()=>{setEditing(e);setModal(true)}}>✏️</IBtn>
              <IBtn onClick={()=>del('expenses',e.id)} color="#c45c5c">🗑</IBtn>
            </div>
          </div>
        )
      })}
      {modal&&(
        <Modal title={editing?'Editar gasto':'Nuevo gasto'} onClose={()=>{setModal(false);setEditing(null)}}>
          <ExpenseForm exp={editing} currency={trip?.currency} onSave={async(data:any)=>{
            editing?await upd('expenses',{...editing,...data}):await add('expenses',data)
            setModal(false);setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function ExpenseForm({ exp, currency, onSave }: any) {
  const [f,setF] = useState({name:exp?.name||'',category:exp?.category||'otros',estimated:exp?.estimated??'',real:exp?.real??'',persons:exp?.persons||1,paidBy:exp?.paid_by||''})
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const s=(k:string,v:any)=>setF(p=>({...p,[k]:v}))
  const hk=(e:React.KeyboardEvent)=>{if(e.key==='Enter')e.preventDefault()}
  const handleSave=async()=>{
    if(!f.name.trim()){setError('La descripción es requerida');return}
    setSaving(true);setError('')
    try{await onSave({...f,estimated:f.estimated!==''?parseFloat(f.estimated as string):null,real:f.real!==''?parseFloat(f.real as string):null})}
    catch(e){setError('Error al guardar. Intenta nuevamente.');setSaving(false)}
  }
  return (
    <div>
      <ErrMsg msg={error} />
      <FG label="Descripción"><input className="form-input" value={f.name} onChange={e=>s('name',e.target.value)} onKeyDown={hk} autoFocus /></FG>
      <FG label="Categoría">
        <select className="form-input" value={f.category} onChange={e=>s('category',e.target.value)}>
          {['alojamiento','transporte','comida','actividades','compras','otros'].map(c=><option key={c}>{c}</option>)}
        </select>
      </FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label={`Estimado (${currency})`}><input className="form-input" type="number" min="0" value={f.estimated} onChange={e=>s('estimated',e.target.value)} onKeyDown={hk} /></FG>
        <FG label={`Real (${currency})`}><input className="form-input" type="number" min="0" value={f.real} onChange={e=>s('real',e.target.value)} onKeyDown={hk} placeholder="Vacío si no se sabe" /></FG>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="N° personas">
          <select className="form-input" value={f.persons} onChange={e=>s('persons',parseInt(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n===1?'👤 1 persona':`👥 ${n} personas`}</option>)}
          </select>
        </FG>
        <FG label="¿Quién pagó?"><input className="form-input" value={f.paidBy} onChange={e=>s('paidBy',e.target.value)} onKeyDown={hk} placeholder="Ej: Ezequiel" /></FG>
      </div>
      {f.persons>1&&f.real!==''&&(
        <div style={{padding:'8px 12px',background:'rgba(74,127,165,0.06)',border:'1px solid rgba(74,127,165,0.15)',borderRadius:10,fontSize:13,color:'var(--text-mid)',marginBottom:10}}>
          💡 Por persona: <strong style={{color:'var(--navy)'}}>{fmt(parseFloat(f.real as string)/f.persons,currency)}</strong>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        <Btn onClick={handleSave} primary loading={saving}>{exp?'Guardar':'Agregar'}</Btn>
      </div>
    </div>
  )
}

/* ── PLACES — con LazyMap ── */
function TabPlaces({ trip, items, add, upd, del }: any) {
  const [modal,setModal] = useState(false)
  const [editing,setEditing] = useState<any>(null)
  const [activeMap,setActiveMap] = useState<string|null>(null)
  const places = items?.places||[]

  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:22,flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{fontFamily:'Cormorant Garamond,serif',fontSize:34,fontWeight:300,color:'var(--navy)'}}><AN value={places.filter((p:any)=>p.visited).length} /></span>
          <span style={{fontSize:13,color:'var(--text-light)'}}>/ {places.length} visitados</span>
        </div>
        <Btn onClick={()=>{setEditing(null);setModal(true)}} primary>＋ Lugar</Btn>
      </div>
      {places.length===0&&<Empty icon="📍" title="Sin lugares" sub="Agrega los destinos que quieres visitar" />}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:14}}>
        {places.map((p:any)=>(
          <div key={p.id} style={{background:'var(--bg-card)',borderRadius:16,border:'1px solid var(--border)',overflow:'hidden',boxShadow:'var(--shadow-card)',borderTop:`4px solid ${p.visited?'#4a7c59':'var(--border)'}`}}>
            {p.lat&&p.lng&&(
              <LazyMap
                lat={p.lat} lng={p.lng}
                active={activeMap===p.id}
                onActivate={()=>setActiveMap(activeMap===p.id?null:p.id)}
              />
            )}
            <div style={{padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{p.name}</div>
                  <div style={{fontSize:11,color:'var(--text-light)',marginTop:2}}>📍 {p.type}</div>
                  {p.lat&&p.lng&&<a href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=15/${p.lat}/${p.lng}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#4a7fa5',textDecoration:'none',marginTop:3,display:'inline-block'}}>🔗 Abrir en mapa</a>}
                </div>
                <IBtn onClick={()=>{setEditing(p);setModal(true)}}>✏️</IBtn>
              </div>
              {p.note&&<div style={{fontSize:12,color:'var(--text-mid)',marginTop:7,fontStyle:'italic',lineHeight:1.5}}>{p.note}</div>}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderTop:'1px solid var(--border)',background:'var(--bg-cream)'}}>
              <div style={{color:'#b87333',fontSize:14,letterSpacing:2}}>
                {[1,2,3,4,5].map(n=><span key={n} style={{opacity:n<=p.rating?1:0.18,cursor:'pointer'}} onClick={()=>upd('places',{...p,rating:n})}>★</span>)}
              </div>
              <div style={{display:'flex',gap:7,alignItems:'center'}}>
                <span onClick={()=>upd('places',{...p,visited:p.visited?0:1})} style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,cursor:'pointer',transition:'all 0.15s',background:p.visited?'rgba(74,124,89,0.12)':'rgba(138,138,170,0.08)',color:p.visited?'#4a7c59':'var(--text-light)'}}>
                  {p.visited?'✓ Visitado':'No visitado'}
                </span>
                <IBtn onClick={()=>del('places',p.id)} color="#c45c5c">🗑</IBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal&&(
        <Modal title={editing?'Editar lugar':'Nuevo lugar'} onClose={()=>{setModal(false);setEditing(null)}}>
          <PlaceForm place={editing} onSave={async(data:any)=>{
            editing?await upd('places',{...editing,...data}):await add('places',data)
            setModal(false);setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function PlaceForm({ place, onSave }: any) {
  const [f,setF] = useState({name:place?.name||'',type:place?.type||'Atracción',note:place?.note||'',rating:place?.rating||0,visited:place?.visited||0,lat:place?.lat||'',lng:place?.lng||''})
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const s=(k:string,v:any)=>setF(p=>({...p,[k]:v}))
  const hk=(e:React.KeyboardEvent)=>{if(e.key==='Enter')e.preventDefault()}
  const handleSave=async()=>{
    if(!f.name.trim()){setError('El nombre es requerido');return}
    setSaving(true);setError('')
    try{await onSave({...f,lat:f.lat?parseFloat(String(f.lat)):null,lng:f.lng?parseFloat(String(f.lng)):null})}
    catch(e){setError('Error al guardar. Intenta nuevamente.');setSaving(false)}
  }
  return (
    <div>
      <ErrMsg msg={error} />
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e=>s('name',e.target.value)} onKeyDown={hk} autoFocus /></FG>
      <FG label="Tipo"><input className="form-input" value={f.type} onChange={e=>s('type',e.target.value)} onKeyDown={hk} placeholder="Monumento, Playa, Restaurante..." /></FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Latitud"><input className="form-input" type="number" step="any" value={f.lat} onChange={e=>s('lat',e.target.value)} placeholder="-22.9519" /></FG>
        <FG label="Longitud"><input className="form-input" type="number" step="any" value={f.lng} onChange={e=>s('lng',e.target.value)} placeholder="-43.2105" /></FG>
      </div>
      {f.lat&&f.lng&&<div style={{marginBottom:12,borderRadius:10,overflow:'hidden',height:140,border:'1px solid var(--border)'}}><iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(String(f.lng))-0.01},${parseFloat(String(f.lat))-0.01},${parseFloat(String(f.lng))+0.01},${parseFloat(String(f.lat))+0.01}&layer=mapnik&marker=${f.lat},${f.lng}`} style={{width:'100%',height:'100%',border:'none'}} loading="lazy" /></div>}
      <div style={{padding:'8px 12px',background:'rgba(74,127,165,0.06)',border:'1px solid rgba(74,127,165,0.15)',borderRadius:10,fontSize:12,color:'var(--text-mid)',marginBottom:12}}>
        💡 Busca en <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" style={{color:'#4a7fa5'}}>openstreetmap.org</a> → click derecho → copiar coordenadas.
      </div>
      <FG label="Nota personal"><textarea className="form-input" rows={2} value={f.note} onChange={e=>s('note',e.target.value)} /></FG>
      <FG label="Calificación">
        <div style={{display:'flex',gap:10}}>{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:26,cursor:'pointer',color:n<=f.rating?'#b87333':'var(--border)',transition:'all 0.15s'}} onClick={()=>s('rating',n)}>★</span>)}</div>
      </FG>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        <Btn onClick={handleSave} primary loading={saving}>{place?'Guardar':'Agregar'}</Btn>
      </div>
    </div>
  )
}

/* ── DOCUMENTS ── */
function TabDocuments({ trip, items, add, upd, del }: any) {
  const [modal,setModal] = useState(false)
  const [editing,setEditing] = useState<any>(null)
  const docs = items?.documents||[]
  const DI: Record<string,string> = {vuelo:'✈️',hotel:'🏨',seguro:'🛡️',tour:'🎟️',visa:'📋',otro:'📄'}
  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:18}}>
        <Btn onClick={()=>{setEditing(null);setModal(true)}} primary>＋ Documento</Btn>
      </div>
      {docs.length===0&&<Empty icon="📂" title="Sin documentos" sub="Agrega links a reservas, pasajes y seguros" />}
      {docs.map((d:any)=>(
        <div key={d.id} className="row-hover" style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',background:'var(--bg-card)',borderRadius:14,border:'1px solid var(--border)',marginBottom:8,flexWrap:'wrap'}}>
          <div style={{width:40,height:40,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,background:'var(--bg-cream)',flexShrink:0}}>{DI[d.type]||'📄'}</div>
          <div style={{flex:1,minWidth:100}}>
            <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{d.name}</div>
            <div style={{fontSize:11,color:'var(--text-light)',marginTop:1,textTransform:'capitalize'}}>{d.type}</div>
            {d.notes&&<div style={{fontSize:12,color:'var(--text-mid)',marginTop:2}}>{d.notes}</div>}
            {d.url&&<a href={d.url} target="_blank" rel="noreferrer" style={{fontSize:12,color:'#4a7fa5',textDecoration:'none',marginTop:3,display:'inline-flex',alignItems:'center',gap:4,fontWeight:500}}>🔗 Abrir enlace</a>}
          </div>
          <span style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:d.status==='activo'?'rgba(74,124,89,0.1)':'rgba(138,138,170,0.08)',color:d.status==='activo'?'#4a7c59':'var(--text-light)'}}>{d.status}</span>
          <div style={{display:'flex',gap:5}}>
            <IBtn onClick={()=>{setEditing(d);setModal(true)}}>✏️</IBtn>
            <IBtn onClick={()=>del('documents',d.id)} color="#c45c5c">🗑</IBtn>
          </div>
        </div>
      ))}
      {modal&&(
        <Modal title={editing?'Editar documento':'Nuevo documento'} onClose={()=>{setModal(false);setEditing(null)}}>
          <DocForm doc={editing} onSave={async(data:any)=>{
            editing?await upd('documents',{...editing,...data}):await add('documents',data)
            setModal(false);setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function DocForm({ doc, onSave }: any) {
  const [f,setF] = useState({name:doc?.name||'',type:doc?.type||'otro',url:doc?.url||'',status:doc?.status||'activo',notes:doc?.notes||''})
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const s=(k:string,v:any)=>setF(p=>({...p,[k]:v}))
  const hk=(e:React.KeyboardEvent)=>{if(e.key==='Enter')e.preventDefault()}
  const handleSave=async()=>{
    if(!f.name.trim()){setError('El nombre es requerido');return}
    setSaving(true);setError('')
    try{await onSave(f)}catch(e){setError('Error al guardar.');setSaving(false)}
  }
  return (
    <div>
      <ErrMsg msg={error} />
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e=>s('name',e.target.value)} onKeyDown={hk} autoFocus /></FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Tipo">
          <select className="form-input" value={f.type} onChange={e=>s('type',e.target.value)}>
            {['vuelo','hotel','seguro','tour','visa','otro'].map(t=><option key={t}>{t}</option>)}
          </select>
        </FG>
        <FG label="Estado">
          <select className="form-input" value={f.status} onChange={e=>s('status',e.target.value)}>
            <option value="activo">✅ Activo</option>
            <option value="usado">📌 Usado</option>
            <option value="vencido">⚫ Vencido</option>
          </select>
        </FG>
      </div>
      <FG label="URL"><input className="form-input" type="url" value={f.url} onChange={e=>s('url',e.target.value)} placeholder="https://..." /></FG>
      <FG label="Notas"><textarea className="form-input" rows={2} value={f.notes} onChange={e=>s('notes',e.target.value)} /></FG>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        <Btn onClick={handleSave} primary loading={saving}>{doc?'Guardar':'Agregar'}</Btn>
      </div>
    </div>
  )
}

/* ── CHECKLIST ── */
function TabChecklist({ trip, items, add, upd, del }: any) {
  const ck=items?.checklist||[]
  const cats=[...new Set(ck.map((i:any)=>i.category))] as string[]
  const done=ck.filter((i:any)=>i.checked).length
  const [newCat,setNewCat]=useState('')
  const [newTxt,setNewTxt]=useState('')
  const addI=async(cat:string)=>{ if(!newTxt.trim())return; await add('checklist',{category:cat,name:newTxt.trim(),checked:0}); setNewTxt('');setNewCat('') }

  return (
    <div className="fade-in">
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:8,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',alignItems:'baseline',gap:7}}>
          <span style={{fontFamily:'Cormorant Garamond,serif',fontSize:44,fontWeight:300,color:'var(--navy)',lineHeight:1}}><AN value={done} /></span>
          <span style={{fontSize:13,color:'var(--text-light)'}}>/ {ck.length} listos</span>
        </div>
        <span style={{fontSize:13,color:'var(--text-mid)',fontWeight:500}}>{ck.length>0?Math.round(done/ck.length*100):0}% empacado</span>
      </div>
      <div style={{background:'var(--bg-cream-dark)',borderRadius:4,height:5,overflow:'hidden',marginBottom:28}}>
        <div style={{width:ck.length>0?`${Math.round(done/ck.length*100)}%`:'0%',height:'100%',borderRadius:4,background:'#b87333',transition:'width 1s cubic-bezier(0.16,1,0.3,1)'}} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
        {cats.map(cat=>{
          const ci=ck.filter((i:any)=>i.category===cat); const cd=ci.filter((i:any)=>i.checked).length
          return (
            <div key={cat} style={{background:'var(--bg-card)',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden'}}>
              <div style={{padding:'11px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',background:cd===ci.length&&ci.length>0?'rgba(74,124,89,0.06)':undefined}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{cat}</div>
                <div style={{fontSize:11,color:'var(--text-light)',padding:'2px 9px',background:'var(--bg-cream)',borderRadius:20}}>{cd}/{ci.length}</div>
              </div>
              {ci.map((it:any)=>(
                <div key={it.id} className="row-hover" onClick={()=>upd('checklist',{...it,checked:it.checked?0:1})}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',borderBottom:'1px solid var(--border)',cursor:'pointer',opacity:it.checked?0.55:1,transition:'opacity 0.2s'}}>
                  <div style={{width:19,height:19,borderRadius:5,border:`2px solid ${it.checked?'#4a7c59':'var(--border)'}`,background:it.checked?'#4a7c59':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s'}}>
                    {it.checked&&<span style={{color:'white',fontSize:11,fontWeight:700}}>✓</span>}
                  </div>
                  <div style={{fontSize:13,color:'var(--text)',flex:1,textDecoration:it.checked?'line-through':'none'}}>{it.name}</div>
                  <button onClick={e=>{e.stopPropagation();del('checklist',it.id)}} style={{width:20,height:20,borderRadius:5,border:'1px solid var(--border)',background:'transparent',cursor:'pointer',fontSize:10,color:'#c45c5c',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
              ))}
              {newCat===cat?(
                <div style={{padding:'7px 12px',display:'flex',gap:7}}>
                  <input className="form-input" style={{flex:1,padding:'6px 10px',fontSize:13}} value={newTxt} onChange={e=>setNewTxt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addI(cat)}}} placeholder="Nuevo ítem..." autoFocus />
                  <button onClick={()=>addI(cat)} style={{padding:'6px 12px',background:'#b87333',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>+</button>
                  <button onClick={()=>{setNewCat('');setNewTxt('')}} style={{padding:'6px 10px',background:'transparent',color:'var(--text-light)',border:'1px solid var(--border)',borderRadius:8,fontSize:12,cursor:'pointer'}}>✕</button>
                </div>
              ):(
                <div style={{padding:'7px 16px'}}>
                  <button onClick={()=>{setNewCat(cat);setNewTxt('')}} style={{fontSize:12,color:'#b87333',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontWeight:500}}>＋ Agregar ítem</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── PROPOSALS ── */
function TabProposals({ trip, items, add, upd, del }: any) {
  const [modal,setModal]=useState(false)
  const props=items?.proposals||[]
  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <Btn onClick={()=>setModal(true)} primary>＋ Propuesta</Btn>
      </div>
      {props.length===0&&<Empty icon="🗳" title="Sin propuestas" sub="Agrega ideas para votar con tu grupo" />}
      {props.map((p:any)=>(
        <div key={p.id} style={{background:'var(--bg-card)',borderRadius:14,border:'1px solid var(--border)',padding:'20px 22px',marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{p.title}</div>
              {p.description&&<div style={{fontSize:13,color:'var(--text-mid)',marginTop:3,lineHeight:1.5}}>{p.description}</div>}
            </div>
            <IBtn onClick={()=>del('proposals',p.id)} color="#c45c5c">🗑</IBtn>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
            {[['si','👍 Sí','#4a7c59'],['quizas','🤔 Quizás','#b87333'],['no','👎 No','#c45c5c']].map(([v,l,c])=>(
              <button key={v} onClick={()=>upd('proposals',{...p,my_vote:p.my_vote===v?null:v})}
                style={{flex:1,minWidth:75,padding:'9px 8px',borderRadius:10,border:`1.5px solid ${p.my_vote===v?c:'var(--border)'}`,background:p.my_vote===v?`${c}14`:'var(--bg-input)',cursor:'pointer',fontSize:13,fontWeight:600,color:c,fontFamily:'DM Sans,sans-serif',transition:'all 0.2s'}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{padding:'8px 12px',borderRadius:10,fontSize:12,fontWeight:600,background:p.my_vote==='si'?'rgba(74,124,89,0.08)':p.my_vote==='no'?'rgba(196,92,92,0.08)':'rgba(184,115,51,0.08)',color:p.my_vote==='si'?'#4a7c59':p.my_vote==='no'?'#c45c5c':'#b87333',border:`1px solid ${p.my_vote==='si'?'rgba(74,124,89,0.18)':p.my_vote==='no'?'rgba(196,92,92,0.18)':'rgba(184,115,51,0.18)'}`}}>
            {p.my_vote==='si'?'👍 Aprobado por ti':p.my_vote==='no'?'👎 Rechazado por ti':'🤔 Sin decidir aún'}
          </div>
        </div>
      ))}
      {modal&&(
        <Modal title="Nueva propuesta" onClose={()=>setModal(false)}>
          <ProposalForm onSave={async(data:any)=>{await add('proposals',data);setModal(false)}} />
        </Modal>
      )}
    </div>
  )
}

function ProposalForm({ onSave }: any) {
  const [f,setF]=useState({title:'',description:''})
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const hk=(e:React.KeyboardEvent)=>{if(e.key==='Enter')e.preventDefault()}
  const handleSave=async()=>{
    if(!f.title.trim()){setError('El título es requerido');return}
    setSaving(true);setError('')
    try{await onSave(f)}catch(e){setError('Error al guardar.');setSaving(false)}
  }
  return (
    <div>
      <ErrMsg msg={error} />
      <FG label="Título"><input className="form-input" value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} onKeyDown={hk} autoFocus /></FG>
      <FG label="Descripción"><textarea className="form-input" rows={3} value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))} /></FG>
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
        <Btn onClick={handleSave} primary loading={saving}>Agregar</Btn>
      </div>
    </div>
  )
}

/* ── JOURNAL ── */
function TabJournal({ trip, items, add, upd, del }: any) {
  const [modal,setModal]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const journal=[...(items?.journal||[])].sort((a:any,b:any)=>a.day-b.day)
  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:24}}>
        <Btn onClick={()=>{setEditing(null);setModal(true)}} primary>＋ Entrada del diario</Btn>
      </div>
      {journal.length===0&&<Empty icon="📝" title="Tu diario está vacío" sub="Escribe sobre tus experiencias" />}
      <div style={{position:'relative',paddingLeft:28}}>
        <div style={{position:'absolute',left:8,top:8,bottom:8,width:1,background:'var(--border)'}} />
        {journal.map((e:any)=>(
          <div key={e.id} style={{position:'relative',marginBottom:20}}>
            <div style={{position:'absolute',left:-23,top:10,width:14,height:14,borderRadius:'50%',background:'#b87333',border:'3px solid var(--bg)',boxShadow:'0 0 0 3px rgba(184,115,51,0.2)'}} />
            <div style={{background:'var(--bg-card)',borderRadius:16,padding:'20px 22px',border:'1px solid var(--border)',boxShadow:'var(--shadow-card)',transition:'box-shadow 0.2s'}}
              onMouseEnter={el=>el.currentTarget.style.boxShadow='var(--shadow-hover)'}
              onMouseLeave={el=>el.currentTarget.style.boxShadow='var(--shadow-card)'}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:4}}>Día {e.day}{e.date?` · ${e.date}`:''}</div>
                  <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,color:'var(--navy)'}}>{e.title}</div>
                </div>
                <div style={{display:'flex',gap:5}}>
                  <IBtn onClick={()=>{setEditing(e);setModal(true)}}>✏️</IBtn>
                  <IBtn onClick={()=>del('journal',e.id)} color="#c45c5c">🗑</IBtn>
                </div>
              </div>
              <div style={{fontSize:14,lineHeight:1.8,color:'var(--text-mid)'}}>{e.text}</div>
              {e.rating>0&&<div style={{display:'flex',gap:3,marginTop:12,alignItems:'center'}}>{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:14,color:n<=e.rating?'#b87333':'var(--border)'}}>★</span>)}<span style={{fontSize:11,color:'var(--text-light)',marginLeft:6}}>{e.rating}/5</span></div>}
            </div>
          </div>
        ))}
      </div>
      {modal&&(
        <Modal title={editing?'Editar entrada':'Nueva entrada del diario'} onClose={()=>{setModal(false);setEditing(null)}}>
          <JournalForm entry={editing} onSave={async(data:any)=>{
            editing?await upd('journal',{...editing,...data}):await add('journal',data)
            setModal(false);setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function JournalForm({ entry, onSave }: any) {
  const [f,setF]=useState({day:entry?.day||1,date:entry?.date||'',title:entry?.title||'',text:entry?.text||'',rating:entry?.rating||0})
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const s=(k:string,v:any)=>setF(p=>({...p,[k]:v}))
  const hk=(e:React.KeyboardEvent)=>{if((e.target as HTMLElement).tagName!=='TEXTAREA'&&e.key==='Enter')e.preventDefault()}
  const handleSave=async()=>{
    if(!f.title.trim()){setError('El título es requerido');return}
    setSaving(true);setError('')
    try{await onSave(f)}catch(e){setError('Error al guardar.');setSaving(false)}
  }
  return (
    <div>
      <ErrMsg msg={error} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Día"><input className="form-input" type="number" min="1" value={f.day} onChange={e=>s('day',parseInt(e.target.value)||1)} onKeyDown={hk} /></FG>
        <FG label="Fecha"><input className="form-input" type="date" value={f.date} onChange={e=>s('date',e.target.value)} /></FG>
      </div>
      <FG label="Título del día"><input className="form-input" value={f.title} onChange={e=>s('title',e.target.value)} onKeyDown={hk} autoFocus /></FG>
      <FG label="¿Qué pasó?"><textarea className="form-input" rows={5} value={f.text} onChange={e=>s('text',e.target.value)} placeholder="Escribe libremente..." /></FG>
      <FG label="¿Cómo fue el día?">
        <div style={{display:'flex',gap:8}}>{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:28,cursor:'pointer',color:n<=f.rating?'#b87333':'var(--border)',transition:'all 0.15s'}} onClick={()=>s('rating',n)}>★</span>)}</div>
      </FG>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        <Btn onClick={handleSave} primary loading={saving}>{entry?'Guardar':'Escribir entrada'}</Btn>
      </div>
    </div>
  )
}

/* ── SUMMARY ── */
function TabSummary({ trip, items }: any) {
  const exp=items?.expenses||[],fl=items?.flights||[]
  const est=exp.reduce((s:number,e:any)=>s+(e.estimated||0),0)
  const real=exp.reduce((s:number,e:any)=>s+(e.real||0),0)
  const diff=real-est
  const done=items?.itinerary?.filter((a:any)=>a.status==='realizado')||[]
  const cancelled=items?.itinerary?.filter((a:any)=>a.status==='cancelado')||[]
  const vis=items?.places?.filter((p:any)=>p.visited)||[]
  const flIda=fl.find((f:any)=>f.type==='ida')
  const flReg=fl.find((f:any)=>f.type==='regreso')
  const insights:string[]=[]
  if(diff>0) insights.push(`Gastaste ${fmt(diff,trip?.currency)} más de lo estimado`)
  if(diff<0) insights.push(`¡Ahorraste ${fmt(Math.abs(diff),trip?.currency)} respecto al presupuesto! 🎉`)
  if(cancelled.length>0) insights.push(`Cancelaste ${cancelled.length} actividad${cancelled.length>1?'es':''}`)
  if(done.length>0) insights.push(`Completaste ${done.length} de ${items?.itinerary?.length||0} actividades`)

  return (
    <div className="fade-in">
      <div style={{textAlign:'center',padding:'40px 0 30px',marginBottom:28,borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:12}}>Resumen del viaje</div>
        <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:44,fontWeight:300,color:'var(--navy)',lineHeight:1}}>{trip?.name}</div>
        <div style={{fontSize:14,color:'var(--text-mid)',marginTop:8}}>{trip?.destination} · {trip?.start_date} → {trip?.end_date}</div>
        <button onClick={()=>window.print()} style={{marginTop:18,padding:'9px 20px',background:'transparent',border:'1px solid var(--border)',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'var(--text-mid)',display:'inline-flex',alignItems:'center',gap:6}}>🖨️ Exportar PDF</button>
      </div>
      {(flIda||flReg)&&(
        <div style={{background:'var(--bg-card)',borderRadius:16,padding:'20px 24px',border:'1px solid var(--border)',marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:14}}>Vuelos del viaje</div>
          {[flIda,flReg].filter(Boolean).map((f:any)=>(
            <div key={f.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'var(--bg-cream)',borderRadius:12,marginBottom:8,flexWrap:'wrap'}}>
              <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:f.type==='ida'?'rgba(74,127,165,0.1)':'rgba(74,124,89,0.1)',color:f.type==='ida'?'#4a7fa5':'#4a7c59'}}>{f.type==='ida'?'✈️ Ida':'🔄 Regreso'}</span>
              <div style={{flex:1,minWidth:140}}>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:16,color:'var(--navy)'}}>{f.origin_airport} → {f.has_layover?`${f.layover_airport} → `:''}{f.destination_airport}</div>
                <div style={{fontSize:12,color:'var(--text-mid)',marginTop:1}}>{f.origin_city} → {f.has_layover?`${f.layover_city} → `:''}{f.destination_city}</div>
              </div>
              <div style={{fontSize:12,color:'var(--text-mid)',textAlign:'right'}}>
                <div style={{fontWeight:600,color:'var(--text)'}}>{f.departure_date} · {f.departure_time}</div>
                <div style={{marginTop:1}}>Llega {f.arrival_date} · {f.arrival_time}</div>
                {f.airline&&<div style={{marginTop:1,color:'var(--text-light)'}}>{f.airline} {f.flight_number}</div>}
                {f.price&&<div style={{marginTop:1,color:'#b87333',fontWeight:600}}>{fmt(f.price,trip?.currency)}{f.persons>1?` · ${fmt(f.price/f.persons,trip?.currency)}/persona`:''}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
        {[
          {icon:'💰',title:'Gasto total',value:fmt(real,trip?.currency),detail:`${diff>0?'+':''}${fmt(diff)} vs estimado`,color:diff>0?'#c45c5c':'#4a7c59'},
          {icon:'📅',title:'Actividades',value:`${done.length}/${items?.itinerary?.length||0}`,detail:`${cancelled.length} canceladas`,color:'var(--text-mid)'},
          {icon:'📍',title:'Lugares visitados',value:`${vis.length}/${items?.places?.length||0}`,detail:'',color:'var(--text-mid)'},
          {icon:'📝',title:'Entradas en el diario',value:`${items?.journal?.length||0}`,detail:'días escritos',color:'var(--text-mid)'},
        ].map((it,i)=>(
          <div key={i} style={{background:'var(--bg-card)',borderRadius:16,padding:'22px 24px',border:'1px solid var(--border)',boxShadow:'var(--shadow-card)'}}>
            <div style={{fontSize:22,marginBottom:10}}>{it.icon}</div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:7}}>{it.title}</div>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:34,fontWeight:300,color:'var(--navy)',lineHeight:1}}>{it.value}</div>
            {it.detail&&<div style={{fontSize:13,color:it.color,marginTop:7,fontWeight:it.color!=='var(--text-mid)'?600:400}}>{it.detail}</div>}
          </div>
        ))}
      </div>
      {insights.length>0&&(
        <div style={{background:'var(--bg-card)',borderRadius:16,padding:'22px 26px',border:'1px solid var(--border)'}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:16}}>Insights del viaje</div>
          {insights.map((ins,i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'11px 0',borderBottom:i<insights.length-1?'1px solid var(--border)':'none',alignItems:'flex-start'}}>
              <span style={{color:'#b87333',fontSize:14,marginTop:2,flexShrink:0}}>→</span>
              <span style={{fontSize:14,color:'var(--text-mid)',lineHeight:1.6}}>{ins}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}