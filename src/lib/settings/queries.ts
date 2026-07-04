import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'

export async function getSetting(key: string): Promise<string | undefined> {
  const rows = await db.select().from(settings).where(eq(settings.key, key))
  return rows[0]?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } })
}
