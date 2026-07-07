import { Octokit } from '@octokit/rest'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { decryptToken } from '@/lib/auth/tokenCrypto'

export async function getOctokitForUser(userId: number): Promise<Octokit> {
  const rows = await db.select().from(users).where(eq(users.id, userId))
  const user = rows[0]
  if (!user) throw new Error('User not found')
  const token = decryptToken(user.accessToken)
  return new Octokit({ auth: token })
}
