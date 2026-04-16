'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTrips } from '@/lib/hooks/useTrips'

const tripColors = ['#b87333','#4a7c59','#4a7fa5','#8a5aaa','#c45c5c','#3a8a7c']
const fmtCurrency = (n: number, currency = 'USD') => {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; type: ToastType; leaving?: boolean }
let toastId = 0
let globalAddToast: ((msg: string, type: ToastType) => void) | null = null
export const toast = (message: string, type: ToastType = 'success') => { if (globalAddToast) globalAddToast(message, type) }

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastId
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x))
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 300)
    }, 3000)
  }, [])
  useEffect(() => { globalAddToast = addToast; return () => { globalAddToast = null } }, [addToast])
  return (
    <div className="toast-container no-print">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}${t.leaving ? ' leaving' : ''}`}>
          <span style={{ fontSize: 15 }}>{t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'}</span>{t.message}
        </div>
      ))}
    </div>
  )
}

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])
  return <>{display}</>
}

export default function Home() {
  const router = useRouter()
  const { trips, loading, createTrip, deleteTrips, updateTrip } = useTrips()
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [showProfile, setShowProfile] = useState(false)
  const { data: session } = useSession()
  const [pullY, setPullY] = useState(0)
  useEffect(()=>{
    if(typeof window==='undefined'||!('serviceWorker' in navigator)||!('PushManager' in window)) return
    navigator.serviceWorker.register('/sw.js').then(async reg=>{
      const permission = await Notification.requestPermission()
      if(permission!=='granted') return
      const existing = await reg.pushManager.getSubscription()
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })
      await fetch('/api/push', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({type:'subscribe', subscription:sub}) })
    }).catch(()=>{})
  },[])
  const startY = useRef(0)
  const pulling = useRef(false)

  useEffect(()=>{
    const el = document.querySelector('.main-scroll') as HTMLElement
    if(!el) return
    const onStart=(e:TouchEvent)=>{ startY.current=e.touches[0].clientY }
    const onMove=(e:TouchEvent)=>{
      const dy=e.touches[0].clientY-startY.current
      if(dy>0&&el.scrollTop===0){setPullY(Math.min(dy,80));e.preventDefault()}
    }
    const onEnd=async()=>{
      if(pullY>60&&!pulling.current){pulling.current=true;window.location.reload()}
      setPullY(0)
    }
    el.addEventListener('touchstart',onStart,{passive:true})
    el.addEventListener('touchmove',onMove,{passive:false})
    el.addEventListener('touchend',onEnd)
    return()=>{el.removeEventListener('touchstart',onStart);el.removeEventListener('touchmove',onMove);el.removeEventListener('touchend',onEnd)}
  },[pullY])
  
useEffect(()=>{
    if(!trips.length) return
    const today = new Date().toISOString().split('T')[0]
    trips.forEach(async t=>{
      if(t.status==='planificado' && t.start_date && t.start_date<=today){
        await updateTrip(t.id, { status:'en curso' })
      }
      if(t.status==='en curso' && t.end_date && t.end_date<today){
        await updateTrip(t.id, { status:'finalizado' })
      }
    })
  },[trips.length])

  useEffect(() => {
    const applyTheme = () => {
      const hour = new Date().getHours()
      document.documentElement.setAttribute('data-theme', hour >= 7 && hour < 19 ? 'light' : 'dark')
    }
    applyTheme()
    const interval = setInterval(applyTheme, 60000)
    return () => clearInterval(interval)
  }, [])

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleDeleteSelected = async () => {
    const count = selected.length
    if (!confirm(`¿Eliminar ${count} viaje${count > 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return
    await deleteTrips(selected)
    setSelected([])
    toast(`${count} viaje${count > 1 ? 's' : ''} eliminado${count > 1 ? 's' : ''}`, 'info')
  }

  const [tripPhotos, setTripPhotos] = useState<Record<string,string>>({})
useEffect(()=>{
  trips.forEach(t=>{
    if(!tripPhotos[t.id]&&t.destination){
      fetch(`https://api.unsplash.com/search/photos?query=$encodeURIComponent(t.destination.split(',')[0].trim()+' travel photography')&per_page=1&orientation=landscape`,{headers:{'Authorization':`Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`}})
        .then(r=>r.json()).then(d=>{ if(d.results?.[0]) setTripPhotos(p=>({...p,[t.id]:d.results[0].urls.regular})) })
        .catch(()=>{})
    }
  })
},[trips])
const [tripWeather, setTripWeather] = useState<Record<string,any>>({})
useEffect(()=>{
  trips.forEach(t=>{
    if(!tripWeather[t.id]&&t.destination){
      const city = t.destination.split(',')[0].trim()
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_KEY}&units=metric&lang=es`)
        .then(r=>r.json()).then(d=>{ if(d.main) setTripWeather(p=>({...p,[t.id]:d})) })
        .catch(()=>{})
    }
  })
},[trips])
  const ongoing = trips.filter(t => t.status === 'en curso').length
  const upcoming = trips.filter(t => t.status === 'planificado').length
  const finished = trips.filter(t => t.status === 'finalizado').length
  const countries = [...new Set(trips.map(t => t.destination?.split(',').pop()?.trim()).filter(Boolean))].length
  const totalBudget = trips.reduce((s,t)=>s+(t.budget||0),0)

  const statusConfig: Record<string, any> = {
    planificado: { label: 'Planificado', bg: 'rgba(74,127,165,0.1)', color: '#4a7fa5' },
    'en curso': { label: 'En Curso', bg: 'rgba(74,124,89,0.1)', color: '#4a7c59' },
    finalizado: { label: 'Finalizado', bg: 'rgba(138,138,170,0.1)', color: '#8a8aaa' },
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <ToastContainer />
{pullY>0&&(
  <div style={{position:'fixed',top:0,left:0,right:0,display:'flex',justifyContent:'center',zIndex:100,pointerEvents:'none',transform:`translateY(${pullY-40}px)`,transition:'transform 0.1s'}}>
    <div style={{background:'var(--bg-card)',borderRadius:20,padding:'6px 14px',fontSize:12,color:'var(--text-mid)',boxShadow:'var(--shadow-card)',display:'flex',alignItems:'center',gap:6}}>
      {pullY>60?'↑ Suelta para actualizar':'↓ Desliza para actualizar'}
    </div>
  </div>
)}
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 499, backdropFilter: 'blur(4px)' }} />
      )}

      {/* SIDEBAR */}
      <div className={`sidebar-responsive${sidebarOpen ? ' open' : ''}`} style={{ width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative', zIndex: 500, flexShrink: 0 }}>
        <div style={{ padding: '28px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: '#f0ece3', letterSpacing: '0.02em', lineHeight: 1 }}>
            Wander<em style={{ color: '#b87333', fontStyle: 'italic' }}>Kit</em>
          </div>
         <div>Gestor de Viajes</div>
          <button onClick={()=>setSidebarOpen(false)} style={{position:'absolute',top:16,right:16,width:32,height:32,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'rgba(255,255,255,0.5)'}}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', padding: '0 22px', marginBottom: 8 }}>Mis Viajes</div>
          {loading ? (
            <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
            </div>
          ) : trips.map((t, i) => (
            <div key={t.id} onClick={() => { router.push(`/trips/${t.id}`); setSidebarOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', margin: '2px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', background: 'rgba(255,255,255,0.02)', border: '1px solid transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: tripColors[t.color_idx ?? i % tripColors.length], flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#e8e2d8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.destination}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.status === 'en curso' ? '#4a7c59' : t.status === 'finalizado' ? 'rgba(255,255,255,0.15)' : '#b87333', flexShrink: 0 }} />
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
         
{session?.user&&(
  <div onClick={()=>setShowProfile(true)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',marginBottom:8,borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer',transition:'all 0.15s'}}
    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)'}}
    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)'}}>
    {session.user.image&&<img src={session.user.image} alt="" style={{width:34,height:34,borderRadius:'50%',flexShrink:0,border:'2px solid rgba(184,115,51,0.4)'}} />}
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.8)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{session.user.name}</div>
      <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{session.user.email}</div>
    </div>
    <span style={{fontSize:10,color:'rgba(255,255,255,0.2)'}}>›</span>
  </div>
)}

<button onClick={() => signOut({ callbackUrl: '/login' })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
            <span style={{ fontSize: 14 }}>↪</span> Cerrar sesión
          </button>
          <button className="btn-press" onClick={() => setShowNewTrip(true)} style={{ width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#b87333', background: 'rgba(184,115,51,0.1)', border: '1.5px solid rgba(184,115,51,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            ＋ Nuevo viaje
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="main-scroll" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile header */}
        <div className="mobile-header no-print" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--bg-sidebar)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 200 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, padding: 4 }}>
            {[1,2,3].map(i => <div key={i} style={{ width: 20, height: 2, background: 'rgba(255,255,255,0.6)', borderRadius: 2 }} />)}
          </button>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: '#f0ece3' }}>Wander<em style={{ color: '#b87333' }}>Kit</em></div>
          <button className="btn-press" onClick={() => setShowNewTrip(true)} style={{ background: 'rgba(184,115,51,0.15)', border: '1px solid rgba(184,115,51,0.3)', borderRadius: 8, padding: '6px 12px', color: '#b87333', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>＋</button>
        </div>

        {loading ? (
          <div style={{ padding: '52px 56px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, marginTop: 16 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 20 }} />)}
            </div>
          </div>
        ) : (
          <div className="responsive-padding" style={{ padding: '52px 56px 64px' }}>

{(() => {
  const today = new Date().toISOString().split('T')[0]
  const next = trips.find(t => t.start_date && t.start_date >= today && t.status === 'planificado')
  const daysLeft = next ? Math.ceil((new Date(next.start_date).getTime() - new Date().getTime()) / 86400000) : null
  if (!next || daysLeft === null || daysLeft > 30) return null
  return (
    <div onClick={() => router.push(`/trips/${next.id}`)} className="fade-up" style={{marginBottom:24,padding:'16px 20px',background:'rgba(184,115,51,0.08)',border:'1px solid rgba(184,115,51,0.2)',borderRadius:14,cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'all 0.15s'}}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(184,115,51,0.12)'}
      onMouseLeave={e=>e.currentTarget.style.background='rgba(184,115,51,0.08)'}>
      <div style={{fontSize:28}}>✈️</div>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:'#b87333'}}>Viaje próximo en {daysLeft === 0 ? '¡hoy!' : `${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}</div>
        <div style={{fontSize:13,color:'var(--text-mid)',marginTop:2}}>{next.name} · {next.destination}</div>
      </div>
      <div style={{marginLeft:'auto',fontSize:18,color:'#b87333',opacity:0.6}}>›</div>
    </div>
  )
})()}

            {/* Hero — solo si hay viajes */}
            {trips.length > 0 && (
              <div className="fade-up" style={{ marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 12 }}>WanderKit</div>
                <div className="responsive-text-sm" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>
                  Tus <em style={{ color: '#b87333', fontStyle: 'italic' }}>aventuras,</em> organizadas.
                </div>
              </div>
            )}

            {/* Stats — solo si hay viajes */}
            {trips.length > 0 && (
              <div className="fade-up-2 stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, marginBottom: 24, background: 'var(--border)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {[
                  { num: trips.length, label: 'Total viajes', icon: '🌍' },
                  { num: countries, label: 'Países', icon: '📍' },
                  { num: finished, label: 'Finalizados', icon: '✅' },
                  { num: ongoing, label: 'En curso', icon: '✈️' }
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', padding: '14px 16px' }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}><AnimatedNumber value={s.num} /></div>
                    <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 4, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Trips grid */}
            {trips.length > 0 && (
              <>
                <div className="fade-up-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 400, color: 'var(--navy)' }}>Mis viajes</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{trips.length} viaje{trips.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[['todos','Todos'],['planificado','Planificado'],['en curso','En curso'],['finalizado','Finalizado']].map(([v,l])=>(
                      <button key={v} onClick={()=>setFilterStatus(v)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${filterStatus===v?'#b87333':'var(--border)'}`, background: filterStatus===v?'rgba(184,115,51,0.1)':'transparent', color: filterStatus===v?'#b87333':'var(--text-light)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>{l}</button>
                    ))}
                  </div>
                  {selected.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>{selected.length} seleccionado{selected.length > 1 ? 's' : ''}</span>
                      <button className="btn-press" onClick={() => setSelected([])} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--text-mid)' }}>Cancelar</button>
                      <button className="btn-press" onClick={handleDeleteSelected} style={{ padding: '8px 16px', background: '#c45c5c', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🗑 Eliminar {selected.length > 1 ? `${selected.length} viajes` : 'viaje'}
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                  {trips.filter(t=>filterStatus==='todos'||t.status===filterStatus).map((t, i) => {
                    const sc = statusConfig[t.status] || statusConfig.planificado
                    const color = tripColors[t.color_idx ?? i % tripColors.length]
                    const isSelected = selected.includes(t.id)
                    return (
                      <div key={t.id} className={`card-hover fade-up-${Math.min(i + 3, 6)}`}
                        onClick={() => !selected.length && router.push(`/trips/${t.id}`)}
                        style={{ background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden', border: isSelected ? '2px solid #b87333' : '1px solid var(--border)', boxShadow: isSelected ? '0 0 0 3px rgba(184,115,51,0.15)' : 'var(--shadow-card)', position: 'relative', cursor: selected.length ? 'default' : 'pointer' }}>
                        <div onClick={(e) => toggleSelect(e, t.id)} style={{ position: 'absolute', top: 12, left: 12, width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSelected ? '#b87333' : 'rgba(255,255,255,0.8)'}`, background: isSelected ? '#b87333' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', transition: 'all 0.15s' }}>
                          {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                        </div>
                        <div style={{ height: 110, position: 'relative', overflow: 'hidden', borderBottom: `3px solid ${color}` }}>
  {tripPhotos[t.id]
    ? <img src={tripPhotos[t.id]} alt={t.destination} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s'}} onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.05)')} onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')} />
    : <div style={{width:'100%',height:'100%',background:`linear-gradient(135deg,${color}20,${color}40)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,opacity:0.4}}>🌍</div>
  }
  <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.4),transparent)'}} />
  <span style={{position:'absolute',bottom:10,right:10,padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:'rgba(0,0,0,0.4)',color:'white',backdropFilter:'blur(4px)'}}>{sc.label}</span>
</div>
                        <div style={{ padding: '18px 20px 20px' }}>
                          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: 'var(--navy)', lineHeight: 1.2 }}>{t.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>📍 {t.destination}</div>
{tripWeather[t.id]&&<div style={{fontSize:12,color:'var(--text-light)',marginTop:3,display:'flex',alignItems:'center',gap:4}}>
  <span>{tripWeather[t.id].weather[0].id>=800&&tripWeather[t.id].weather[0].id<801?'☀️':tripWeather[t.id].weather[0].id>=300&&tripWeather[t.id].weather[0].id<600?'🌧':'⛅'}</span>
  <span>{Math.round(tripWeather[t.id].main.temp)}°C</span>
  <span style={{textTransform:'capitalize'}}>{tripWeather[t.id].weather[0].description}</span>
</div>}
                          <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-light)' }}>
                            <span>📅 {t.start_date || '—'}</span>
                            <span>💰 {fmtCurrency(t.budget, t.currency)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Onboarding — solo si NO hay viajes */}
            {trips.length === 0 && (
              <div className="fade-up-3" style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: 20, border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>✈️</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: 'var(--navy)', fontWeight: 300, marginBottom: 12 }}>Tu próxima aventura te espera</div>
                <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>Crea tu primer viaje y empieza a planificar vuelos, gastos, itinerario y más.</div>
                <button className="btn-press" onClick={() => setShowNewTrip(true)} style={{ padding: '14px 32px', background: '#b87333', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 20px rgba(184,115,51,0.35)', marginBottom: 32 }}>＋ Crear primer viaje</button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 480, margin: '0 auto' }}>
                  {[{icon:'✈️',t:'Vuelos',d:'Ida, regreso y escalas'},{icon:'💰',t:'Gastos',d:'Plan vs real'},{icon:'📍',t:'Lugares',d:'Con mapa integrado'},{icon:'📋',t:'Itinerario',d:'Día a día'},{icon:'📂',t:'Documentos',d:'Reservas y pasajes'},{icon:'📝',t:'Diario',d:'Recuerda cada momento'}]
                    .map((f,i)=><div key={i} style={{padding:'14px 10px',background:'var(--bg)',borderRadius:12,border:'1px solid var(--border)'}}><div style={{fontSize:22,marginBottom:6}}>{f.icon}</div><div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:2}}>{f.t}</div><div style={{fontSize:11,color:'var(--text-light)'}}>{f.d}</div></div>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
{showProfile&&session?.user&&(
  <div style={{position:'fixed',inset:0,background:'rgba(8,14,28,0.8)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20}} onClick={()=>setShowProfile(false)}>
    <div style={{background:'var(--bg)',borderRadius:24,padding:'40px',width:'100%',maxWidth:480,border:'1px solid var(--border)'}} onClick={e=>e.stopPropagation()}>
      <div style={{textAlign:'center',marginBottom:32}}>
        {session.user.image&&<img src={session.user.image} alt="" style={{width:80,height:80,borderRadius:'50%',border:'3px solid #b87333',marginBottom:16}} />}
        <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:300,color:'var(--navy)'}}>{session.user.name}</div>
        <div style={{fontSize:13,color:'var(--text-light)',marginTop:4}}>{session.user.email}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:28}}>
        {[
          {icon:'🌍',num:trips.length,label:'Total viajes'},
          {icon:'📍',num:countries,label:'Países'},
          {icon:'✅',num:finished,label:'Finalizados'},
          {icon:'✈️',num:ongoing,label:'En curso'},
        ].map((s,i)=>(
          <div key={i} style={{background:'var(--bg-card)',borderRadius:14,padding:'16px 20px',border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,fontWeight:300,color:'var(--navy)'}}>{s.num}</div>
            <div style={{fontSize:10,color:'var(--text-light)',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={()=>setShowProfile(false)} style={{width:'100%',padding:'12px',background:'transparent',border:'1px solid var(--border)',borderRadius:12,fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',color:'var(--text-mid)'}}>Cerrar</button>
    </div>
  </div>
)}
      {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} onSave={async (data: any) => { await createTrip(data); setShowNewTrip(false); toast('¡Viaje creado! ✈️', 'success') }} />}
    </div>
  )
}

function NewTripModal({ onClose, onSave }: any) {
  const [f, setF] = useState({ name: '', city: '', country: '', startDate: '', endDate: '', budget: '', currency: 'USD', status: 'planificado', colorIdx: 0 })
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }

  useEffect(()=>{
    if(cityQuery.length < 3) { setCitySuggestions([]); return }
    const t = setTimeout(()=>{
      setLoadingCities(true)
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=5&addressdetails=1`,{
        headers:{'Accept-Language':'es','User-Agent':'WanderKit/1.0'}
      }).then(r=>r.json()).then(d=>{ setCitySuggestions(d||[]); setLoadingCities(false) }).catch(()=>setLoadingCities(false))
    },400)
    return()=>clearTimeout(t)
  },[cityQuery])

  const selectCity = (city: any) => {
    const c = (city.address?.city||city.address?.town||city.address?.village||city.address?.county||city.name||'').toUpperCase()
    const co = (city.address?.country||'').toUpperCase()
    s('city', c); s('country', co)
    setCityQuery(c); setCitySuggestions([])
  }

  return (
    <Modal title="Nuevo viaje" onClose={onClose}>
      <FG label="Nombre del viaje"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value.toUpperCase())} onKeyDown={handleKey} placeholder="Ej: BRASIL 2025" autoFocus /></FG>
      <div style={{position:'relative'}}>
        <FG label="Ciudad">
          <input className="form-input" value={cityQuery} onChange={e=>setCityQuery(e.target.value.toUpperCase())} onKeyDown={handleKey} placeholder="Ej: SAN ANDRÉS" />
          {loadingCities&&<div style={{position:'absolute',right:12,top:38,fontSize:11,color:'var(--text-light)'}}>⏳</div>}
        </FG>
        {citySuggestions.length>0&&(
          <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,zIndex:100,overflow:'hidden',boxShadow:'var(--shadow-hover)'}}>
            {citySuggestions.map((c:any,i:number)=>(
              <div key={i} onClick={()=>selectCity(c)} style={{padding:'10px 14px',cursor:'pointer',fontSize:13,color:'var(--text)',borderBottom:'1px solid var(--border)'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-cream)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{fontWeight:600}}>{(c.address?.city||c.address?.town||c.address?.village||c.address?.county||c.name||'').toUpperCase()}</span>
<span style={{color:'var(--text-light)',marginLeft:8}}>{(c.address?.country||'').toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <FG label="País"><input className="form-input" value={f.country} onChange={e=>s('country',e.target.value.toUpperCase())} onKeyDown={handleKey} placeholder="Ej: COLOMBIA" /></FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Fecha inicio"><input className="form-input" type="date" value={f.startDate} onChange={e => { s('startDate', e.target.value); if (f.endDate && f.endDate < e.target.value) s('endDate', '') }} /></FG>
        <FG label="Fecha fin"><input className="form-input" type="date" value={f.endDate} min={f.startDate || undefined} onChange={e => s('endDate', e.target.value)} /></FG>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Presupuesto"><input className="form-input" type="number" value={f.budget} onChange={e => s('budget', e.target.value)} onKeyDown={handleKey} placeholder="0" /></FG>
        <FG label="Moneda">
          <select className="form-input" value={f.currency} onChange={e => s('currency', e.target.value)}>
            {['USD','EUR','CLP','BRL','ARS','MXN','GBP','PEN','COP'].map(c => <option key={c}>{c}</option>)}
          </select>
        </FG>
      </div>
      <FG label="Color del viaje">
        <div style={{ display: 'flex', gap: 10 }}>
          {tripColors.map((c, i) => (
            <div key={i} onClick={() => s('colorIdx', i)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: f.colorIdx === i ? '3px solid var(--navy)' : '3px solid transparent', transition: 'all 0.15s', transform: f.colorIdx === i ? 'scale(1.15)' : 'scale(1)' }} />
          ))}
        </div>
      </FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28 }}>
        <Btn2 onClick={onClose}>Cancelar</Btn2>
        <Btn2 onClick={() => f.name && onSave({ ...f, destination: `${f.city}${f.country?', '+f.country:''}`, budget: parseFloat(f.budget) || 0 })} primary>Crear viaje ✈️</Btn2>
      </div>
    </Modal>
  )
}

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,14,28,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, padding: '20px', paddingTop: '60px', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 20, padding: '36px 40px', width: '100%', maxWidth: 540, marginBottom: 'auto', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--navy)', marginBottom: 26 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function FG({ label, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  )
}

function Btn2({ onClick, primary, children }: any) {
  return (
    <button className="btn-press" onClick={onClick} style={{ padding: primary ? '11px 22px' : '11px 18px', background: primary ? '#b87333' : 'transparent', color: primary ? 'white' : 'var(--text-mid)', border: primary ? 'none' : '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: primary ? '0 4px 16px rgba(184,115,51,0.28)' : 'none', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {children}
    </button>
  )
}