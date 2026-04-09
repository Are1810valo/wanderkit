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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f1c3f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WanderKit" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}