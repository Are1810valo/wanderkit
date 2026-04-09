'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    const apply=()=>document.documentElement.setAttribute('data-theme',new Date().getHours()>=7&&new Date().getHours()<19?'light':'dark')
    apply(); const iv=setInterval(apply,60000); return()=>clearInterval(iv)
  },[])

  useEffect(()=>{ if(session) router.push('/') },[session])

  if(status==='loading') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="skeleton" style={{width:200,height:20,borderRadius:8}} />
    </div>
  )

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:20}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:42,fontWeight:300,color:'var(--navy)',lineHeight:1}}>
            Wander<em style={{color:'#b87333',fontStyle:'italic'}}>Kit</em>
          </div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-light)',marginTop:8}}>
            Gestor de Viajes
          </div>
        </div>
        <div style={{background:'var(--bg-card)',borderRadius:20,padding:'36px 40px',border:'1px solid var(--border)',boxShadow:'var(--shadow-card)'}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--navy)',marginBottom:8}}>Bienvenido</div>
          <div style={{fontSize:13,color:'var(--text-light)',marginBottom:28,lineHeight:1.5}}>
            Inicia sesión para acceder a tus viajes.
          </div>
          <button
            onClick={()=>{ setLoading(true); signIn('google') }}
            disabled={loading}
            style={{width:'100%',padding:'13px',background:loading?'rgba(184,115,51,0.4)':'#b87333',color:'white',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',fontFamily:'DM Sans,sans-serif',boxShadow:'0 4px 20px rgba(184,115,51,0.28)',transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFF" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></svg>
            {loading?'Redirigiendo...':'Continuar con Google'}
          </button>
        </div>
        <div style={{textAlign:'center',marginTop:24,fontSize:12,color:'var(--text-light)'}}>
          WanderKit — Tu bitácora de viajes privada
        </div>
      </div>
    </div>
  )
}