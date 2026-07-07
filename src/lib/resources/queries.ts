import { and, desc, eq, inArray, isNull, like, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { resources, resourceTopics, topics, type NewResource, type Resource, type Topic } from '@/lib/db/schema'

export type ResourceWithTopics = Resource & { topics: Topic[] }

async function attachTopics<T extends Resource>(rows: T[]): Promise<(T & { topics: Topic[] })[]> {
  if (rows.length === 0) return []

  const links = await db
    .select({
      resourceId: resourceTopics.resourceId,
      topic: topics,
    })
    .from(resourceTopics)
    .innerJoin(topics, eq(resourceTopics.topicId, topics.id))
    .where(inArray(resourceTopics.resourceId, rows.map((r) => r.id)))

  const topicsByResource = new Map<number, Topic[]>()
  for (const { resourceId, topic } of links) {
    const list = topicsByResource.get(resourceId) ?? []
    list.push(topic)
    topicsByResource.set(resourceId, list)
  }

  return rows.map((r) => ({ ...r, topics: topicsByResource.get(r.id) ?? [] }))
}

export async function getResources(opts?: {
  topicId?: number
  type?: string
  search?: string
}): Promise<ResourceWithTopics[]> {
  const topicFilteredIds = opts?.topicId
    ? await db
        .select({ resourceId: resourceTopics.resourceId })
        .from(resourceTopics)
        .where(eq(resourceTopics.topicId, opts.topicId))
        .then((rows) => rows.map((r) => r.resourceId))
    : null

  if (topicFilteredIds && topicFilteredIds.length === 0) return []

  const rows = await db
    .select()
    .from(resources)
    .where(
      and(
        isNull(resources.deletedAt),
        topicFilteredIds ? inArray(resources.id, topicFilteredIds) : undefined,
        opts?.type ? eq(resources.type, opts.type as Resource['type']) : undefined,
        opts?.search
          ? or(
              like(resources.title, `%${opts.search}%`),
              like(resources.description, `%${opts.search}%`)
            )
          : undefined
      )
    )
    .orderBy(desc(resources.createdAt))

  return attachTopics(rows)
}

export async function getResourceById(id: number): Promise<ResourceWithTopics | undefined> {
  const rows = await db
    .select()
    .from(resources)
    .where(and(eq(resources.id, id), isNull(resources.deletedAt)))
  if (!rows[0]) return undefined
  const [withTopics] = await attachTopics(rows)
  return withTopics
}

export async function getResourcesByTopicId(topicId: number): Promise<ResourceWithTopics[]> {
  return getResources({ topicId })
}

export async function createResource(data: NewResource) {
  const rows = await db.insert(resources).values(data).returning()
  return rows[0]
}

export async function updateResource(id: number, data: Partial<NewResource>) {
  const rows = await db
    .update(resources)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(resources.id, id))
    .returning()
  return rows[0]
}

/** Replace the full set of topics linked to a resource. */
export async function setResourceTopics(resourceId: number, topicIds: number[]): Promise<void> {
  await db.delete(resourceTopics).where(eq(resourceTopics.resourceId, resourceId))
  if (topicIds.length > 0) {
    await db.insert(resourceTopics).values(topicIds.map((topicId) => ({ resourceId, topicId })))
  }
}

export async function softDeleteResource(id: number) {
  await db
    .update(resources)
    .set({ deletedAt: new Date() })
    .where(eq(resources.id, id))
}

export function detectType(url: string): 'video' | 'pdf' | 'article' {
  if (/youtube\.com|youtu\.be/.test(url)) return 'video'
  if (/\.pdf$/i.test(url)) return 'pdf'
  return 'article'
}

export function extractYouTubeId(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ??
    url.match(/youtu\.be\/([^?]+)/)
  return m?.[1] ?? null
}
