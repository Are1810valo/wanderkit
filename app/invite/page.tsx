'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import axios from 'axios'

function InviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const token = searchParams.get('token')
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    const apply=()=>document.documentElement.setAttribute('data-theme',new Date().getHours()>=7&&new Date().getHours()<19?'light':'dark')
    apply()
  },[])

  useEffect(()=>{
    if(!token){setError('Token inválido');setLoading(false);return}
    axios.get(`/api/invitations?token=${token}`)
      .then(r=>{setInvite(r.data);setLoading(false)})
      .catch(()=>{setError('Invitación inválida o ya usada');setLoading(false)})
  },[token])

  const handleAccept = async () => {
    if(!session){signIn('google');return}
    setAccepting(true)
    try {
      const res = await axios.put('/api/invitations',{token})
      router.push(`/trips/${res.data.tripId}/overview`)
    } catch(e:any){
      setError(e.response?.data?.error||'Error al aceptar')
      setAccepting(false)
    }
  }

  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'var(--text-light)'}}>Verificando invitación...</div>

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:20}}>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:38,fontWeight:300,color:'var(--navy)'}}>Wander<em style={{color:'#b87333'}}>Kit</em></div>
        </div>
        <div style={{background:'var(--bg-card)',borderRadius:20,padding:'36px 40px',border:'1px solid var(--border)'}}>
          {error ? (
            <>
              <div style={{fontSize:36,textAlign:'center',marginBottom:16}}>❌</div>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:300,color:'var(--navy)',textAlign:'center',marginBottom:8}}>Invitación inválida</div>
              <div style={{fontSize:13,color:'var(--text-light)',textAlign:'center',marginBottom:24}}>{error}</div>
              <button onClick={()=>router.push('/')} style={{width:'100%',padding:'12px',background:'#b87333',color:'white',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>Ir al inicio</button>
            </>
          ) : (
            <>
              <div style={{fontSize:36,textAlign:'center',marginBottom:16}}>✈️</div>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--navy)',textAlign:'center',marginBottom:6}}>Te invitaron a un viaje</div>
              <div style={{fontSize:13,color:'var(--text-light)',textAlign:'center',marginBottom:24}}>Rol: <strong style={{color:'var(--navy)'}}>{invite?.role}</strong></div>
              <div style={{background:'var(--bg-cream)',borderRadius:14,padding:'18px 20px',marginBottom:24,border:'1px solid var(--border)'}}>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,color:'var(--navy)',marginBottom:4}}>{invite?.trip_name}</div>
                <div style={{fontSize:13,color:'var(--text-mid)'}}>📍 {invite?.destination}</div>
                <div style={{marginTop:10,fontSize:11,padding:'4px 10px',borderRadius:20,background:invite?.role==='escritor'?'rgba(74,124,89,0.1)':'rgba(74,127,165,0.1)',color:invite?.role==='escritor'?'#4a7c59':'#4a7fa5',display:'inline-block',fontWeight:600}}>
                  {invite?.role==='escritor'?'✏️ Escritor':'👁 Lector'}
                </div>
              </div>
              {!session ? (
                <button onClick={()=>signIn('google')} style={{width:'100%',padding:'12px',background:'#b87333',color:'white',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
                  Continuar con Google para aceptar
                </button>
              ) : (
                <button onClick={handleAccept} disabled={accepting} style={{width:'100%',padding:'12px',background:accepting?'rgba(184,115,51,0.5)':'#b87333',color:'white',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:accepting?'not-allowed':'pointer',fontFamily:'DM Sans,sans-serif'}}>
                  {accepting?'⏳ Aceptando...':'✅ Aceptar invitación'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return <Suspense fallback={<div style={{minHeight:'100vh',background:'var(--bg)'}} />}><InviteContent /></Suspense>
}