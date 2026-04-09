'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import { TripProvider } from '@/lib/context/TripContext'
import { signOut } from 'next-auth/react'
import { createPortal } from 'react-dom'

const COLORS = ['#b87333','#4a7c59','#4a7fa5','#8a5aaa','#c45c5c','#3a8a7c']
const TABS = [
  { id:'overview',   label:'Resumen'     },
  { id:'flights',    label:'✈️ Vuelos'   },
  { id:'itinerary',  label:'Itinerario'  },
  { id:'expenses',   label:'Gastos'      },
  { id:'places',     label:'Lugares'     },
  { id:'documents',  label:'Documentos'  },
  { id:'checklist',  label:'Equipaje'    },
  { id:'proposals',  label:'Propuestas'  },
  { id:'journal',    label:'Diario'      },
  { id:'summary',    label:'Post-viaje'  },
]
const fmt = (n: number, cur = 'USD') =>
  !n && n !== 0 ? '—' : new Intl.NumberFormat('es-CL',{style:'currency',currency:cur,maximumFractionDigits:0}).format(n)

type TT = 'success'|'error'|'info'
let _tid = 0
export let addToast: ((m:string,t:TT)=>void) = ()=>{}
export const toast = (m:string, t:TT='success') => addToast(m,t)

export function ToastContainer() {
  const [list, setList] = useState<{id:number,msg:string,type:TT,out?:boolean}[]>([])
  const add = useCallback((msg:string,type:TT)=>{
    const id=++_tid
    setList(l=>[...l,{id,msg,type}])
    setTimeout(()=>{
      setList(l=>l.map(x=>x.id===id?{...x,out:true}:x))
      setTimeout(()=>setList(l=>l.filter(x=>x.id!==id)),300)
    },3500)
  },[])
  useEffect(()=>{ addToast=add },[add])
  return (
    <div className="toast-container no-print">
      {list.map(t=>(
        <div key={t.id} className={`toast ${t.type}${t.out?' leaving':''}`}>
          <span style={{fontSize:15}}>{t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

function Modal({ title, onClose, children }: any) {
  const [mounted, setMounted] = useState(false)
  useEffect(()=>{ setMounted(true); document.body.style.overflow='hidden'; return()=>{ document.body.style.overflow='' } },[])
  if(!mounted) return null
  return createPortal(
    <div style={{position:'fixed',inset:0,background:'rgba(8,14,28,0.75)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:9999,padding:'20px',paddingTop:'80px',overflowY:'auto'}} onClick={onClose}>
      <div style={{background:'var(--bg)',borderRadius:20,padding:'32px 36px',width:'100%',maxWidth:580,marginBottom:'auto',border:'1px solid var(--border)',position:'relative'}} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,width:28,height:28,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--bg-cream)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'var(--text-light)'}}>✕</button>
        <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:26,fontWeight:300,color:'var(--navy)',marginBottom:22,paddingRight:32}}>{title}</div>
        {children}
      </div>
    </div>,
    document.body
  )
}

function FG({ label, children }: any) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--text-mid)',marginBottom:6}}>{label}</label>
      {children}
    </div>
  )
}

function EditTripModal({ trip, onClose, onSave }: any) {
  const [f,setF] = useState({
    name:trip.name||'', destination:trip.destination||'',
    startDate:trip.start_date||'', endDate:trip.end_date||'',
    budget:trip.budget||'', currency:trip.currency||'USD',
    status:trip.status||'planificado', colorIdx:trip.color_idx??0,
  })
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const s=(k:string,v:any)=>setF(p=>({...p,[k]:v}))
  const hk=(e:React.KeyboardEvent)=>{if(e.key==='Enter')e.preventDefault()}

  const handleSave = async () => {
    if(!f.name.trim()){setError('El nombre es requerido');return}
    setSaving(true); setError('')
    try { await onSave({...f,budget:parseFloat(String(f.budget))||0}) }
    catch(e) { setError('Error al guardar. Intenta nuevamente.'); setSaving(false) }
  }

  return (
    <Modal title="Editar viaje" onClose={onClose}>
      {error&&<div style={{padding:'10px 14px',background:'rgba(196,92,92,0.08)',border:'1px solid rgba(196,92,92,0.2)',borderRadius:10,fontSize:13,color:'#c45c5c',marginBottom:16}}>{error}</div>}
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e=>s('name',e.target.value)} onKeyDown={hk} autoFocus /></FG>
      <FG label="Destino"><input className="form-input" value={f.destination} onChange={e=>s('destination',e.target.value)} onKeyDown={hk} /></FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Fecha inicio"><input className="form-input" type="date" value={f.startDate} onChange={e=>{s('startDate',e.target.value);if(f.endDate&&f.endDate<e.target.value)s('endDate','')}} /></FG>
        <FG label="Fecha fin"><input className="form-input" type="date" value={f.endDate} min={f.startDate||undefined} onChange={e=>s('endDate',e.target.value)} /></FG>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FG label="Presupuesto"><input className="form-input" type="number" value={f.budget} onChange={e=>s('budget',e.target.value)} onKeyDown={hk} /></FG>
        <FG label="Moneda">
          <select className="form-input" value={f.currency} onChange={e=>s('currency',e.target.value)}>
            {['USD','EUR','CLP','BRL','ARS','MXN','GBP','PEN','COP'].map(c=><option key={c}>{c}</option>)}
          </select>
        </FG>
      </div>
      <FG label="Estado">
        <select className="form-input" value={f.status} onChange={e=>s('status',e.target.value)}>
          <option value="planificado">📋 Planificado</option>
          <option value="en curso">🟢 En Curso</option>
          <option value="finalizado">🏁 Finalizado</option>
        </select>
      </FG>
      <FG label="Color del viaje">
        <div style={{display:'flex',gap:10}}>
          {COLORS.map((c,i)=>(
            <div key={i} onClick={()=>s('colorIdx',i)} style={{width:30,height:30,borderRadius:'50%',background:c,cursor:'pointer',border:f.colorIdx===i?'3px solid var(--navy)':'3px solid transparent',transition:'all 0.15s',transform:f.colorIdx===i?'scale(1.15)':'scale(1)'}} />
          ))}
        </div>
      </FG>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:24}}>
        <button onClick={onClose} disabled={saving} style={{padding:'10px 18px',background:'transparent',border:'1px solid var(--border)',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'var(--text-mid)',opacity:saving?0.5:1}}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} style={{padding:'10px 22px',background:saving?'rgba(184,115,51,0.5)':'#b87333',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:saving?'not-allowed':'pointer',fontFamily:'DM Sans,sans-serif',boxShadow:'0 4px 16px rgba(184,115,51,0.28)',display:'flex',alignItems:'center',gap:8}}>
          {saving?'⏳ Guardando...':'Guardar cambios'}
        </button>
      </div>
    </Modal>
  )
}

function InviteModal({ tripId, onClose }: any) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('lector')
  const [saving, setSaving] = useState(false)
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  const handleInvite = async () => {
    if (!email.trim()) { setError('El email es requerido'); return }
    setSaving(true); setError('')
    try {
      const res = await axios.post('/api/invitations', { tripId, email: email.trim(), role })
      setLink(res.data.inviteUrl)
    } catch(e: any) {
      setError(e.response?.data?.error || 'Error al generar invitación')
    } finally { setSaving(false) }
  }

  return (
    <Modal title="Invitar al viaje" onClose={onClose}>
      {!link ? (
        <>
          <FG label="Email del invitado">
            <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&e.preventDefault()} placeholder="amigo@gmail.com" autoFocus />
          </FG>
          <FG label="Rol">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['lector','👁 Lector','Solo puede ver el viaje'],['escritor','✏️ Escritor','Puede editar el viaje']].map(([v,l,d])=>(
                <div key={v} onClick={()=>setRole(v)} style={{padding:'12px 14px',borderRadius:12,border:`1.5px solid ${role===v?'#b87333':'var(--border)'}`,background:role===v?'rgba(184,115,51,0.06)':'transparent',cursor:'pointer',transition:'all 0.15s'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:3}}>{l}</div>
                  <div style={{fontSize:11,color:'var(--text-light)'}}>{d}</div>
                </div>
              ))}
            </div>
          </FG>
          {error&&<div style={{padding:'10px 14px',background:'rgba(196,92,92,0.08)',border:'1px solid rgba(196,92,92,0.2)',borderRadius:10,fontSize:13,color:'#c45c5c',marginBottom:14}}>{error}</div>}
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
            <button onClick={onClose} style={{padding:'10px 18px',background:'transparent',border:'1px solid var(--border)',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'var(--text-mid)'}}>Cancelar</button>
            <button onClick={handleInvite} disabled={saving} style={{padding:'10px 22px',background:saving?'rgba(184,115,51,0.5)':'#b87333',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:saving?'not-allowed':'pointer',fontFamily:'DM Sans,sans-serif'}}>
              {saving?'⏳ Generando...':'Generar link'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{padding:'16px',background:'rgba(74,124,89,0.06)',border:'1px solid rgba(74,124,89,0.2)',borderRadius:12,marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:600,color:'#4a7c59',marginBottom:8}}>✅ Link generado</div>
            <div style={{fontSize:12,color:'var(--text-mid)',wordBreak:'break-all',lineHeight:1.5}}>{link}</div>
          </div>
          <button onClick={()=>{navigator.clipboard.writeText(link);toast('Link copiado','success')}} style={{width:'100%',padding:'12px',background:'#b87333',color:'white',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',marginBottom:10}}>
            📋 Copiar link
          </button>
          <button onClick={onClose} style={{width:'100%',padding:'12px',background:'transparent',border:'1px solid var(--border)',borderRadius:12,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'var(--text-mid)'}}>
            Cerrar
          </button>
        </>
      )}
    </Modal>
  )
}

export default function TripLayout({ children, params }: { children: React.ReactNode, params: Promise<{id:string}> }) {
  const router    = useRouter()
  const pathname  = usePathname()
  const tabsRef   = useRef<HTMLDivElement>(null)
  const [trip, setTrip]               = useState<any>(null)
  const [allTrips, setAllTrips]       = useState<any[]>([])
  const [tripId, setTripId]           = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showEdit, setShowEdit]       = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [loadingTrip, setLoadingTrip] = useState(true)
  const [userRole, setUserRole] = useState<'owner'|'escritor'|'lector'>('owner')

  useEffect(()=>{
    const apply=()=>document.documentElement.setAttribute('data-theme',new Date().getHours()>=7&&new Date().getHours()<19?'light':'dark')
    apply(); const iv=setInterval(apply,60000); return()=>clearInterval(iv)
  },[])

  useEffect(()=>{
    params.then(p=>{ setTripId(p.id); loadData(p.id) })
  },[])

  const loadData = useCallback(async(id:string)=>{
    setLoadingTrip(true)
    try {
      const res = await axios.get('/api/trips')
      try {
  const members = await axios.get(`/api/trips/${id}/members`)
  const session = await fetch('/api/auth/session').then(r=>r.json())
  const me = members.data.find((m:any)=>m.user_id===session?.user?.email)
  if(me) setUserRole(me.role)
} catch(e){}
      setAllTrips(res.data)
      setTrip(res.data.find((t:any)=>t.id===id)||null)
    } catch(e){ console.error(e) }
    finally{ setLoadingTrip(false) }
  },[])

  const activeTab = TABS.find(t=>pathname.endsWith('/'+t.id))?.id||'overview'

  const handleTab = (tabId:string) => {
    router.push(`/trips/${tripId}/${tabId}`)
    setTimeout(()=>{
      const el=tabsRef.current?.querySelector(`[data-tab="${tabId}"]`) as HTMLElement
      el?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})
    },50)
  }

  const handleSaveTrip = async(data:any)=>{
    const updated={...trip,name:data.name,destination:data.destination,start_date:data.startDate,end_date:data.endDate,budget:data.budget,currency:data.currency,status:data.status,color_idx:data.colorIdx}
    try {
      await axios.put(`/api/trips/${tripId}`,updated)
      setTrip(updated)
      setAllTrips(prev=>prev.map(t=>t.id===tripId?updated:t))
      setShowEdit(false)
      toast('Viaje actualizado correctamente','success')
    } catch(e){ throw e }
  }

  const handleDelete = async()=>{
    if(!confirm('¿Eliminar este viaje y todo su contenido? Esta acción no se puede deshacer.')) return
    try {
      await axios.delete(`/api/trips/${tripId}`)
      toast('Viaje eliminado','info')
      router.push('/')
    } catch(e){ toast('Error al eliminar el viaje','error') }
  }

  const handleUpdateStatus = async(status:string)=>{
    const prev=trip
    const updated={...trip,status}
    setTrip(updated)
    try {
      await axios.put(`/api/trips/${tripId}`,updated)
      toast('Estado actualizado','success')
    } catch(e){ setTrip(prev); toast('Error al actualizar el estado','error') }
  }

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--bg)'}}>
      <ToastContainer />
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:499,backdropFilter:'blur(4px)'}} />}

      <div className={`sidebar-responsive${sidebarOpen?' open':''}`} style={{width:260,minWidth:260,display:'flex',flexDirection:'column',background:'var(--bg-sidebar)',borderRight:'1px solid rgba(255,255,255,0.05)',overflow:'hidden',position:'relative',zIndex:10,flexShrink:0}}>
        <div style={{padding:'24px 20px 20px',borderBottom:'1px solid rgba(255,255,255,0.05)',cursor:'pointer'}} onClick={()=>router.push('/')}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'#f0ece3',lineHeight:1}}>Wander<em style={{color:'#b87333',fontStyle:'italic'}}>Kit</em></div>
          <div style={{fontSize:9,fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(255,255,255,0.2)',marginTop:5}}>Gestor de Viajes</div>
        </div>
        <div style={{padding:'10px 10px 0'}}>
          <button onClick={()=>router.push('/')} style={{width:'100%',padding:'8px 12px',borderRadius:8,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:8,transition:'all 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
            ← Todos los viajes
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'10px 0'}}>
          <div style={{fontSize:8,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(255,255,255,0.18)',padding:'0 20px',marginBottom:6}}>Mis Viajes</div>
          {loadingTrip ? (
            <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:8}}>
              {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:44,borderRadius:10}} />)}
            </div>
          ) : allTrips.map((t,i)=>(
            <div key={t.id} onClick={()=>router.push(`/trips/${t.id}/overview`)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',margin:'2px 8px',borderRadius:10,cursor:'pointer',transition:'all 0.15s',background:t.id===tripId?'rgba(184,115,51,0.12)':'rgba(255,255,255,0.02)',border:t.id===tripId?'1px solid rgba(184,115,51,0.28)':'1px solid transparent'}}
              onMouseEnter={e=>{if(t.id!==tripId)e.currentTarget.style.background='rgba(255,255,255,0.06)'}}
              onMouseLeave={e=>{if(t.id!==tripId)e.currentTarget.style.background='rgba(255,255,255,0.02)'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[t.color_idx??i%COLORS.length],flexShrink:0}} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,color:'#e8e2d8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.name}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.destination}</div>
              </div>
              <div style={{width:6,height:6,borderRadius:'50%',background:t.status==='en curso'?'#4a7c59':t.status==='finalizado'?'rgba(255,255,255,0.15)':'#b87333',flexShrink:0}} />
            </div>
          ))}
        </div>
        <div style={{padding:'12px 10px',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
<button onClick={()=>signOut({callbackUrl:'/login'})} style={{width:'100%',padding:'10px 12px',borderRadius:10,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',marginBottom:8,display:'flex',alignItems:'center',gap:8,transition:'all 0.15s'}}
  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='rgba(255,255,255,0.7)'}}
  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(255,255,255,0.4)'}}>
  <span style={{fontSize:14}}>↪</span> Cerrar sesión
</button>          <button onClick={()=>router.push('/?new=1')} style={{width:'100%',padding:'10px',borderRadius:10,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:600,color:'#b87333',background:'rgba(184,115,51,0.1)',border:'1.5px solid rgba(184,115,51,0.28)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            ＋ Nuevo viaje
          </button>
        </div>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div className="mobile-header no-print" style={{display:'none',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',background:'var(--bg-sidebar)',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',gap:4,padding:4}}>
            {[1,2,3].map(i=><div key={i} style={{width:20,height:2,background:'rgba(255,255,255,0.6)',borderRadius:2}} />)}
          </button>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:300,color:'#f0ece3'}}>Wander<em style={{color:'#b87333'}}>Kit</em></div>
          <button onClick={()=>router.push('/')} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,padding:'6px 12px',color:'rgba(255,255,255,0.5)',fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>← Inicio</button>
        </div>

        <div className="no-print" style={{background:'var(--bg-card)',borderBottom:'1px solid var(--border)',flexShrink:0,zIndex:100,padding:'20px 44px 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,fontSize:12,color:'var(--text-light)'}}>
            <span onClick={()=>router.push('/')} style={{cursor:'pointer',color:'#b87333',fontWeight:500,transition:'opacity 0.15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='0.7'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Inicio</span>
            <span style={{opacity:0.4}}>›</span>
            {loadingTrip
              ? <div className="skeleton" style={{width:80,height:13,borderRadius:4,display:'inline-block'}} />
              : <span style={{color:'var(--text-mid)',fontWeight:500}}>{trip?.name}</span>
            }
            <span style={{opacity:0.4}}>›</span>
            <span>{TABS.find(t=>t.id===activeTab)?.label||'Resumen'}</span>
          </div>

          {loadingTrip ? (
            <div style={{marginBottom:20}}>
              <div className="skeleton" style={{width:160,height:12,borderRadius:4,marginBottom:12}} />
              <div className="skeleton" style={{width:300,height:32,borderRadius:6,marginBottom:8}} />
              <div className="skeleton" style={{width:220,height:12,borderRadius:4,marginBottom:20}} />
            </div>
          ) : trip && (
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:10}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-light)',marginBottom:6}}>
                  {trip.status==='en curso'?'🟢 En curso':trip.status==='finalizado'?'🏁 Finalizado':'📋 Planificado'} · {trip.destination}
                </div>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:34,fontWeight:300,color:'var(--navy)',lineHeight:1}}>{trip.name}</div>
                <div style={{fontSize:13,color:'var(--text-mid)',marginTop:5}}>{trip.start_date} → {trip.end_date} · {fmt(trip.budget,trip.currency)}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <button onClick={()=>setShowEdit(true)} style={{padding:'9px 16px',background:'transparent',border:'1px solid var(--border)',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'var(--text-mid)',display:'flex',alignItems:'center',gap:6,transition:'all 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-cream)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  ✏️ Editar
                </button>
                <button onClick={()=>window.print()} style={{padding:'9px 12px',background:'transparent',border:'1px solid var(--border)',borderRadius:10,fontSize:12,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'var(--text-mid)'}}>🖨️</button>
                <button onClick={()=>setShowInvite(true)} style={{padding:'9px 16px',background:'transparent',border:'1px solid var(--border)',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'var(--text-mid)',display:'flex',alignItems:'center',gap:6,transition:'all 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-cream)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>👥 Invitar</button>
                <button onClick={handleDelete} style={{padding:'9px 12px',background:'transparent',border:'1px solid rgba(196,92,92,0.35)',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'#c45c5c',transition:'all 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(196,92,92,0.08)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  🗑
                </button>
                <select value={trip.status} onChange={e=>handleUpdateStatus(e.target.value)} style={{padding:'9px 12px',border:'1px solid var(--border)',borderRadius:10,background:'var(--bg-input)',color:'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',outline:'none'}}>
                  <option value="planificado">📋 Planificado</option>
                  <option value="en curso">🟢 En Curso</option>
                  <option value="finalizado">🏁 Finalizado</option>
                </select>
              </div>
            </div>
          )}

          <div style={{position:'relative'}}>
            <div ref={tabsRef} style={{display:'flex',overflowX:'auto',scrollbarWidth:'none'}}>
              {TABS.map(t=>(
                <button key={t.id} data-tab={t.id} onClick={()=>handleTab(t.id)} style={{padding:'11px 16px',fontSize:12,fontWeight:activeTab===t.id?600:400,background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif',whiteSpace:'nowrap',flexShrink:0,borderBottom:activeTab===t.id?'2px solid #b87333':'2px solid transparent',color:activeTab===t.id?'var(--navy)':'var(--text-light)',transition:'all 0.2s',marginBottom:-1}}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{position:'absolute',right:0,top:0,bottom:0,width:40,background:'linear-gradient(to left,var(--bg-card),transparent)',pointerEvents:'none'}} />
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',background:'var(--bg)'}}>
          <TripProvider tripId={tripId||''} userRole={userRole}>
            {children}
          </TripProvider>
        </div>
      </div>

      {showEdit&&trip&&<EditTripModal trip={trip} onClose={()=>setShowEdit(false)} onSave={handleSaveTrip} />}
        {showInvite&&trip&&<InviteModal tripId={tripId} onClose={()=>setShowInvite(false)} />}
    </div>
  )
}