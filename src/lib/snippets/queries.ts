import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { snippets, type NewSnippet, type Snippet } from '@/lib/db/schema'

export { LANGUAGES, type Language } from './languages'

export async function getSnippets(opts?: { language?: string }): Promise<Snippet[]> {
  const rows = await db.select().from(snippets).orderBy(snippets.createdAt)
  if (opts?.language) return rows.filter((s) => s.language === opts.language)
  return rows
}

export async function getSnippetById(id: number): Promise<Snippet | undefined> {
  const rows = await db.select().from(snippets).where(eq(snippets.id, id))
  return rows[0]
}

export async function createSnippet(data: NewSnippet): Promise<Snippet> {
  const rows = await db.insert(snippets).values(data).returning()
  return rows[0]
}

export async function updateSnippet(id: number, data: Partial<NewSnippet>): Promise<Snippet | undefined> {
  const rows = await db
    .update(snippets)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(snippets.id, id))
    .returning()
  return rows[0]
}

export async function deleteSnippet(id: number): Promise<void> {
  await db.delete(snippets).where(eq(snippets.id, id))
}
