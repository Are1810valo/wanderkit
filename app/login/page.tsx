'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const apply = () => document.documentElement.setAttribute('data-theme',
      new Date().getHours() >= 7 && new Date().getHours() < 19 ? 'light' : 'dark')
    apply()
    const iv = setInterval(apply, 60000)
    return () => clearInterval(iv)
  }, [])

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError('Contraseña incorrecta. Intenta nuevamente.')
        setPassword('')
      }
    } catch (e) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 42, fontWeight: 300, color: 'var(--navy)', lineHeight: 1 }}>
            Wander<em style={{ color: '#b87333', fontStyle: 'italic' }}>Kit</em>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-light)', marginTop: 8 }}>
            Gestor de Viajes
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '36px 40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: 'var(--navy)', marginBottom: 8 }}>
            Acceso privado
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 28, lineHeight: 1.5 }}>
            Ingresa la contraseña para continuar.
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(196,92,92,0.08)', border: '1px solid rgba(196,92,92,0.2)', borderRadius: 10, fontSize: 13, color: '#c45c5c', marginBottom: 18 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 7 }}>
                Contraseña
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              style={{
                width: '100%', padding: '13px', background: loading || !password.trim() ? 'rgba(184,115,51,0.4)' : '#b87333',
                color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 20px rgba(184,115,51,0.28)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '⏳ Verificando...' : 'Entrar →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-light)' }}>
          WanderKit — Tu bitácora de viajes privada
        </div>
      </div>
    </div>
  )
}