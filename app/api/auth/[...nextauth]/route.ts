import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@/lib/db'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email=?', args: [user.email!] })
        if (!existing.rows.length) {
          await db.execute({
            sql: 'INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)',
            args: [user.email!, user.email!, user.name||'', user.image||'']
          })
        }
        return true
      } catch(e) { return false }
    },
    async session({ session }) { return session }
  },
  pages: { signIn: '/login' }
})

export { handler as GET, handler as POST }