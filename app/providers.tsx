'use client'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  useEffect(()=>{
    if(status==='unauthenticated' && pathname !== '/login' && pathname !== '/invite') {
      router.replace('/login')
    }
  },[status, pathname, router])
  if(status==='loading') return null
  return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  )
}