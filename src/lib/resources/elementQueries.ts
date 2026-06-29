import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { resourceElements, type NewResourceElement, type ResourceElement } from '@/lib/db/schema'

export async function getElementsByResourceId(resourceId: number): Promise<ResourceElement[]> {
  return db
    .select()
    .from(resourceElements)
    .where(eq(resourceElements.resourceId, resourceId))
    .orderBy(asc(resourceElements.order))
}

export async function createElement(data: NewResourceElement): Promise<ResourceElement> {
  const rows = await db.insert(resourceElements).values(data).returning()
  return rows[0]
}

export async function updateElement(id: number, data: Partial<NewResourceElement>): Promise<ResourceElement | undefined> {
  const rows = await db
    .update(resourceElements)
    .set(data)
    .where(eq(resourceElements.id, id))
    .returning()
  return rows[0]
}

export async function deleteElement(id: number): Promise<void> {
  await db.delete(resourceElements).where(eq(resourceElements.id, id))
}

export async function reorderElements(resourceId: number, orderedIds: number[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, i) =>
      db.update(resourceElements).set({ order: i }).where(eq(resourceElements.id, id))
    )
  )
}

export { detectType, extractYouTubeId } from './queries'
