import NextAuth from 'next-auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { encryptToken } from '@/lib/auth/tokenCrypto'
import { authConfig } from './auth.config'

interface AppToken {
  userId?: number
  githubId?: string
  login?: string
  avatarUrl?: string
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, profile, account }) {
      const t = token as AppToken
      if (profile && account?.access_token) {
        const githubProfile = profile as unknown as { id: number; login: string; avatar_url?: string }
        t.githubId = String(githubProfile.id)
        t.login = githubProfile.login
        t.avatarUrl = githubProfile.avatar_url

        const encrypted = encryptToken(account.access_token)
        const existing = await db.select().from(users).where(eq(users.githubId, t.githubId))
        if (existing[0]) {
          await db.update(users)
            .set({ login: t.login, avatarUrl: t.avatarUrl, accessToken: encrypted })
            .where(eq(users.githubId, t.githubId))
          t.userId = existing[0].id
        } else {
          const inserted = await db.insert(users)
            .values({ githubId: t.githubId, login: t.login, avatarUrl: t.avatarUrl, accessToken: encrypted })
            .returning()
          t.userId = inserted[0].id
        }
      }
      return token
    },
    async session({ session, token }) {
      const t = token as AppToken
      if (session.user) {
        const user = session.user as unknown as { id: number; login: string; image?: string }
        user.id = t.userId as number
        user.login = t.login as string
        user.image = t.avatarUrl
      }
      return session
    },
  },
})
