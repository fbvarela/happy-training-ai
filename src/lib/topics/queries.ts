import { eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { resources, resourceTopics, topics, type NewTopic, type Topic } from '@/lib/db/schema'

export async function getTopics(): Promise<Topic[]> {
  return db.select().from(topics).orderBy(topics.name)
}

export async function getTopicById(id: number): Promise<Topic | undefined> {
  const rows = await db.select().from(topics).where(eq(topics.id, id))
  return rows[0]
}

export async function getTopicWithResourceCount() {
  const topicList = await db.select().from(topics).orderBy(topics.name)
  const counts = await db
    .select({ topicId: resourceTopics.topicId })
    .from(resourceTopics)
    .innerJoin(resources, eq(resourceTopics.resourceId, resources.id))
    .where(isNull(resources.deletedAt))

  const countMap: Record<number, number> = {}
  for (const { topicId } of counts) {
    countMap[topicId] = (countMap[topicId] ?? 0) + 1
  }

  return topicList.map((t) => ({ ...t, resourceCount: countMap[t.id] ?? 0 }))
}

export async function createTopic(data: NewTopic): Promise<Topic> {
  const rows = await db.insert(topics).values(data).returning()
  return rows[0]
}

export async function updateTopic(id: number, data: Partial<NewTopic>): Promise<Topic | undefined> {
  const rows = await db
    .update(topics)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(topics.id, id))
    .returning()
  return rows[0]
}

export async function deleteTopic(id: number): Promise<void> {
  await db.delete(topics).where(eq(topics.id, id))
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
