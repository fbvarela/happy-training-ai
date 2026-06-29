import { and, desc, eq, isNull, like, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { resources, topics, type NewResource, type Resource } from '@/lib/db/schema'

export async function getResources(opts?: {
  topicId?: number
  type?: string
  search?: string
}): Promise<(Resource & { topicName: string | null; topicIcon: string | null })[]> {
  const rows = await db
    .select({
      id: resources.id,
      topicId: resources.topicId,
      type: resources.type,
      title: resources.title,
      description: resources.description,
      url: resources.url,
      fileUrl: resources.fileUrl,
      thumbnailUrl: resources.thumbnailUrl,
      tags: resources.tags,
      transcript: resources.transcript,
      transcriptStatus: resources.transcriptStatus,
      aiSummary: resources.aiSummary,
      createdAt: resources.createdAt,
      updatedAt: resources.updatedAt,
      deletedAt: resources.deletedAt,
      topicName: topics.name,
      topicIcon: topics.icon,
    })
    .from(resources)
    .leftJoin(topics, eq(resources.topicId, topics.id))
    .where(
      and(
        isNull(resources.deletedAt),
        opts?.topicId ? eq(resources.topicId, opts.topicId) : undefined,
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

  return rows
}

export async function getResourceById(id: number) {
  const rows = await db
    .select({
      id: resources.id,
      topicId: resources.topicId,
      type: resources.type,
      title: resources.title,
      description: resources.description,
      url: resources.url,
      fileUrl: resources.fileUrl,
      thumbnailUrl: resources.thumbnailUrl,
      tags: resources.tags,
      transcript: resources.transcript,
      transcriptStatus: resources.transcriptStatus,
      aiSummary: resources.aiSummary,
      createdAt: resources.createdAt,
      updatedAt: resources.updatedAt,
      deletedAt: resources.deletedAt,
      topicName: topics.name,
      topicIcon: topics.icon,
    })
    .from(resources)
    .leftJoin(topics, eq(resources.topicId, topics.id))
    .where(and(eq(resources.id, id), isNull(resources.deletedAt)))
  return rows[0]
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
