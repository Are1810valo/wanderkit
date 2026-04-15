/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Previene que el sitio sea embebido en iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Previene que el browser adivine el tipo de contenido
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Controla info del referrer al navegar
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Habilita HSTS — fuerza HTTPS por 1 año
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Previene XSS y otros ataques de inyección
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://*.openstreetmap.org https://*.tile.openstreetmap.org https://images.unsplash.com https://*.unsplash.com https://lh3.googleusercontent.com https://*.googleusercontent.com",
              "frame-src https://www.openstreetmap.org",
"connect-src 'self' https://api.unsplash.com https://api.openweathermap.org https://wft-geo-db.p.rapidapi.com",
            ].join('; ')
          },
          // Controla qué features del browser puede usar el sitio
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig