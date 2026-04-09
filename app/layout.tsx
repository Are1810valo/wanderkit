import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'WanderKit — Tu Gestor de Viajes',
  description: 'Planifica, ejecuta y recuerda cada aventura',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="light">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}