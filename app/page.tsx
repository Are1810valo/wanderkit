'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTrips, useTripItems } from '@/lib/hooks/useTrips'
import { Trip } from '@/lib/types'

const tripColors = ['#b87333','#4a7c59','#4a7fa5','#8a5aaa','#c45c5c','#3a8a7c']
const fmtCurrency = (n: number, currency = 'USD') => {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

/* ── TOAST ── */
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
    setTimeout(() => { setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x)); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 300) }, 3000)
  }, [])
  useEffect(() => { globalAddToast = addToast; return () => { globalAddToast = null } }, [addToast])
  const icons = { success: '✓', error: '✕', info: 'ℹ' }
  return (
    <div className="toast-container no-print">
      {toasts.map(t => <div key={t.id} className={`toast ${t.type}${t.leaving ? ' leaving' : ''}`}><span style={{ fontSize: 15 }}>{icons[t.type]}</span>{t.message}</div>)}
    </div>
  )
}

/* ── ANIMATED NUMBER ── */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number>()
  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * ease))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [value, duration])
  return <>{display}</>
}

/* ── SKELETONS ── */
function SkeletonCard({ height = 120 }: { height?: number }) {
  return <div className="skeleton" style={{ height, borderRadius: 16 }} />
}
function SkeletonOverview() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ gridColumn: '1 / -1' }}><SkeletonCard height={180} /></div>
      <SkeletonCard height={130} /><SkeletonCard height={130} />
      <SkeletonCard height={130} /><SkeletonCard height={130} />
    </div>
  )
}
function SkeletonList() {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3,4].map(i => <SkeletonCard key={i} height={72} />)}</div>
}

/* ── MAIN APP ── */
export default function Home() {
  const { trips, loading, createTrip, updateTrip, deleteTrip } = useTrips()
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const applyTheme = () => {
      const hour = new Date().getHours()
      document.documentElement.setAttribute('data-theme', hour >= 7 && hour < 19 ? 'light' : 'dark')
    }
    applyTheme()
    const interval = setInterval(applyTheme, 60000)
    return () => clearInterval(interval)
  }, [])

  const selectedTrip = trips.find(t => t.id === selectedTripId)
  const handleSelectTrip = (id: string) => { setSelectedTripId(id); setActiveTab('overview'); setSidebarOpen(false) }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>
      <ToastContainer />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 499, backdropFilter: 'blur(4px)' }} />
      )}

      {/* ── SIDEBAR ── */}
      <div className={`sidebar-responsive${sidebarOpen ? ' open' : ''}`} style={{ width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative', zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: '28px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: '#f0ece3', letterSpacing: '0.02em', lineHeight: 1 }}>
            Wander<em style={{ color: '#b87333', fontStyle: 'italic' }}>Kit</em>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Gestor de Viajes</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', padding: '0 22px', marginBottom: 8 }}>Mis Viajes</div>
          {loading ? (
            <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
            </div>
          ) : trips.length === 0 ? (
            <div style={{ padding: '28px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, opacity: 0.2, marginBottom: 8 }}>✈️</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Sin viajes aún</div>
            </div>
          ) : trips.map((t, i) => (
            <div key={t.id} onClick={() => handleSelectTrip(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', margin: '2px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', background: selectedTripId === t.id ? 'rgba(184,115,51,0.12)' : 'rgba(255,255,255,0.02)', border: selectedTripId === t.id ? '1px solid rgba(184,115,51,0.28)' : '1px solid transparent' }}
              onMouseEnter={e => { if (selectedTripId !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (selectedTripId !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: tripColors[t.color_idx ?? i % tripColors.length], flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#e8e2d8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.destination}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.status === 'en curso' ? '#4a7c59' : t.status === 'finalizado' ? 'rgba(255,255,255,0.15)' : '#b87333', flexShrink: 0 }} />
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-press" onClick={() => setShowNewTrip(true)} style={{ width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#b87333', background: 'rgba(184,115,51,0.1)', border: '1.5px solid rgba(184,115,51,0.28)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            ＋ Nuevo viaje
          </button>
          {selectedTripId && (
            <button className="btn-press" onClick={() => setSelectedTripId(null)} style={{ width: '100%', padding: '9px', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              ← Inicio
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="main-responsive" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile header */}
        <div className="mobile-header no-print" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--bg-sidebar)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 200 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, padding: 4 }}>
            {[1,2,3].map(i => <div key={i} style={{ width: 20, height: 2, background: 'rgba(255,255,255,0.6)', borderRadius: 2 }} />)}
          </button>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: '#f0ece3' }}>Wander<em style={{ color: '#b87333' }}>Kit</em></div>
          <button className="btn-press" onClick={() => setShowNewTrip(true)} style={{ background: 'rgba(184,115,51,0.15)', border: '1px solid rgba(184,115,51,0.3)', borderRadius: 8, padding: '6px 12px', color: '#b87333', fontSize: 18, cursor: 'pointer', fontWeight: 300, lineHeight: 1 }}>＋</button>
        </div>

        {loading ? (
          <div style={{ padding: '52px 56px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>{[1,2,3,4].map(i => <SkeletonCard key={i} height={110} />)}</div>
            <SkeletonCard height={40} />
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 24 }}>{[1,2,3].map(i => <SkeletonCard key={i} height={200} />)}</div>
          </div>
        ) : !selectedTripId ? (
          <Dashboard trips={trips} onSelectTrip={handleSelectTrip} onNewTrip={() => setShowNewTrip(true)} />
        ) : selectedTrip ? (
          <TripDetail
            trip={selectedTrip} activeTab={activeTab} onTabChange={setActiveTab}
            updateTrip={async (id: string, data: any) => { await updateTrip(id, data); toast('Viaje actualizado', 'success') }}
            deleteTrip={async (id: string) => { await deleteTrip(id); setSelectedTripId(null); toast('Viaje eliminado', 'info') }}
          />
        ) : null}
      </div>

      {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} onSave={async data => { await createTrip(data); setShowNewTrip(false); toast('¡Viaje creado! ✈️', 'success') }} />}
    </div>
  )
}

/* ── DASHBOARD ── */
function Dashboard({ trips, onSelectTrip, onNewTrip }: any) {
  const ongoing = trips.filter((t: any) => t.status === 'en curso').length
  const upcoming = trips.filter((t: any) => t.status === 'planificado').length
  const finished = trips.filter((t: any) => t.status === 'finalizado').length
  const statusConfig: Record<string, any> = {
    planificado: { label: 'Planificado', bg: 'rgba(74,127,165,0.1)', color: '#4a7fa5' },
    'en curso': { label: 'En Curso', bg: 'rgba(74,124,89,0.1)', color: '#4a7c59' },
    finalizado: { label: 'Finalizado', bg: 'rgba(138,138,170,0.1)', color: '#8a8aaa' },
  }
  return (
    <div className="responsive-padding" style={{ padding: '52px 56px 64px' }}>
      <div className="fade-up" style={{ marginBottom: 52, borderBottom: '1px solid var(--border)', paddingBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 16 }}>Bienvenido a WanderKit</div>
        <div className="responsive-text-sm" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 300, color: 'var(--navy)', lineHeight: 1, letterSpacing: '-0.02em' }}>
          Tus <em style={{ color: '#b87333', fontStyle: 'italic' }}>aventuras,</em><br />organizadas.
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-mid)', marginTop: 16, fontWeight: 300, maxWidth: 480, lineHeight: 1.6 }}>Planifica cada detalle, registra lo que viviste y recuerda cada viaje para siempre.</div>
        <button className="btn-press fade-up-1" onClick={onNewTrip} style={{ marginTop: 28, padding: '14px 28px', background: '#b87333', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 20px rgba(184,115,51,0.35)' }}>＋ Nuevo viaje</button>
      </div>
      <div className="fade-up-2 responsive-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, marginBottom: 52, background: 'var(--border)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {[{ num: trips.length, label: 'Total viajes' }, { num: ongoing, label: 'En curso' }, { num: upcoming, label: 'Planificados' }, { num: finished, label: 'Finalizados' }].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: '24px 28px' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}><AnimatedNumber value={s.num} /></div>
            <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {trips.length > 0 && (
        <>
          <div className="fade-up-3" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: 'var(--navy)' }}>Mis viajes</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{trips.length} viaje{trips.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 22 }}>
            {trips.map((t: any, i: number) => {
              const sc = statusConfig[t.status] || statusConfig.planificado
              const color = tripColors[t.color_idx ?? i % tripColors.length]
              return (
                <div key={t.id} className={`card-hover fade-up-${Math.min(i + 3, 6)}`} onClick={() => onSelectTrip(t.id)} style={{ background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ height: 120, padding: '18px 22px', background: `linear-gradient(135deg, ${color}12, ${color}25)`, borderBottom: `3px solid ${color}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 36, opacity: 0.4 }}>🌍</span>
                    <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div style={{ padding: '20px 22px 22px' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 400, color: 'var(--navy)', lineHeight: 1.2 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 5 }}>📍 {t.destination}</div>
                    <div style={{ display: 'flex', gap: 18, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-light)' }}>
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
      {trips.length === 0 && (
        <div className="fade-up-3" style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: 20, border: '1px dashed var(--border)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: 'var(--navy)', fontWeight: 300, marginBottom: 12 }}>Tu próxima aventura te espera</div>
          <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 28 }}>Crea tu primer viaje para comenzar</div>
          <button className="btn-press" onClick={onNewTrip} style={{ padding: '12px 28px', background: '#b87333', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 20px rgba(184,115,51,0.3)' }}>＋ Crear primer viaje</button>
        </div>
      )}
    </div>
  )
}

/* ── TRIP DETAIL ── */
function TripDetail({ trip, activeTab, onTabChange, updateTrip, deleteTrip }: any) {
  const { items, loading, addItem, updateItem, deleteItem } = useTripItems(trip.id)
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabs = [
    { id: 'overview', label: 'Resumen' }, { id: 'flights', label: '✈️ Vuelos' },
    { id: 'itinerary', label: 'Itinerario' }, { id: 'expenses', label: 'Gastos' },
    { id: 'places', label: 'Lugares' }, { id: 'documents', label: 'Documentos' },
    { id: 'checklist', label: 'Equipaje' }, { id: 'proposals', label: 'Propuestas' },
    { id: 'journal', label: 'Diario' }, { id: 'summary', label: 'Post-viaje' },
  ]
  const handleTabChange = (id: string) => {
    onTabChange(id)
    const tabEl = tabsRef.current?.querySelector(`[data-tab="${id}"]`) as HTMLElement
    tabEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
  const wrapItem = async (fn: () => Promise<any>, msg: string) => { await fn(); toast(msg, 'success') }
  const wrappedAdd = (type: string, data: any) => wrapItem(() => addItem(type, data), 'Agregado')
  const wrappedUpdate = (type: string, data: any) => wrapItem(() => updateItem(type, data), 'Guardado')
  const wrappedDelete = (type: string, id: string) => wrapItem(() => deleteItem(type, id), 'Eliminado')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="trip-header-responsive no-print" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, padding: '28px 52px 0' }}>
        <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 8 }}>
              {trip.status === 'en curso' ? '🟢 En curso' : trip.status === 'finalizado' ? '🏁 Finalizado' : '📋 Planificado'} · {trip.destination}
            </div>
            <div className="trip-title-responsive" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: 'var(--navy)', lineHeight: 1, letterSpacing: '-0.01em' }}>{trip.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6 }}>{trip.start_date} → {trip.end_date} · {fmtCurrency(trip.budget, trip.currency)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-press" onClick={() => window.print()} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--text-mid)' }}>🖨️ PDF</button>
            <button className="btn-press" onClick={() => { if (confirm('¿Eliminar este viaje y todo su contenido?')) deleteTrip(trip.id) }} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid rgba(196,92,92,0.3)', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#c45c5c' }}>🗑</button>
            <select value={trip.status} onChange={e => updateTrip(trip.id, { ...trip, status: e.target.value })} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-input)', color: 'var(--text-mid)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}>
              <option value="planificado">Planificado</option>
              <option value="en curso">En Curso</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div ref={tabsRef} style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {tabs.map(t => (
              <button key={t.id} data-tab={t.id} onClick={() => handleTabChange(t.id)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', flexShrink: 0, borderBottom: activeTab === t.id ? '2px solid #b87333' : '2px solid transparent', color: activeTab === t.id ? 'var(--navy)' : 'var(--text-light)', transition: 'all 0.2s', marginBottom: -1 }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to left, var(--bg-card), transparent)', pointerEvents: 'none' }} />
        </div>
      </div>
      <div className="tab-content-responsive fade-in" key={activeTab} style={{ padding: '36px 52px 64px', flex: 1 }}>
        {loading ? (activeTab === 'overview' ? <SkeletonOverview /> : <SkeletonList />) : (
          <>
            {activeTab === 'overview' && <TabOverview trip={trip} items={items} />}
            {activeTab === 'flights' && <TabFlights trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
            {activeTab === 'itinerary' && <TabItinerary trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
            {activeTab === 'expenses' && <TabExpenses trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
            {activeTab === 'places' && <TabPlaces trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
            {activeTab === 'documents' && <TabDocuments trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
            {activeTab === 'checklist' && <TabChecklist trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
            {activeTab === 'proposals' && <TabProposals trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
            {activeTab === 'journal' && <TabJournal trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
            {activeTab === 'summary' && <TabSummary trip={trip} items={items} />}
          </>
        )}
      </div>
    </div>
  )
}

/* ── TAB OVERVIEW ── */
function TabOverview({ trip, items }: any) {
  const totalEst = items?.expenses?.reduce((s: number, e: any) => s + (e.estimated || 0), 0) || 0
  const totalReal = items?.expenses?.reduce((s: number, e: any) => s + (e.real || 0), 0) || 0
  const budget = trip.budget || totalEst || 1
  const pct = Math.min(120, Math.round(totalReal / budget * 100))
  const diff = totalReal - totalEst
  const done = items?.itinerary?.filter((a: any) => a.status === 'realizado').length || 0
  const totalActs = items?.itinerary?.length || 0
  const visited = items?.places?.filter((p: any) => p.visited).length || 0
  const checkTotal = items?.checklist?.length || 0
  const checkDone = items?.checklist?.filter((i: any) => i.checked).length || 0
  const flightsCount = items?.flights?.length || 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div className="fade-up" style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', borderRadius: 16, padding: '28px 32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 20 }}>Presupuesto — Plan vs Real</div>
        <div className="responsive-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: totalReal > 0 ? 24 : 0 }}>
          {[
            { label: 'Estimado', value: fmtCurrency(totalEst || budget, trip.currency), accent: '#4a7fa5', bg: 'rgba(74,127,165,0.05)', border: 'rgba(74,127,165,0.15)' },
            { label: 'Real gastado', value: fmtCurrency(totalReal, trip.currency), accent: '#4a7c59', bg: 'rgba(74,124,89,0.05)', border: 'rgba(74,124,89,0.15)' },
            { label: 'Diferencia', value: `${diff > 0 ? '+' : ''}${fmtCurrency(diff, trip.currency)}`, accent: diff > 0 ? '#c45c5c' : '#4a7c59', bg: diff > 0 ? 'rgba(196,92,92,0.05)' : 'rgba(74,124,89,0.05)', border: diff > 0 ? 'rgba(196,92,92,0.15)' : 'rgba(74,124,89,0.15)' },
          ].map((col, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRadius: 12, background: col.bg, border: `1px solid ${col.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: col.accent, marginBottom: 8 }}>{col.label}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>{col.value}</div>
            </div>
          ))}
        </div>
        {totalReal > 0 && (
          <>
            <div style={{ background: 'var(--bg-cream-dark)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 4, background: pct > 100 ? '#c45c5c' : pct > 80 ? '#b87333' : '#4a7c59', transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-light)' }}>
              <span><AnimatedNumber value={pct} />% del presupuesto usado</span>
              <span style={{ fontWeight: 600, color: diff > 0 ? '#c45c5c' : '#4a7c59' }}>{diff > 0 ? `+${fmtCurrency(diff)} sobre estimado` : diff < 0 ? `${fmtCurrency(Math.abs(diff))} ahorrado` : 'Exacto'}</span>
            </div>
          </>
        )}
      </div>
      {[
        { label: 'Vuelos', num: flightsCount, total: null, color: '#4a7fa5', sub: 'registrados', delay: 'fade-up' },
        { label: 'Actividades', num: done, total: totalActs, color: '#4a7fa5', sub: 'realizadas', delay: 'fade-up-1' },
        { label: 'Lugares', num: visited, total: items?.places?.length || 0, color: '#4a7c59', sub: 'visitados', delay: 'fade-up-2' },
        { label: 'Equipaje', num: checkDone, total: checkTotal, color: '#b87333', sub: 'ítems listos', delay: 'fade-up-3' },
      ].map((item, i) => (
        <div key={i} className={item.delay} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '24px 26px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 16 }}>{item.label}</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>
            <AnimatedNumber value={item.num} />
            {item.total !== null && <span style={{ fontSize: 28, color: 'var(--text-light)' }}>/{item.total}</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 6 }}>{item.sub}</div>
          {item.total !== null && item.total > 0 && (
            <div style={{ background: 'var(--bg-cream-dark)', borderRadius: 3, height: 4, overflow: 'hidden', marginTop: 16 }}>
              <div style={{ width: `${Math.round(item.num / item.total * 100)}%`, height: '100%', borderRadius: 3, background: item.color, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── TAB FLIGHTS ── */
function TabFlights({ trip, items, addItem, updateItem, deleteItem }: any) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const flights = items?.flights || []
  const ida = flights.filter((f: any) => f.type === 'ida')
  const regreso = flights.filter((f: any) => f.type === 'regreso')

  const FlightCard = ({ flight }: { flight: any }) => (
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '22px 26px', marginBottom: 14, boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', background: flight.type === 'ida' ? 'rgba(74,127,165,0.1)' : 'rgba(74,124,89,0.1)', color: flight.type === 'ida' ? '#4a7fa5' : '#4a7c59' }}>
            {flight.type === 'ida' ? '✈️ Vuelo de ida' : '🔄 Vuelo de regreso'}
          </div>
          {flight.airline && <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>{flight.airline} {flight.flight_number}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <IBtn onClick={() => { setEditing(flight); setShowModal(true) }}>✏️</IBtn>
          <IBtn onClick={() => deleteItem('flights', flight.id)} color="#c45c5c">🗑</IBtn>
        </div>
      </div>

      {/* Route visualization */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>{flight.origin_airport || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>{flight.origin_city}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{flight.departure_date} · {flight.departure_time}</div>
        </div>
        <div style={{ display: 'flex', flex: 1.5, alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <div style={{ fontSize: 18 }}>{flight.has_layover ? '🔀' : '✈️'}</div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>{flight.destination_airport || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>{flight.destination_city}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{flight.arrival_date} · {flight.arrival_time}</div>
        </div>
      </div>

      {/* Layover */}
      {flight.has_layover === 1 && (
        <div style={{ padding: '10px 14px', background: 'rgba(184,115,51,0.06)', border: '1px solid rgba(184,115,51,0.15)', borderRadius: 10, fontSize: 13, color: 'var(--text-mid)' }}>
          🔀 <strong>Escala en {flight.layover_airport || '—'}</strong>{flight.layover_duration ? ` · Duración: ${flight.layover_duration}` : ''}
        </div>
      )}
      {flight.notes && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>{flight.notes}</div>}
    </div>
  )

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>{flights.length} vuelo{flights.length !== 1 ? 's' : ''} registrado{flights.length !== 1 ? 's' : ''}</div>
        <Btn2 onClick={() => { setEditing(null); setShowModal(true) }} primary>＋ Agregar vuelo</Btn2>
      </div>

      {flights.length === 0 && <EmptyState icon="✈️" title="Sin vuelos registrados" sub="Agrega los detalles de tu vuelo de ida y regreso" />}

      {ida.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 14 }}>Vuelo de ida</div>
          {ida.map((f: any) => <FlightCard key={f.id} flight={f} />)}
        </div>
      )}
      {regreso.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 14 }}>Vuelo de regreso</div>
          {regreso.map((f: any) => <FlightCard key={f.id} flight={f} />)}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Editar vuelo' : 'Nuevo vuelo'} onClose={() => { setShowModal(false); setEditing(null) }}>
          <FlightForm flight={editing} onSave={async data => {
            editing ? await updateItem('flights', { ...editing, ...data }) : await addItem('flights', data)
            setShowModal(false); setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function FlightForm({ flight, onSave }: any) {
  const [f, setF] = useState({
    type: flight?.type || 'ida',
    airline: flight?.airline || '',
    flightNumber: flight?.flight_number || '',
    originAirport: flight?.origin_airport || '',
    originCity: flight?.origin_city || '',
    destinationAirport: flight?.destination_airport || '',
    destinationCity: flight?.destination_city || '',
    departureDate: flight?.departure_date || '',
    departureTime: flight?.departure_time || '',
    arrivalDate: flight?.arrival_date || '',
    arrivalTime: flight?.arrival_time || '',
    hasLayover: flight?.has_layover === 1 || false,
    layoverAirport: flight?.layover_airport || '',
    layoverDuration: flight?.layover_duration || '',
    notes: flight?.notes || '',
  })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }

  return (
    <div>
      <FG label="Tipo de vuelo">
        <select className="form-input" value={f.type} onChange={e => s('type', e.target.value)}>
          <option value="ida">✈️ Vuelo de ida</option>
          <option value="regreso">🔄 Vuelo de regreso</option>
        </select>
      </FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Aerolínea"><input className="form-input" value={f.airline} onChange={e => s('airline', e.target.value)} onKeyDown={handleKey} placeholder="Ej: LATAM, American Airlines" /></FG>
        <FG label="N° de vuelo"><input className="form-input" value={f.flightNumber} onChange={e => s('flightNumber', e.target.value)} onKeyDown={handleKey} placeholder="Ej: LA800" /></FG>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-light)', margin: '16px 0 10px' }}>Origen</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Código aeropuerto"><input className="form-input" value={f.originAirport} onChange={e => s('originAirport', e.target.value.toUpperCase())} onKeyDown={handleKey} placeholder="Ej: SCL" maxLength={4} /></FG>
        <FG label="Ciudad"><input className="form-input" value={f.originCity} onChange={e => s('originCity', e.target.value)} onKeyDown={handleKey} placeholder="Ej: Santiago" /></FG>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Fecha de salida"><input className="form-input" type="date" value={f.departureDate} onChange={e => s('departureDate', e.target.value)} /></FG>
        <FG label="Hora de salida"><input className="form-input" type="time" value={f.departureTime} onChange={e => s('departureTime', e.target.value)} /></FG>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-light)', margin: '16px 0 10px' }}>Destino</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Código aeropuerto"><input className="form-input" value={f.destinationAirport} onChange={e => s('destinationAirport', e.target.value.toUpperCase())} onKeyDown={handleKey} placeholder="Ej: GIG" maxLength={4} /></FG>
        <FG label="Ciudad"><input className="form-input" value={f.destinationCity} onChange={e => s('destinationCity', e.target.value)} onKeyDown={handleKey} placeholder="Ej: Río de Janeiro" /></FG>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Fecha de llegada"><input className="form-input" type="date" value={f.arrivalDate} onChange={e => s('arrivalDate', e.target.value)} /></FG>
        <FG label="Hora de llegada"><input className="form-input" type="time" value={f.arrivalTime} onChange={e => s('arrivalTime', e.target.value)} /></FG>
      </div>
      <div style={{ margin: '16px 0', padding: '14px 16px', background: 'var(--bg-cream)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={f.hasLayover} onChange={e => s('hasLayover', e.target.checked)} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Este vuelo tiene escala</span>
        </label>
        {f.hasLayover && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            <FG label="Aeropuerto de escala"><input className="form-input" value={f.layoverAirport} onChange={e => s('layoverAirport', e.target.value)} onKeyDown={handleKey} placeholder="Ej: MIA - Miami" /></FG>
            <FG label="Duración de escala"><input className="form-input" value={f.layoverDuration} onChange={e => s('layoverDuration', e.target.value)} onKeyDown={handleKey} placeholder="Ej: 2h 30min" /></FG>
          </div>
        )}
      </div>
      <FG label="Notas adicionales"><textarea className="form-input" rows={2} value={f.notes} onChange={e => s('notes', e.target.value)} placeholder="Número de reserva, asiento, equipaje incluido..." /></FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn2 onClick={() => (f.originAirport || f.originCity) && onSave(f)} primary>{flight ? 'Guardar cambios' : 'Agregar vuelo'}</Btn2>
      </div>
    </div>
  )
}

/* ── TAB ITINERARY ── */
function TabItinerary({ trip, items, addItem, updateItem, deleteItem }: any) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const itinerary = items?.itinerary || []
  const days = [...new Set(itinerary.map((a: any) => a.day))].sort((a: any, b: any) => a - b) as number[]
  if (days.length === 0) days.push(1)

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { count: itinerary.filter((a: any) => a.status === 'realizado').length, label: 'realizadas', color: '#4a7c59' },
            { count: itinerary.filter((a: any) => a.status === 'pendiente').length, label: 'pendientes', color: '#b87333' },
            { count: itinerary.filter((a: any) => a.status === 'cancelado').length, label: 'canceladas', color: '#c45c5c' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.count}</span>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.label}</span>
            </div>
          ))}
        </div>
        <Btn2 onClick={() => { setEditing(null); setShowModal(true) }} primary>＋ Actividad</Btn2>
      </div>
      {days.map(day => {
        const acts = itinerary.filter((a: any) => a.day === day).sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))
        return (
          <div key={day} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: 'var(--navy)' }}>Día {day}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{acts.length} actividad{acts.length !== 1 ? 'es' : ''}</div>
            </div>
            {acts.map((act: any) => (
              <div key={act.id} className="row-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 14, marginBottom: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', borderLeft: `4px solid ${act.status === 'realizado' ? '#4a7c59' : act.status === 'cancelado' ? '#c45c5c' : '#b87333'}`, opacity: act.status === 'cancelado' ? 0.6 : 1, transition: 'all 0.15s' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: act.status === 'realizado' ? 'rgba(74,124,89,0.1)' : act.status === 'cancelado' ? 'rgba(196,92,92,0.1)' : 'rgba(184,115,51,0.1)' }}>
                  {act.status === 'realizado' ? '✅' : act.status === 'cancelado' ? '❌' : '⏳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{act.name}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-light)', flexWrap: 'wrap' }}>
                    {act.time && <span>🕐 Plan: {act.time}</span>}
                    {act.time_real && <span style={{ color: '#4a7c59', fontWeight: 500 }}>✅ Real: {act.time_real}</span>}
                    <span style={{ background: 'var(--bg-cream-dark)', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{act.type}</span>
                  </div>
                  {act.note && <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-cream)', borderRadius: 8, borderLeft: '3px solid var(--border)', fontSize: 13, color: 'var(--text-mid)', fontStyle: 'italic' }}>"{act.note}"</div>}
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {act.status !== 'realizado' && <IBtn onClick={() => updateItem('itinerary', { ...act, status: 'realizado' })} color="#4a7c59">✓</IBtn>}
                  {act.status !== 'cancelado' && <IBtn onClick={() => updateItem('itinerary', { ...act, status: 'cancelado' })} color="#c45c5c">✕</IBtn>}
                  {act.status !== 'pendiente' && <IBtn onClick={() => updateItem('itinerary', { ...act, status: 'pendiente' })}>↺</IBtn>}
                  <IBtn onClick={() => { setEditing(act); setShowModal(true) }}>✏️</IBtn>
                  <IBtn onClick={() => deleteItem('itinerary', act.id)} color="#c45c5c">🗑</IBtn>
                </div>
              </div>
            ))}
          </div>
        )
      })}
      {showModal && (
        <Modal title={editing ? 'Editar actividad' : 'Nueva actividad'} onClose={() => { setShowModal(false); setEditing(null) }}>
          <ActivityForm activity={editing} onSave={async data => {
            editing ? await updateItem('itinerary', { ...editing, ...data }) : await addItem('itinerary', data)
            setShowModal(false); setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function ActivityForm({ activity, onSave }: any) {
  const [f, setF] = useState({ name: activity?.name || '', day: activity?.day || 1, time: activity?.time || '', time_real: activity?.time_real || '', type: activity?.type || 'actividades', status: activity?.status || 'pendiente', note: activity?.note || '' })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  /* FIX: prevenir submit al presionar Enter en inputs de texto */
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }

  return (
    <div>
      <FG label="Nombre de la actividad">
        <input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={handleKey} placeholder="Ej: Visita al Cristo Redentor" autoFocus />
      </FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Día"><input className="form-input" type="number" min="1" value={f.day} onChange={e => s('day', parseInt(e.target.value) || 1)} onKeyDown={handleKey} /></FG>
        <FG label="Tipo">
          <select className="form-input" value={f.type} onChange={e => s('type', e.target.value)}>
            {['actividades','alojamiento','transporte','comida','otros'].map(t => <option key={t}>{t}</option>)}
          </select>
        </FG>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Hora planificada"><input className="form-input" type="time" value={f.time} onChange={e => s('time', e.target.value)} /></FG>
        <FG label="Hora real"><input className="form-input" type="time" value={f.time_real} onChange={e => s('time_real', e.target.value)} /></FG>
      </div>
      <FG label="Estado">
        <select className="form-input" value={f.status} onChange={e => s('status', e.target.value)}>
          <option value="pendiente">⏳ Pendiente</option>
          <option value="realizado">✅ Realizado</option>
          <option value="cancelado">❌ Cancelado</option>
        </select>
      </FG>
      <FG label="Notas — cómo fue realmente">
        <textarea className="form-input" rows={3} value={f.note} onChange={e => s('note', e.target.value)} placeholder="Ej: Llegamos tarde pero valió la pena..." />
      </FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn2 onClick={() => f.name && onSave(f)} primary>{activity ? 'Guardar cambios' : 'Agregar actividad'}</Btn2>
      </div>
    </div>
  )
}

/* ── TAB EXPENSES ── */
function TabExpenses({ trip, items, addItem, updateItem, deleteItem }: any) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const expenses = items?.expenses || []
  const categoryEmoji: Record<string, string> = { alojamiento: '🏨', transporte: '✈️', comida: '🍽️', actividades: '🎭', compras: '🛍️', otros: '📌' }
  const totalEst = expenses.reduce((s: number, e: any) => s + (e.estimated || 0), 0)
  const totalReal = expenses.reduce((s: number, e: any) => s + (e.real || 0), 0)
  const diff = totalReal - totalEst

  return (
    <div className="fade-in">
      <div className="responsive-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Estimado total', value: fmtCurrency(totalEst, trip.currency), color: '#4a7fa5' },
          { label: 'Real gastado', value: fmtCurrency(totalReal, trip.currency), color: '#4a7c59' },
          { label: 'Diferencia', value: `${diff > 0 ? '+' : ''}${fmtCurrency(diff, trip.currency)}`, color: diff > 0 ? '#c45c5c' : '#4a7c59' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '20px 22px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <Btn2 onClick={() => { setEditing(null); setShowModal(true) }} primary>＋ Gasto</Btn2>
      </div>
      {expenses.length === 0 && <EmptyState icon="💰" title="Sin gastos registrados" sub="Agrega tu primer gasto estimado o real" />}
      {expenses.map((exp: any) => {
        const d = (exp.real || 0) - (exp.estimated || 0)
        return (
          <div key={exp.id} className="row-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 10, boxShadow: 'var(--shadow-card)', flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'var(--bg-cream)', flexShrink: 0 }}>{categoryEmoji[exp.category] || '📌'}</div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{exp.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2, textTransform: 'capitalize' }}>{exp.category}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                {exp.persons > 1 && <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>👥 {exp.persons} personas</span>}
                {exp.paid_by && <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>💳 Pagó: {exp.paid_by}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Estimado</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--text-light)', fontWeight: 300 }}>{fmtCurrency(exp.estimated, trip.currency)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Real</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: 'var(--navy)', fontWeight: 400 }}>{exp.real != null ? fmtCurrency(exp.real, trip.currency) : '—'}</div>
              </div>
              {exp.real != null && <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: d > 0 ? 'rgba(196,92,92,0.1)' : 'rgba(74,124,89,0.1)', color: d > 0 ? '#c45c5c' : '#4a7c59' }}>{d > 0 ? `+${fmtCurrency(d)}` : fmtCurrency(d)}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <IBtn onClick={() => { setEditing(exp); setShowModal(true) }}>✏️</IBtn>
              <IBtn onClick={() => deleteItem('expenses', exp.id)} color="#c45c5c">🗑</IBtn>
            </div>
          </div>
        )
      })}
      {showModal && (
        <Modal title={editing ? 'Editar gasto' : 'Nuevo gasto'} onClose={() => { setShowModal(false); setEditing(null) }}>
          <ExpenseForm expense={editing} currency={trip.currency} onSave={async data => {
            editing ? await updateItem('expenses', { ...editing, ...data }) : await addItem('expenses', data)
            setShowModal(false); setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function ExpenseForm({ expense, currency, onSave }: any) {
  const [f, setF] = useState({ name: expense?.name || '', category: expense?.category || 'otros', estimated: expense?.estimated ?? '', real: expense?.real ?? '', persons: expense?.persons || 1, paidBy: expense?.paid_by || '' })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }

  return (
    <div>
      <FG label="Descripción"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={handleKey} autoFocus /></FG>
      <FG label="Categoría">
        <select className="form-input" value={f.category} onChange={e => s('category', e.target.value)}>
          {['alojamiento','transporte','comida','actividades','compras','otros'].map(c => <option key={c}>{c}</option>)}
        </select>
      </FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label={`Estimado (${currency})`}><input className="form-input" type="number" min="0" value={f.estimated} onChange={e => s('estimated', e.target.value)} onKeyDown={handleKey} /></FG>
        <FG label={`Real (${currency})`}><input className="form-input" type="number" min="0" value={f.real} onChange={e => s('real', e.target.value)} onKeyDown={handleKey} placeholder="Vacío si no se sabe" /></FG>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="N° de personas">
          <select className="form-input" value={f.persons} onChange={e => s('persons', parseInt(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n === 1 ? '👤 1 persona' : `👥 ${n} personas`}</option>)}
          </select>
        </FG>
        <FG label="¿Quién pagó?"><input className="form-input" value={f.paidBy} onChange={e => s('paidBy', e.target.value)} onKeyDown={handleKey} placeholder="Ej: Ezequiel, todos, etc." /></FG>
      </div>
      {f.persons > 1 && f.real !== '' && (
        <div style={{ padding: '10px 14px', background: 'rgba(74,127,165,0.06)', border: '1px solid rgba(74,127,165,0.15)', borderRadius: 10, fontSize: 13, color: 'var(--text-mid)', marginBottom: 8 }}>
          💡 Por persona: <strong style={{ color: 'var(--navy)' }}>{fmtCurrency(parseFloat(f.real as string) / f.persons)}</strong>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn2 onClick={() => f.name && onSave({ ...f, estimated: f.estimated !== '' ? parseFloat(f.estimated as string) : null, real: f.real !== '' ? parseFloat(f.real as string) : null })} primary>{expense ? 'Guardar' : 'Agregar'}</Btn2>
      </div>
    </div>
  )
}

/* ── TAB PLACES ── */
function TabPlaces({ trip, items, addItem, updateItem, deleteItem }: any) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [mapPlace, setMapPlace] = useState<any>(null)
  const places = items?.places || []

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: 'var(--navy)' }}><AnimatedNumber value={places.filter((p: any) => p.visited).length} /></span>
          <span style={{ fontSize: 13, color: 'var(--text-light)' }}>/ {places.length} visitados</span>
        </div>
        <Btn2 onClick={() => { setEditing(null); setShowModal(true) }} primary>＋ Lugar</Btn2>
      </div>

      {places.length === 0 && <EmptyState icon="📍" title="Sin lugares guardados" sub="Agrega los destinos que quieres visitar" />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {places.map((place: any) => (
          <div key={place.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', borderTop: `4px solid ${place.visited ? '#4a7c59' : 'var(--border)'}` }}>

            {/* OpenStreetMap embed */}
            {place.lat && place.lng && (
              <div style={{ position: 'relative', height: 140, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setMapPlace(mapPlace?.id === place.id ? null : place)}>
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.lng - 0.01},${place.lat - 0.01},${place.lng + 0.01},${place.lat + 0.01}&layer=mapnik&marker=${place.lat},${place.lng}`}
                  style={{ width: '100%', height: '100%', border: 'none', pointerEvents: mapPlace?.id === place.id ? 'auto' : 'none' }}
                  loading="lazy"
                />
                {mapPlace?.id !== place.id && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(1px)' }}>
                    <span style={{ background: 'white', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#1a2744', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>🗺️ Ver mapa</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{place.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 3 }}>📍 {place.type}</div>
                  {place.lat && place.lng && (
                    <a href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: '#4a7fa5', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                      🔗 Ver en OpenStreetMap
                    </a>
                  )}
                </div>
                <IBtn onClick={() => { setEditing(place); setShowModal(true) }}>✏️</IBtn>
              </div>
              {place.note && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>{place.note}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg-cream)' }}>
              <div style={{ color: '#b87333', fontSize: 15, letterSpacing: 2 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ opacity: s <= place.rating ? 1 : 0.18, cursor: 'pointer', transition: 'opacity 0.15s' }} onClick={() => updateItem('places', { ...place, rating: s })}>★</span>)}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span onClick={() => updateItem('places', { ...place, visited: place.visited ? 0 : 1 })}
                  style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s', background: place.visited ? 'rgba(74,124,89,0.12)' : 'rgba(138,138,170,0.08)', color: place.visited ? '#4a7c59' : 'var(--text-light)' }}>
                  {place.visited ? '✓ Visitado' : 'No visitado'}
                </span>
                <IBtn onClick={() => deleteItem('places', place.id)} color="#c45c5c">🗑</IBtn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? 'Editar lugar' : 'Nuevo lugar'} onClose={() => { setShowModal(false); setEditing(null) }}>
          <PlaceForm place={editing} onSave={async data => {
            editing ? await updateItem('places', { ...editing, ...data }) : await addItem('places', data)
            setShowModal(false); setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function PlaceForm({ place, onSave }: any) {
  const [f, setF] = useState({ name: place?.name || '', type: place?.type || 'Atracción', note: place?.note || '', rating: place?.rating || 0, visited: place?.visited || 0, lat: place?.lat || '', lng: place?.lng || '' })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }

  return (
    <div>
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={handleKey} autoFocus /></FG>
      <FG label="Tipo"><input className="form-input" value={f.type} onChange={e => s('type', e.target.value)} onKeyDown={handleKey} placeholder="Monumento, Playa, Restaurante..." /></FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Latitud"><input className="form-input" type="number" step="any" value={f.lat} onChange={e => s('lat', e.target.value)} placeholder="-22.9519" /></FG>
        <FG label="Longitud"><input className="form-input" type="number" step="any" value={f.lng} onChange={e => s('lng', e.target.value)} placeholder="-43.2105" /></FG>
      </div>
      {f.lat && f.lng && (
        <div style={{ marginBottom: 14, borderRadius: 10, overflow: 'hidden', height: 160, border: '1px solid var(--border)' }}>
          <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${f.lng - 0.01},${f.lat - 0.01},${parseFloat(f.lng as string) + 0.01},${parseFloat(f.lat as string) + 0.01}&layer=mapnik&marker=${f.lat},${f.lng}`} style={{ width: '100%', height: '100%', border: 'none' }} loading="lazy" />
        </div>
      )}
      <div style={{ padding: '10px 14px', background: 'rgba(74,127,165,0.06)', border: '1px solid rgba(74,127,165,0.15)', borderRadius: 10, fontSize: 12, color: 'var(--text-mid)', marginBottom: 14 }}>
        💡 Para obtener coordenadas: busca el lugar en <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" style={{ color: '#4a7fa5' }}>openstreetmap.org</a>, haz click derecho y copia las coordenadas.
      </div>
      <FG label="Nota personal"><textarea className="form-input" rows={2} value={f.note} onChange={e => s('note', e.target.value)} /></FG>
      <FG label="Calificación">
        <div style={{ display: 'flex', gap: 10 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 28, cursor: 'pointer', color: n <= f.rating ? '#b87333' : 'var(--border)', transition: 'all 0.15s' }} onClick={() => s('rating', n)}>★</span>)}</div>
      </FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn2 onClick={() => f.name && onSave({ ...f, lat: f.lat ? parseFloat(f.lat as string) : null, lng: f.lng ? parseFloat(f.lng as string) : null })} primary>{place ? 'Guardar' : 'Agregar'}</Btn2>
      </div>
    </div>
  )
}

/* ── TAB DOCUMENTS ── */
function TabDocuments({ trip, items, addItem, updateItem, deleteItem }: any) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const documents = items?.documents || []
  const docTypes: Record<string, string> = { vuelo: '✈️', hotel: '🏨', seguro: '🛡️', tour: '🎟️', visa: '📋', otro: '📄' }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Btn2 onClick={() => { setEditing(null); setShowModal(true) }} primary>＋ Documento</Btn2>
      </div>
      {documents.length === 0 && <EmptyState icon="📂" title="Sin documentos" sub="Agrega links a reservas, pasajes y seguros" />}
      {documents.map((doc: any) => (
        <div key={doc.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 10, boxShadow: 'var(--shadow-card)', flexWrap: 'wrap' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--bg-cream)', flexShrink: 0 }}>{docTypes[doc.type] || '📄'}</div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{doc.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2, textTransform: 'capitalize' }}>{doc.type}</div>
            {doc.notes && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 3 }}>{doc.notes}</div>}
            {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#4a7fa5', textDecoration: 'none', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>🔗 Abrir enlace</a>}
          </div>
          <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: doc.status === 'activo' ? 'rgba(74,124,89,0.1)' : 'rgba(138,138,170,0.08)', color: doc.status === 'activo' ? '#4a7c59' : 'var(--text-light)' }}>{doc.status}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <IBtn onClick={() => { setEditing(doc); setShowModal(true) }}>✏️</IBtn>
            <IBtn onClick={() => deleteItem('documents', doc.id)} color="#c45c5c">🗑</IBtn>
          </div>
        </div>
      ))}
      {showModal && (
        <Modal title={editing ? 'Editar documento' : 'Nuevo documento'} onClose={() => { setShowModal(false); setEditing(null) }}>
          <DocForm doc={editing} onSave={async data => {
            editing ? await updateItem('documents', { ...editing, ...data }) : await addItem('documents', data)
            setShowModal(false); setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function DocForm({ doc, onSave }: any) {
  const [f, setF] = useState({ name: doc?.name || '', type: doc?.type || 'otro', url: doc?.url || '', status: doc?.status || 'activo', notes: doc?.notes || '' })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={handleKey} placeholder="Ej: Vuelo LAX → GIG" autoFocus /></FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Tipo">
          <select className="form-input" value={f.type} onChange={e => s('type', e.target.value)}>
            {['vuelo','hotel','seguro','tour','visa','otro'].map(t => <option key={t}>{t}</option>)}
          </select>
        </FG>
        <FG label="Estado">
          <select className="form-input" value={f.status} onChange={e => s('status', e.target.value)}>
            <option value="activo">✅ Activo</option>
            <option value="usado">📌 Usado</option>
            <option value="vencido">⚫ Vencido</option>
          </select>
        </FG>
      </div>
      <FG label="URL"><input className="form-input" type="url" value={f.url} onChange={e => s('url', e.target.value)} placeholder="https://..." /></FG>
      <FG label="Notas"><textarea className="form-input" rows={2} value={f.notes} onChange={e => s('notes', e.target.value)} /></FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn2 onClick={() => f.name && onSave(f)} primary>{doc ? 'Guardar' : 'Agregar'}</Btn2>
      </div>
    </div>
  )
}

/* ── TAB CHECKLIST ── */
function TabChecklist({ trip, items, addItem, updateItem, deleteItem }: any) {
  const checklist = items?.checklist || []
  const categories = [...new Set(checklist.map((i: any) => i.category))] as string[]
  const total = checklist.length
  const done = checklist.filter((i: any) => i.checked).length
  const [newItemCat, setNewItemCat] = useState('')
  const [newItemText, setNewItemText] = useState('')

  const handleAddItem = async (cat: string) => {
    if (!newItemText.trim()) return
    await addItem('checklist', { category: cat, name: newItemText.trim(), checked: 0 })
    setNewItemText(''); setNewItemCat('')
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}><AnimatedNumber value={done} /></span>
          <span style={{ fontSize: 14, color: 'var(--text-light)' }}>/ {total} listos</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>{total > 0 ? Math.round(done/total*100) : 0}% empacado</span>
      </div>
      <div style={{ background: 'var(--bg-cream-dark)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ width: total > 0 ? `${Math.round(done/total*100)}%` : '0%', height: '100%', borderRadius: 4, background: '#b87333', transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 }}>
        {categories.map(cat => {
          const catItems = checklist.filter((i: any) => i.category === cat)
          const catDone = catItems.filter((i: any) => i.checked).length
          return (
            <div key={cat} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: catDone === catItems.length && catItems.length > 0 ? 'rgba(74,124,89,0.06)' : undefined }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{cat}</div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', padding: '3px 10px', background: 'var(--bg-cream)', borderRadius: 20 }}>{catDone}/{catItems.length}</div>
              </div>
              {catItems.map((item: any) => (
                <div key={item.id} className="row-hover" onClick={() => updateItem('checklist', { ...item, checked: item.checked ? 0 : 1 })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer', opacity: item.checked ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.checked ? '#4a7c59' : 'var(--border)'}`, background: item.checked ? '#4a7c59' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {item.checked && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', flex: 1, textDecoration: item.checked ? 'line-through' : 'none' }}>{item.name}</div>
                  <button onClick={e => { e.stopPropagation(); deleteItem('checklist', item.id) }} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 10, color: '#c45c5c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
              {/* Add item inline */}
              {newItemCat === cat ? (
                <div style={{ padding: '8px 14px', display: 'flex', gap: 8, borderBottom: '1px solid var(--border)' }}>
                  <input className="form-input" style={{ flex: 1, padding: '7px 10px', fontSize: 13 }} value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(cat) } }} placeholder="Nuevo ítem..." autoFocus />
                  <button className="btn-press" onClick={() => handleAddItem(cat)} style={{ padding: '7px 12px', background: '#b87333', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>+</button>
                  <button className="btn-press" onClick={() => { setNewItemCat(''); setNewItemText('') }} style={{ padding: '7px 12px', background: 'transparent', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>✕</button>
                </div>
              ) : (
                <div style={{ padding: '8px 18px' }}>
                  <button onClick={() => { setNewItemCat(cat); setNewItemText('') }} style={{ fontSize: 12, color: '#b87333', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>＋ Agregar ítem</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── TAB PROPOSALS ── */
function TabProposals({ trip, items, addItem, updateItem, deleteItem }: any) {
  const [showModal, setShowModal] = useState(false)
  const proposals = items?.proposals || []

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22 }}>
        <Btn2 onClick={() => setShowModal(true)} primary>＋ Propuesta</Btn2>
      </div>
      {proposals.length === 0 && <EmptyState icon="🗳" title="Sin propuestas" sub="Agrega ideas para votar con tu grupo" />}
      {proposals.map((p: any) => (
        <div key={p.id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px', marginBottom: 14, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{p.title}</div><div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4, lineHeight: 1.5 }}>{p.description}</div></div>
            <IBtn onClick={() => deleteItem('proposals', p.id)} color="#c45c5c">🗑</IBtn>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[['si','👍 Sí','#4a7c59'],['quizas','🤔 Quizás','#b87333'],['no','👎 No','#c45c5c']].map(([val,label,color]) => (
              <button key={val} className="btn-press" onClick={() => updateItem('proposals', { ...p, my_vote: p.my_vote === val ? null : val })}
                style={{ flex: 1, minWidth: 80, padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${p.my_vote === val ? color : 'var(--border)'}`, background: p.my_vote === val ? `${color}14` : 'var(--bg-input)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: p.my_vote === 'si' ? 'rgba(74,124,89,0.08)' : p.my_vote === 'no' ? 'rgba(196,92,92,0.08)' : 'rgba(184,115,51,0.08)', color: p.my_vote === 'si' ? '#4a7c59' : p.my_vote === 'no' ? '#c45c5c' : '#b87333', border: `1px solid ${p.my_vote === 'si' ? 'rgba(74,124,89,0.18)' : p.my_vote === 'no' ? 'rgba(196,92,92,0.18)' : 'rgba(184,115,51,0.18)'}` }}>
            {p.my_vote === 'si' ? '👍 Aprobado por ti' : p.my_vote === 'no' ? '👎 Rechazado por ti' : '🤔 Sin decidir aún'}
          </div>
        </div>
      ))}
      {showModal && (
        <Modal title="Nueva propuesta" onClose={() => setShowModal(false)}>
          <ProposalForm onSave={async data => { await addItem('proposals', data); setShowModal(false) }} />
        </Modal>
      )}
    </div>
  )
}

function ProposalForm({ onSave }: any) {
  const [f, setF] = useState({ title: '', description: '' })
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <FG label="Título"><input className="form-input" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} onKeyDown={handleKey} placeholder="Ej: Tour en helicóptero" autoFocus /></FG>
      <FG label="Descripción"><textarea className="form-input" rows={3} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} placeholder="Detalles, precio estimado, links..." /></FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn2 onClick={() => f.title && onSave(f)} primary>Agregar propuesta</Btn2>
      </div>
    </div>
  )
}

/* ── TAB JOURNAL ── */
function TabJournal({ trip, items, addItem, updateItem, deleteItem }: any) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const journal = [...(items?.journal || [])].sort((a: any, b: any) => a.day - b.day)

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <Btn2 onClick={() => { setEditing(null); setShowModal(true) }} primary>＋ Entrada del diario</Btn2>
      </div>
      {journal.length === 0 && <EmptyState icon="📝" title="Tu diario está vacío" sub="Escribe sobre tus experiencias y lo que sentiste" />}
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 1, background: 'var(--border)' }} />
        {journal.map((entry: any) => (
          <div key={entry.id} style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', left: -27, top: 10, width: 16, height: 16, borderRadius: '50%', background: '#b87333', border: '3px solid var(--bg)', boxShadow: '0 0 0 3px rgba(184,115,51,0.25)' }} />
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '22px 24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-hover)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 5 }}>Día {entry.day}{entry.date ? ` · ${entry.date}` : ''}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'var(--navy)' }}>{entry.title}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <IBtn onClick={() => { setEditing(entry); setShowModal(true) }}>✏️</IBtn>
                  <IBtn onClick={() => deleteItem('journal', entry.id)} color="#c45c5c">🗑</IBtn>
                </div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-mid)' }}>{entry.text}</div>
              {entry.rating > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 14, alignItems: 'center' }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 15, color: s <= entry.rating ? '#b87333' : 'var(--border)' }}>★</span>)}
                  <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>{entry.rating}/5</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editing ? 'Editar entrada' : 'Nueva entrada del diario'} onClose={() => { setShowModal(false); setEditing(null) }}>
          <JournalForm entry={editing} onSave={async data => {
            editing ? await updateItem('journal', { ...editing, ...data }) : await addItem('journal', data)
            setShowModal(false); setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function JournalForm({ entry, onSave }: any) {
  const [f, setF] = useState({ day: entry?.day || 1, date: entry?.date || '', title: entry?.title || '', text: entry?.text || '', rating: entry?.rating || 0 })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && e.currentTarget.tagName !== 'TEXTAREA') e.preventDefault() }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Día"><input className="form-input" type="number" min="1" value={f.day} onChange={e => s('day', parseInt(e.target.value) || 1)} onKeyDown={handleKey} /></FG>
        <FG label="Fecha"><input className="form-input" type="date" value={f.date} onChange={e => s('date', e.target.value)} /></FG>
      </div>
      <FG label="Título del día"><input className="form-input" value={f.title} onChange={e => s('title', e.target.value)} onKeyDown={handleKey} placeholder="Ej: El día que subimos al Cristo Redentor" autoFocus /></FG>
      <FG label="Qué pasó · Cómo te sentiste"><textarea className="form-input" rows={5} value={f.text} onChange={e => s('text', e.target.value)} placeholder="Escribe libremente..." /></FG>
      <FG label="¿Cómo fue el día?">
        <div style={{ display: 'flex', gap: 10 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 30, cursor: 'pointer', color: n <= f.rating ? '#b87333' : 'var(--border)', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} onClick={() => s('rating', n)}>★</span>)}</div>
      </FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn2 onClick={() => f.title && onSave(f)} primary>{entry ? 'Guardar' : 'Escribir entrada'}</Btn2>
      </div>
    </div>
  )
}

/* ── TAB SUMMARY ── */
function TabSummary({ trip, items }: any) {
  const expenses = items?.expenses || []
  const flights = items?.flights || []
  const totalEst = expenses.reduce((s: number, e: any) => s + (e.estimated || 0), 0)
  const totalReal = expenses.reduce((s: number, e: any) => s + (e.real || 0), 0)
  const diff = totalReal - totalEst
  const doneActs = items?.itinerary?.filter((a: any) => a.status === 'realizado') || []
  const cancelledActs = items?.itinerary?.filter((a: any) => a.status === 'cancelado') || []
  const visited = items?.places?.filter((p: any) => p.visited) || []
  const flightIda = flights.find((f: any) => f.type === 'ida')
  const flightRegreso = flights.find((f: any) => f.type === 'regreso')
  const insights: string[] = []
  if (diff > 0) insights.push(`Gastaste ${fmtCurrency(diff, trip.currency)} más de lo estimado`)
  if (diff < 0) insights.push(`¡Ahorraste ${fmtCurrency(Math.abs(diff), trip.currency)} respecto al presupuesto! 🎉`)
  if (cancelledActs.length > 0) insights.push(`Cancelaste ${cancelledActs.length} actividad${cancelledActs.length > 1 ? 'es' : ''}`)
  if (doneActs.length > 0) insights.push(`Completaste ${doneActs.length} de ${items?.itinerary?.length || 0} actividades`)

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', padding: '44px 0 36px', marginBottom: 36, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 14 }}>Resumen del viaje</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: 'var(--navy)', lineHeight: 1, letterSpacing: '-0.02em' }}>{trip.name}</div>
        <div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 10 }}>{trip.destination} · {trip.start_date} → {trip.end_date}</div>
        <button className="btn-press" onClick={() => window.print()} style={{ marginTop: 22, padding: '10px 22px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--text-mid)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>🖨️ Exportar PDF</button>
      </div>

      {/* Flight summary */}
      {(flightIda || flightRegreso) && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '22px 26px', border: '1px solid var(--border)', marginBottom: 24, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 18 }}>Vuelos del viaje</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[flightIda, flightRegreso].filter(Boolean).map((f: any) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: 'var(--bg-cream)', borderRadius: 12, flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: f.type === 'ida' ? 'rgba(74,127,165,0.1)' : 'rgba(74,124,89,0.1)', color: f.type === 'ida' ? '#4a7fa5' : '#4a7c59' }}>
                  {f.type === 'ida' ? '✈️ Ida' : '🔄 Regreso'}
                </span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--navy)', fontWeight: 300 }}>
                    {f.origin_airport} → {f.destination_airport}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>
                    {f.origin_city} → {f.destination_city}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)', textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{f.departure_date} · {f.departure_time}</div>
                  <div style={{ marginTop: 2 }}>Llega {f.arrival_date} · {f.arrival_time}</div>
                  {f.airline && <div style={{ marginTop: 2, color: 'var(--text-light)' }}>{f.airline} {f.flight_number}</div>}
                  {f.has_layover === 1 && <div style={{ marginTop: 2, color: '#b87333' }}>🔀 Escala: {f.layover_airport}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '💰', title: 'Gasto total', value: fmtCurrency(totalReal, trip.currency), detail: `${diff > 0 ? '+' : ''}${fmtCurrency(diff)} vs estimado`, color: diff > 0 ? '#c45c5c' : '#4a7c59' },
          { icon: '📅', title: 'Actividades', value: `${doneActs.length}/${items?.itinerary?.length || 0}`, detail: `${cancelledActs.length} canceladas`, color: 'var(--text-mid)' },
          { icon: '📍', title: 'Lugares visitados', value: `${visited.length}/${items?.places?.length || 0}`, detail: '', color: 'var(--text-mid)' },
          { icon: '📝', title: 'Entradas en el diario', value: `${items?.journal?.length || 0}`, detail: 'días escritos', color: 'var(--text-mid)' },
        ].map((item, i) => (
          <div key={i} className={`card-hover fade-up-${i}`} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '26px 28px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{item.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>{item.value}</div>
            {item.detail && <div style={{ fontSize: 13, color: item.color, marginTop: 8, fontWeight: item.color !== 'var(--text-mid)' ? 600 : 400 }}>{item.detail}</div>}
          </div>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="fade-up-4" style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '26px 30px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 18 }}>Insights del viaje</div>
          {insights.map((ins, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 0', borderBottom: i < insights.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
              <span style={{ color: '#b87333', fontSize: 16, marginTop: 1, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 15, color: 'var(--text-mid)', lineHeight: 1.6 }}>{ins}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── NEW TRIP MODAL ── */
function NewTripModal({ onClose, onSave }: any) {
  const [f, setF] = useState({ name: '', destination: '', startDate: '', endDate: '', budget: '', currency: 'USD', status: 'planificado', colorIdx: 0 })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }

  return (
    <Modal title="Nuevo viaje" onClose={onClose}>
      <FG label="Nombre del viaje"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={handleKey} placeholder="Ej: Brasil 2025" autoFocus /></FG>
      <FG label="Destino"><input className="form-input" value={f.destination} onChange={e => s('destination', e.target.value)} onKeyDown={handleKey} placeholder="Ej: Río de Janeiro, Brasil" /></FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* FIX: fecha fin con min bloqueado */}
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
            <div key={i} onClick={() => s('colorIdx', i)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: f.colorIdx === i ? '3px solid var(--navy)' : '3px solid transparent', transition: 'all 0.15s', transform: f.colorIdx === i ? 'scale(1.15)' : 'scale(1)', boxShadow: f.colorIdx === i ? `0 0 0 2px ${c}40` : 'none' }} />
          ))}
        </div>
      </FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28 }}>
        <Btn2 onClick={onClose}>Cancelar</Btn2>
        <Btn2 onClick={() => f.name && onSave({ ...f, budget: parseFloat(f.budget) || 0 })} primary>Crear viaje ✈️</Btn2>
      </div>
    </Modal>
  )
}

/* ── SHARED ── */
function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,14,28,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, animation: 'fadeIn 0.2s ease both' }} onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 20, padding: '36px 40px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', animation: 'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--navy)', marginBottom: 26, letterSpacing: '-0.01em' }}>{title}</div>
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
    <button className="btn-press" onClick={onClick} style={{ padding: primary ? '11px 22px' : '11px 18px', background: primary ? '#b87333' : 'transparent', color: primary ? 'white' : 'var(--text-mid)', border: primary ? 'none' : '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.02em', boxShadow: primary ? '0 4px 16px rgba(184,115,51,0.28)' : 'none', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {children}
    </button>
  )
}
function IBtn({ onClick, color, children }: any) {
  return (
    <button className="btn-press" onClick={onClick} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: color || 'var(--text-mid)', transition: 'all 0.15s', flexShrink: 0 }}>
      {children}
    </button>
  )
}
function EmptyState({ icon, title, sub }: any) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed var(--border)', marginBottom: 24 }}>
      <div style={{ fontSize: 40, opacity: 0.25, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--navy)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{sub}</div>
    </div>
  )
}