'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useTripItems } from '@/lib/hooks/useTrips'
import axios from 'axios'

const fmtCurrency = (n: number, currency = 'USD') => {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

/* ── TOAST ── */
type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; type: ToastType; leaving?: boolean }
let toastId = 0
let globalAddToast: ((msg: string, type: ToastType) => void) | null = null
const toast = (message: string, type: ToastType = 'success') => { if (globalAddToast) globalAddToast(message, type) }

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
      {toasts.map(t => <div key={t.id} className={`toast ${t.type}${t.leaving ? ' leaving' : ''}`}><span style={{ fontSize: 15 }}>{icons[t.type]}</span>{t.message}</div>)}
    </div>
  )
}

/* ── ANIMATED NUMBER ── */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | undefined>(undefined)
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

function SkeletonCard({ height = 120 }: { height?: number }) {
  return <div className="skeleton" style={{ height, borderRadius: 16 }} />
}
function SkeletonList() {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3,4].map(i => <SkeletonCard key={i} height={72} />)}</div>
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

/* ── SHARED COMPONENTS ── */
function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,14,28,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 20, padding: '36px 40px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
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

/* ── MAIN TAB PAGE ── */
export default function TabPage() {
  const params = useParams()
  const tripId = params.id as string
  const tab = params.tab as string
  const [trip, setTrip] = useState<any>(null)
  const { items, loading, addItem, updateItem, deleteItem } = useTripItems(tripId)

  useEffect(() => {
    axios.get('/api/trips').then(res => {
      const found = res.data.find((t: any) => t.id === tripId)
      setTrip(found)
    })
  }, [tripId])

  const wrapItem = async (fn: () => Promise<any>, msg: string) => { await fn(); toast(msg, 'success') }
  const wrappedAdd = (type: string, data: any) => wrapItem(() => addItem(type, data), 'Agregado')
  const wrappedUpdate = (type: string, data: any) => wrapItem(() => updateItem(type, data), 'Guardado')
  const wrappedDelete = (type: string, id: string) => wrapItem(() => deleteItem(type, id), 'Eliminado')

  if (!trip && !loading) return null

  return (
    <div className="tab-content-responsive fade-in" style={{ padding: '36px 52px 64px' }}>
      <ToastContainer />
      {loading ? (
        tab === 'overview' ? <SkeletonOverview /> : <SkeletonList />
      ) : (
        <>
          {tab === 'overview' && <TabOverview trip={trip} items={items} />}
          {tab === 'flights' && <TabFlights trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
          {tab === 'itinerary' && <TabItinerary trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
          {tab === 'expenses' && <TabExpenses trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
          {tab === 'places' && <TabPlaces trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
          {tab === 'documents' && <TabDocuments trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
          {tab === 'checklist' && <TabChecklist trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
          {tab === 'proposals' && <TabProposals trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
          {tab === 'journal' && <TabJournal trip={trip} items={items} addItem={wrappedAdd} updateItem={wrappedUpdate} deleteItem={wrappedDelete} />}
          {tab === 'summary' && <TabSummary trip={trip} items={items} />}
        </>
      )}
    </div>
  )
}

/* ── TAB OVERVIEW ── */
function TabOverview({ trip, items }: any) {
  const totalEst = items?.expenses?.reduce((s: number, e: any) => s + (e.estimated || 0), 0) || 0
  const totalReal = items?.expenses?.reduce((s: number, e: any) => s + (e.real || 0), 0) || 0
  const budget = trip?.budget || totalEst || 1
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
            { label: 'Estimado', value: fmtCurrency(totalEst || budget, trip?.currency), accent: '#4a7fa5', bg: 'rgba(74,127,165,0.05)', border: 'rgba(74,127,165,0.15)' },
            { label: 'Real gastado', value: fmtCurrency(totalReal, trip?.currency), accent: '#4a7c59', bg: 'rgba(74,124,89,0.05)', border: 'rgba(74,124,89,0.15)' },
            { label: 'Diferencia', value: `${diff > 0 ? '+' : ''}${fmtCurrency(diff, trip?.currency)}`, accent: diff > 0 ? '#c45c5c' : '#4a7c59', bg: diff > 0 ? 'rgba(196,92,92,0.05)' : 'rgba(74,124,89,0.05)', border: diff > 0 ? 'rgba(196,92,92,0.15)' : 'rgba(74,124,89,0.15)' },
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
          <div style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: flight.type === 'ida' ? 'rgba(74,127,165,0.1)' : 'rgba(74,124,89,0.1)', color: flight.type === 'ida' ? '#4a7fa5' : '#4a7c59' }}>
            {flight.type === 'ida' ? '✈️ Vuelo de ida' : '🔄 Vuelo de regreso'}
          </div>
          {flight.airline && <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>{flight.airline} {flight.flight_number}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <IBtn onClick={() => { setEditing(flight); setShowModal(true) }}>✏️</IBtn>
          <IBtn onClick={() => deleteItem('flights', flight.id)} color="#c45c5c">🗑</IBtn>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>{flight.origin_airport || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>{flight.origin_city}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{flight.departure_date} · {flight.departure_time}</div>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8, minWidth: 80 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <div style={{ fontSize: 18 }}>{flight.has_layover ? '🔀' : '✈️'}</div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'right', minWidth: 120 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>{flight.destination_airport || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>{flight.destination_city}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{flight.arrival_date} · {flight.arrival_time}</div>
        </div>
      </div>
      {flight.has_layover === 1 && (
        <div style={{ padding: '10px 14px', background: 'rgba(184,115,51,0.06)', border: '1px solid rgba(184,115,51,0.15)', borderRadius: 10, fontSize: 13, color: 'var(--text-mid)' }}>
          🔀 <strong>Escala en {flight.layover_airport || '—'}</strong>{flight.layover_duration ? ` · ${flight.layover_duration}` : ''}
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
          <FlightForm flight={editing} onSave={async (data: any) => {
            editing ? await updateItem('flights', { ...editing, ...data }) : await addItem('flights', data)
            setShowModal(false); setEditing(null)
          }} />
        </Modal>
      )}
    </div>
  )
}

function FlightForm({ flight, onSave }: any) {
  const [f, setF] = useState({ type: flight?.type || 'ida', airline: flight?.airline || '', flightNumber: flight?.flight_number || '', originAirport: flight?.origin_airport || '', originCity: flight?.origin_city || '', destinationAirport: flight?.destination_airport || '', destinationCity: flight?.destination_city || '', departureDate: flight?.departure_date || '', departureTime: flight?.departure_time || '', arrivalDate: flight?.arrival_date || '', arrivalTime: flight?.arrival_time || '', hasLayover: flight?.has_layover === 1 || false, layoverAirport: flight?.layover_airport || '', layoverDuration: flight?.layover_duration || '', notes: flight?.notes || '' })
  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))
  const hk = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <FG label="Tipo de vuelo">
        <select className="form-input" value={f.type} onChange={e => s('type', e.target.value)}>
          <option value="ida">✈️ Vuelo de ida</option>
          <option value="regreso">🔄 Vuelo de regreso</option>
        </select>
      </FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Aerolínea"><input className="form-input" value={f.airline} onChange={e => s('airline', e.target.value)} onKeyDown={hk} placeholder="Ej: LATAM" /></FG>
        <FG label="N° de vuelo"><input className="form-input" value={f.flightNumber} onChange={e => s('flightNumber', e.target.value)} onKeyDown={hk} placeholder="Ej: LA800" /></FG>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-light)', margin: '16px 0 10px' }}>Origen</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Código aeropuerto"><input className="form-input" value={f.originAirport} onChange={e => s('originAirport', e.target.value.toUpperCase())} onKeyDown={hk} placeholder="SCL" maxLength={4} /></FG>
        <FG label="Ciudad"><input className="form-input" value={f.originCity} onChange={e => s('originCity', e.target.value)} onKeyDown={hk} placeholder="Santiago" /></FG>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Fecha salida"><input className="form-input" type="date" value={f.departureDate} onChange={e => s('departureDate', e.target.value)} /></FG>
        <FG label="Hora salida"><input className="form-input" type="time" value={f.departureTime} onChange={e => s('departureTime', e.target.value)} /></FG>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-light)', margin: '16px 0 10px' }}>Destino</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Código aeropuerto"><input className="form-input" value={f.destinationAirport} onChange={e => s('destinationAirport', e.target.value.toUpperCase())} onKeyDown={hk} placeholder="GIG" maxLength={4} /></FG>
        <FG label="Ciudad"><input className="form-input" value={f.destinationCity} onChange={e => s('destinationCity', e.target.value)} onKeyDown={hk} placeholder="Río de Janeiro" /></FG>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Fecha llegada"><input className="form-input" type="date" value={f.arrivalDate} onChange={e => s('arrivalDate', e.target.value)} /></FG>
        <FG label="Hora llegada"><input className="form-input" type="time" value={f.arrivalTime} onChange={e => s('arrivalTime', e.target.value)} /></FG>
      </div>
      <div style={{ margin: '16px 0', padding: '14px 16px', background: 'var(--bg-cream)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.hasLayover} onChange={e => s('hasLayover', e.target.checked)} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Este vuelo tiene escala</span>
        </label>
        {f.hasLayover && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            <FG label="Aeropuerto de escala"><input className="form-input" value={f.layoverAirport} onChange={e => s('layoverAirport', e.target.value)} onKeyDown={hk} placeholder="MIA - Miami" /></FG>
            <FG label="Duración"><input className="form-input" value={f.layoverDuration} onChange={e => s('layoverDuration', e.target.value)} onKeyDown={hk} placeholder="2h 30min" /></FG>
          </div>
        )}
      </div>
      <FG label="Notas"><textarea className="form-input" rows={2} value={f.notes} onChange={e => s('notes', e.target.value)} placeholder="Número de reserva, asiento..." /></FG>
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
                    <span style={{ background: 'var(--bg-cream-dark)', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{act.type}</span>
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
          <ActivityForm activity={editing} onSave={async (data: any) => {
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
  const hk = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={hk} placeholder="Ej: Visita al Cristo Redentor" autoFocus /></FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Día"><input className="form-input" type="number" min="1" value={f.day} onChange={e => s('day', parseInt(e.target.value) || 1)} onKeyDown={hk} /></FG>
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
      <FG label="Notas"><textarea className="form-input" rows={3} value={f.note} onChange={e => s('note', e.target.value)} placeholder="¿Cómo fue realmente?" /></FG>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn2 onClick={() => f.name && onSave(f)} primary>{activity ? 'Guardar cambios' : 'Agregar'}</Btn2>
      </div>
    </div>
  )
}

/* ── TAB EXPENSES ── */
function TabExpenses({ trip, items, addItem, updateItem, deleteItem }: any) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const expenses = items?.expenses || []
  const catEmoji: Record<string, string> = { alojamiento: '🏨', transporte: '✈️', comida: '🍽️', actividades: '🎭', compras: '🛍️', otros: '📌' }
  const totalEst = expenses.reduce((s: number, e: any) => s + (e.estimated || 0), 0)
  const totalReal = expenses.reduce((s: number, e: any) => s + (e.real || 0), 0)
  const diff = totalReal - totalEst

  return (
    <div className="fade-in">
      <div className="responsive-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Estimado total', value: fmtCurrency(totalEst, trip?.currency), color: '#4a7fa5' },
          { label: 'Real gastado', value: fmtCurrency(totalReal, trip?.currency), color: '#4a7c59' },
          { label: 'Diferencia', value: `${diff > 0 ? '+' : ''}${fmtCurrency(diff, trip?.currency)}`, color: diff > 0 ? '#c45c5c' : '#4a7c59' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '20px 22px', border: '1px solid var(--border)', textAlign: 'center' }}>
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
          <div key={exp.id} className="row-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'var(--bg-cream)', flexShrink: 0 }}>{catEmoji[exp.category] || '📌'}</div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{exp.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2, textTransform: 'capitalize' }}>{exp.category}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                {exp.persons > 1 && <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>👥 {exp.persons} personas · {fmtCurrency((exp.real || 0) / exp.persons, trip?.currency)} c/u</span>}
                {exp.paid_by && <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>💳 Pagó: {exp.paid_by}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Estimado</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--text-light)' }}>{fmtCurrency(exp.estimated, trip?.currency)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Real</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: 'var(--navy)' }}>{exp.real != null ? fmtCurrency(exp.real, trip?.currency) : '—'}</div>
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
          <ExpenseForm expense={editing} currency={trip?.currency} onSave={async (data: any) => {
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
  const hk = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <FG label="Descripción"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={hk} autoFocus /></FG>
      <FG label="Categoría">
        <select className="form-input" value={f.category} onChange={e => s('category', e.target.value)}>
          {['alojamiento','transporte','comida','actividades','compras','otros'].map(c => <option key={c}>{c}</option>)}
        </select>
      </FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label={`Estimado (${currency})`}><input className="form-input" type="number" min="0" value={f.estimated} onChange={e => s('estimated', e.target.value)} onKeyDown={hk} /></FG>
        <FG label={`Real (${currency})`}><input className="form-input" type="number" min="0" value={f.real} onChange={e => s('real', e.target.value)} onKeyDown={hk} placeholder="Vacío si no se sabe" /></FG>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="N° de personas">
          <select className="form-input" value={f.persons} onChange={e => s('persons', parseInt(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n === 1 ? '👤 1 persona' : `👥 ${n} personas`}</option>)}
          </select>
        </FG>
        <FG label="¿Quién pagó?"><input className="form-input" value={f.paidBy} onChange={e => s('paidBy', e.target.value)} onKeyDown={hk} placeholder="Ej: Ezequiel" /></FG>
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
            {place.lat && place.lng && (
              <div style={{ position: 'relative', height: 140, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setMapPlace(mapPlace?.id === place.id ? null : place)}>
                <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.lng - 0.01},${place.lat - 0.01},${place.lng + 0.01},${place.lat + 0.01}&layer=mapnik&marker=${place.lat},${place.lng}`} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: mapPlace?.id === place.id ? 'auto' : 'none' }} loading="lazy" />
                {mapPlace?.id !== place.id && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
                    <span style={{ background: 'white', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#1a2744' }}>🗺️ Ver mapa</span>
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
                    <a href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=15/${place.lat}/${place.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#4a7fa5', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>🔗 Abrir en mapa</a>
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
                <span onClick={() => updateItem('places', { ...place, visited: place.visited ? 0 : 1 })} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s', background: place.visited ? 'rgba(74,124,89,0.12)' : 'rgba(138,138,170,0.08)', color: place.visited ? '#4a7c59' : 'var(--text-light)' }}>
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
          <PlaceForm place={editing} onSave={async (data: any) => {
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
  const hk = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={hk} autoFocus /></FG>
      <FG label="Tipo"><input className="form-input" value={f.type} onChange={e => s('type', e.target.value)} onKeyDown={hk} placeholder="Monumento, Playa, Restaurante..." /></FG>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Latitud"><input className="form-input" type="number" step="any" value={f.lat} onChange={e => s('lat', e.target.value)} placeholder="-22.9519" /></FG>
        <FG label="Longitud"><input className="form-input" type="number" step="any" value={f.lng} onChange={e => s('lng', e.target.value)} placeholder="-43.2105" /></FG>
      </div>
      {f.lat && f.lng && (
        <div style={{ marginBottom: 14, borderRadius: 10, overflow: 'hidden', height: 160, border: '1px solid var(--border)' }}>
          <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(f.lng as string) - 0.01},${parseFloat(f.lat as string) - 0.01},${parseFloat(f.lng as string) + 0.01},${parseFloat(f.lat as string) + 0.01}&layer=mapnik&marker=${f.lat},${f.lng}`} style={{ width: '100%', height: '100%', border: 'none' }} loading="lazy" />
        </div>
      )}
      <div style={{ padding: '10px 14px', background: 'rgba(74,127,165,0.06)', border: '1px solid rgba(74,127,165,0.15)', borderRadius: 10, fontSize: 12, color: 'var(--text-mid)', marginBottom: 14 }}>
        💡 Busca el lugar en <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" style={{ color: '#4a7fa5' }}>openstreetmap.org</a>, haz click derecho y copia las coordenadas.
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
        <div key={doc.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 10, flexWrap: 'wrap' }}>
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
          <DocForm doc={editing} onSave={async (data: any) => {
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
  const hk = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <FG label="Nombre"><input className="form-input" value={f.name} onChange={e => s('name', e.target.value)} onKeyDown={hk} placeholder="Ej: Vuelo SCL → GIG" autoFocus /></FG>
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
            <div key={cat} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
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
              {newItemCat === cat ? (
                <div style={{ padding: '8px 14px', display: 'flex', gap: 8 }}>
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
        <div key={p.id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4, lineHeight: 1.5 }}>{p.description}</div>
            </div>
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
          <ProposalForm onSave={async (data: any) => { await addItem('proposals', data); setShowModal(false) }} />
        </Modal>
      )}
    </div>
  )
}

function ProposalForm({ onSave }: any) {
  const [f, setF] = useState({ title: '', description: '' })
  const hk = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <FG label="Título"><input className="form-input" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} onKeyDown={hk} placeholder="Ej: Tour en helicóptero" autoFocus /></FG>
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
          <JournalForm entry={editing} onSave={async (data: any) => {
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
  const hk = (e: React.KeyboardEvent) => { if ((e.target as HTMLElement).tagName !== 'TEXTAREA' && e.key === 'Enter') e.preventDefault() }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FG label="Día"><input className="form-input" type="number" min="1" value={f.day} onChange={e => s('day', parseInt(e.target.value) || 1)} onKeyDown={hk} /></FG>
        <FG label="Fecha"><input className="form-input" type="date" value={f.date} onChange={e => s('date', e.target.value)} /></FG>
      </div>
      <FG label="Título del día"><input className="form-input" value={f.title} onChange={e => s('title', e.target.value)} onKeyDown={hk} placeholder="Ej: El día que subimos al Cristo Redentor" autoFocus /></FG>
      <FG label="Qué pasó · Cómo te sentiste"><textarea className="form-input" rows={5} value={f.text} onChange={e => s('text', e.target.value)} placeholder="Escribe libremente..." /></FG>
      <FG label="¿Cómo fue el día?">
        <div style={{ display: 'flex', gap: 10 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 30, cursor: 'pointer', color: n <= f.rating ? '#b87333' : 'var(--border)', transition: 'all 0.15s' }} onClick={() => s('rating', n)}>★</span>)}</div>
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
  if (diff > 0) insights.push(`Gastaste ${fmtCurrency(diff, trip?.currency)} más de lo estimado`)
  if (diff < 0) insights.push(`¡Ahorraste ${fmtCurrency(Math.abs(diff), trip?.currency)} respecto al presupuesto! 🎉`)
  if (cancelledActs.length > 0) insights.push(`Cancelaste ${cancelledActs.length} actividad${cancelledActs.length > 1 ? 'es' : ''}`)
  if (doneActs.length > 0) insights.push(`Completaste ${doneActs.length} de ${items?.itinerary?.length || 0} actividades`)

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', padding: '44px 0 36px', marginBottom: 36, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 14 }}>Resumen del viaje</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>{trip?.name}</div>
        <div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 10 }}>{trip?.destination} · {trip?.start_date} → {trip?.end_date}</div>
        <button className="btn-press" onClick={() => window.print()} style={{ marginTop: 22, padding: '10px 22px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--text-mid)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>🖨️ Exportar PDF</button>
      </div>

      {(flightIda || flightRegreso) && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '22px 26px', border: '1px solid var(--border)', marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 18 }}>Vuelos del viaje</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[flightIda, flightRegreso].filter(Boolean).map((f: any) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--bg-cream)', borderRadius: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: f.type === 'ida' ? 'rgba(74,127,165,0.1)' : 'rgba(74,124,89,0.1)', color: f.type === 'ida' ? '#4a7fa5' : '#4a7c59' }}>
                  {f.type === 'ida' ? '✈️ Ida' : '🔄 Regreso'}
                </span>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'var(--navy)' }}>{f.origin_airport} → {f.destination_airport}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{f.origin_city} → {f.destination_city}</div>
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
          { icon: '💰', title: 'Gasto total', value: fmtCurrency(totalReal, trip?.currency), detail: `${diff > 0 ? '+' : ''}${fmtCurrency(diff)} vs estimado`, color: diff > 0 ? '#c45c5c' : '#4a7c59' },
          { icon: '📅', title: 'Actividades', value: `${doneActs.length}/${items?.itinerary?.length || 0}`, detail: `${cancelledActs.length} canceladas`, color: 'var(--text-mid)' },
          { icon: '📍', title: 'Lugares visitados', value: `${visited.length}/${items?.places?.length || 0}`, detail: '', color: 'var(--text-mid)' },
          { icon: '📝', title: 'Entradas en el diario', value: `${items?.journal?.length || 0}`, detail: 'días escritos', color: 'var(--text-mid)' },
        ].map((item, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '26px 28px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{item.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>{item.value}</div>
            {item.detail && <div style={{ fontSize: 13, color: item.color, marginTop: 8, fontWeight: item.color !== 'var(--text-mid)' ? 600 : 400 }}>{item.detail}</div>}
          </div>
        ))}
      </div>

      {insights.length > 0 && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '26px 30px', border: '1px solid var(--border)' }}>
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