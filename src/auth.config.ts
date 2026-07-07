import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'

// Edge-safe config — used directly by middleware.ts (which always runs on
// the Edge runtime). Must not import anything that touches the DB or Node's
// `crypto` module; those live only in the full config in auth.ts.
export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      authorization: { params: { scope: 'read:user repo' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ profile }) {
      const login = (profile as unknown as { login?: string } | undefined)?.login
      const allowed = process.env.ALLOWED_GITHUB_LOGIN
      if (!allowed || !login || login.toLowerCase() !== allowed.toLowerCase()) return false
      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
}
