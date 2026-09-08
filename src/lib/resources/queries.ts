import { and, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm'
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
  topicSearch?: boolean
}): Promise<ResourceWithTopics[]> {
  const topicIds = opts?.topicId
    ? await db
        .select({ resourceId: resourceTopics.resourceId })
        .from(resourceTopics)
        .where(eq(resourceTopics.topicId, opts.topicId))
        .then((rows) => rows.map((r) => r.resourceId))
    : null

  if (topicIds && topicIds.length === 0) return []

  const search = opts?.search
  const searchParam = search ? `%${search}%` : null

  if (search && opts?.topicSearch) {
    const rawRows = (await db.execute(sql`
      select distinct r.id, r.type, r.title, r.description, r.url, r.file_url,
             r.thumbnail_url, r.tags, r.transcript, r.transcript_status,
             r.ai_summary, r.created_at, r.updated_at, r.deleted_at
      from resources r
      left join resource_topics rt on rt.resource_id = r.id
      left join topics t on t.id = rt.topic_id
      where r.deleted_at is null
        and (
          r.title ilike ${searchParam}
          or r.description ilike ${searchParam}
          or t.name ilike ${searchParam}
        )
        ${topicIds ? sql`and r.id in (${sql.join(topicIds, sql`, `)})` : sql``}
        ${opts?.type ? sql`and r.type = ${opts.type}` : sql``}
      order by r.created_at desc
    `)).rows
    const resourcesRows = (rawRows as unknown as Resource[]).map((r) => ({
      ...r,
      id: typeof r.id === 'string' ? Number(r.id) : r.id,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
    }))
    return attachTopics(resourcesRows)
  }

  const rows = await db
    .select()
    .from(resources)
    .where(
      and(
        isNull(resources.deletedAt),
        topicIds ? inArray(resources.id, topicIds) : undefined,
        opts?.type ? eq(resources.type, opts.type as Resource['type']) : undefined,
        search && !opts?.topicSearch
          ? or(
              like(resources.title, searchParam!),
              like(resources.description, searchParam!)
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
