import { auth } from '@/auth'

export interface CurrentUser {
  id: number
  login: string
  image?: string
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth()
  if (!session?.user) return null
  const user = session.user as unknown as { id: number; login: string; image?: string }
  return { id: user.id, login: user.login, image: user.image }
}
