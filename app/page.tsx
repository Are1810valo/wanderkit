'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTrips } from '@/lib/hooks/useTrips'

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
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x))
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 300)
    }, 3000)
  }, [])
  useEffect(() => { globalAddToast = addToast; return () => { globalAddToast = null } }, [addToast])
  const icons = { success: '✓', error: '✕', info: 'ℹ' }
  return (
    <div className="toast-container no-print">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}${t.leaving ? ' leaving' : ''}`}>
          <span style={{ fontSize: 15 }}>{icons[t.type]}</span>{t.message}
        </div>
      ))}
    </div>
  )
}

/* ── ANIMATED NUMBER ── */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const frameRef = { current: undefined as number | undefined }
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

export default function Home() {
  const router = useRouter()
  const { trips, loading, createTrip, deleteTrips } = useTrips()
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
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

  const ongoing = trips.filter(t => t.status === 'en curso').length
  const upcoming = trips.filter(t => t.status === 'planificado').length
  const finished = trips.filter(t => t.status === 'finalizado').length

  const statusConfig: Record<string, any> = {
    planificado: { label: 'Planificado', bg: 'rgba(74,127,165,0.1)', color: '#4a7fa5' },
    'en curso': { label: 'En Curso', bg: 'rgba(74,124,89,0.1)', color: '#4a7c59' },
    finalizado: { label: 'Finalizado', bg: 'rgba(138,138,170,0.1)', color: '#8a8aaa' },
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <ToastContainer />

      {/* Sidebar overlay mobile */}
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
          ) : trips.map((t, i) => (
            <div key={t.id} onClick={() => router.push(`/trips/${t.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', margin: '2px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', background: 'rgba(255,255,255,0.02)', border: '1px solid transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
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
          <button className="btn-press" onClick={() => setShowNewTrip(true)} style={{ width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#b87333', background: 'rgba(184,115,51,0.1)', border: '1.5px solid rgba(184,115,51,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
          <button className="btn-press" onClick={() => setShowNewTrip(true)} style={{ background: 'rgba(184,115,51,0.15)', border: '1px solid rgba(184,115,51,0.3)', borderRadius: 8, padding: '6px 12px', color: '#b87333', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>＋</button>
        </div>

        {/* Dashboard content */}
        {loading ? (
          <div style={{ padding: '52px 56px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 22, marginTop: 20 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 20 }} />)}
            </div>
          </div>
        ) : (
          <div className="responsive-padding" style={{ padding: '52px 56px 64px' }}>
            {/* Hero */}
            <div className="fade-up" style={{ marginBottom: 52, borderBottom: '1px solid var(--border)', paddingBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 16 }}>Bienvenido a WanderKit</div>
              <div className="responsive-text-sm" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 300, color: 'var(--navy)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                Tus <em style={{ color: '#b87333', fontStyle: 'italic' }}>aventuras,</em><br />organizadas.
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-mid)', marginTop: 16, fontWeight: 300, maxWidth: 480, lineHeight: 1.6 }}>Planifica cada detalle, registra lo que viviste y recuerda cada viaje para siempre.</div>
              <button className="btn-press fade-up-1" onClick={() => setShowNewTrip(true)} style={{ marginTop: 28, padding: '14px 28px', background: '#b87333', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 20px rgba(184,115,51,0.35)' }}>＋ Nuevo viaje</button>
            </div>

            {/* Stats */}
            <div className="fade-up-2 responsive-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, marginBottom: 52, background: 'var(--border)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {[{ num: trips.length, label: 'Total viajes' }, { num: ongoing, label: 'En curso' }, { num: upcoming, label: 'Planificados' }, { num: finished, label: 'Finalizados' }].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', padding: '24px 28px' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}><AnimatedNumber value={s.num} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trips */}
            {trips.length > 0 && (
              <>
                <div className="fade-up-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: 'var(--navy)' }}>Mis viajes</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{trips.length} viaje{trips.length !== 1 ? 's' : ''}</div>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 22 }}>
                  {trips.map((t, i) => {
                    const sc = statusConfig[t.status] || statusConfig.planificado
                    const color = tripColors[t.color_idx ?? i % tripColors.length]
                    const isSelected = selected.includes(t.id)
                    return (
                      <div key={t.id} className={`card-hover fade-up-${Math.min(i + 3, 6)}`}
                        onClick={() => !selected.length && router.push(`/trips/${t.id}`)}
                        style={{ background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden', border: isSelected ? '2px solid #b87333' : '1px solid var(--border)', boxShadow: isSelected ? '0 0 0 3px rgba(184,115,51,0.15)' : 'var(--shadow-card)', position: 'relative', cursor: selected.length ? 'default' : 'pointer' }}>
                        {/* Checkbox */}
                        <div onClick={(e) => toggleSelect(e, t.id)}
                          style={{ position: 'absolute', top: 12, left: 12, width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSelected ? '#b87333' : 'rgba(255,255,255,0.8)'}`, background: isSelected ? '#b87333' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', transition: 'all 0.15s' }}>
                          {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                        </div>
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
                <button className="btn-press" onClick={() => setShowNewTrip(true)} style={{ padding: '12px 28px', background: '#b87333', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>＋ Crear primer viaje</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} onSave={async (data: any) => { await createTrip(data); setShowNewTrip(false); toast('¡Viaje creado! ✈️', 'success') }} />}
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
        <Btn2 onClick={() => f.name && onSave({ ...f, budget: parseFloat(f.budget) || 0 })} primary>Crear viaje ✈️</Btn2>
      </div>
    </Modal>
  )
}

/* ── SHARED ── */
function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,14,28,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 20, padding: '36px 40px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
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