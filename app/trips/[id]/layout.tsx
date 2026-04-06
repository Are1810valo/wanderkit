'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'

const tripColors = ['#b87333','#4a7c59','#4a7fa5','#8a5aaa','#c45c5c','#3a8a7c']
const fmtCurrency = (n: number, currency = 'USD') => {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

const TABS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'flights', label: '✈️ Vuelos' },
  { id: 'itinerary', label: 'Itinerario' },
  { id: 'expenses', label: 'Gastos' },
  { id: 'places', label: 'Lugares' },
  { id: 'documents', label: 'Documentos' },
  { id: 'checklist', label: 'Equipaje' },
  { id: 'proposals', label: 'Propuestas' },
  { id: 'journal', label: 'Diario' },
  { id: 'summary', label: 'Post-viaje' },
]

export default function TripLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname()
  const tabsRef = useRef<HTMLDivElement>(null)
  const [trip, setTrip] = useState<any>(null)
  const [allTrips, setAllTrips] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tripId, setTripId] = useState<string>('')

  useEffect(() => {
    params.then(p => {
      setTripId(p.id)
      fetchTrip(p.id)
    })
    fetchAllTrips()
  }, [])

  useEffect(() => {
    const applyTheme = () => {
      const hour = new Date().getHours()
      document.documentElement.setAttribute('data-theme', hour >= 7 && hour < 19 ? 'light' : 'dark')
    }
    applyTheme()
    const interval = setInterval(applyTheme, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchTrip = async (id: string) => {
    try {
      const res = await axios.get(`/api/trips`)
      const found = res.data.find((t: any) => t.id === id)
      setTrip(found)
    } catch (e) { console.error(e) }
  }

  const fetchAllTrips = async () => {
    try {
      const res = await axios.get('/api/trips')
      setAllTrips(res.data)
    } catch (e) { console.error(e) }
  }

  const activeTab = TABS.find(t => pathname.endsWith(t.id))?.id || 'overview'

  const handleTabChange = (tabId: string) => {
    router.push(`/trips/${tripId}/${tabId}`)
    const tabEl = tabsRef.current?.querySelector(`[data-tab="${tabId}"]`) as HTMLElement
    tabEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const handleUpdateStatus = async (status: string) => {
    if (!trip) return
    await axios.put(`/api/trips/${tripId}`, { ...trip, status })
    setTrip({ ...trip, status })
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este viaje y todo su contenido?')) return
    await axios.delete(`/api/trips/${tripId}`)
    router.push('/')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 499, backdropFilter: 'blur(4px)' }} />
      )}

      {/* ── SIDEBAR ── */}
      <div className={`sidebar-responsive${sidebarOpen ? ' open' : ''}`} style={{ width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative', zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: '28px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: '#f0ece3', letterSpacing: '0.02em', lineHeight: 1 }}>
              Wander<em style={{ color: '#b87333', fontStyle: 'italic' }}>Kit</em>
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Gestor de Viajes</div>
          </div>
        </div>

        {/* Back button */}
        <div style={{ padding: '12px 12px 0' }}>
          <button onClick={() => router.push('/')} style={{ width: '100%', padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
            ← Todos los viajes
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', padding: '0 22px', marginBottom: 8 }}>Mis Viajes</div>
          {allTrips.map((t, i) => (
            <div key={t.id} onClick={() => router.push(`/trips/${t.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', margin: '2px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', background: t.id === tripId ? 'rgba(184,115,51,0.12)' : 'rgba(255,255,255,0.02)', border: t.id === tripId ? '1px solid rgba(184,115,51,0.28)' : '1px solid transparent' }}
              onMouseEnter={e => { if (t.id !== tripId) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (t.id !== tripId) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
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

        <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => router.push('/?new=1')} style={{ width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#b87333', background: 'rgba(184,115,51,0.1)', border: '1.5px solid rgba(184,115,51,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            ＋ Nuevo viaje
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

        {/* Mobile header */}
        <div className="mobile-header no-print" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--bg-sidebar)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 200 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, padding: 4 }}>
            {[1,2,3].map(i => <div key={i} style={{ width: 20, height: 2, background: 'rgba(255,255,255,0.6)', borderRadius: 2 }} />)}
          </button>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: '#f0ece3' }}>Wander<em style={{ color: '#b87333' }}>Kit</em></div>
          <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>← Inicio</button>
        </div>

        {/* Trip header */}
        {trip && (
          <div className="no-print" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, padding: '24px 52px 0' }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-light)' }}>
              <span onClick={() => router.push('/')} style={{ cursor: 'pointer', color: '#b87333', fontWeight: 500, transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Inicio
              </span>
              <span style={{ opacity: 0.4 }}>›</span>
              <span style={{ color: 'var(--text-mid)', fontWeight: 500 }}>{trip.name}</span>
              <span style={{ opacity: 0.4 }}>›</span>
              <span style={{ color: 'var(--text-light)', textTransform: 'capitalize' }}>{TABS.find(t => t.id === activeTab)?.label || 'Resumen'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 8 }}>
                  {trip.status === 'en curso' ? '🟢 En curso' : trip.status === 'finalizado' ? '🏁 Finalizado' : '📋 Planificado'} · {trip.destination}
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: 'var(--navy)', lineHeight: 1, letterSpacing: '-0.01em' }}>{trip.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6 }}>{trip.start_date} → {trip.end_date} · {fmtCurrency(trip.budget, trip.currency)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => window.print()} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--text-mid)' }}>🖨️ PDF</button>
                <button onClick={handleDelete} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid rgba(196,92,92,0.3)', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#c45c5c' }}>🗑</button>
                <select value={trip.status} onChange={e => handleUpdateStatus(e.target.value)} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-input)', color: 'var(--text-mid)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}>
                  <option value="planificado">Planificado</option>
                  <option value="en curso">En Curso</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ position: 'relative' }}>
              <div ref={tabsRef} style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {TABS.map(t => (
                  <button key={t.id} data-tab={t.id} onClick={() => handleTabChange(t.id)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', flexShrink: 0, borderBottom: activeTab === t.id ? '2px solid #b87333' : '2px solid transparent', color: activeTab === t.id ? 'var(--navy)' : 'var(--text-light)', transition: 'all 0.2s', marginBottom: -1 }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to left, var(--bg-card), transparent)', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}