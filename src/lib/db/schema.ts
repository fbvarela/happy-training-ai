import { sql } from 'drizzle-orm'
import { AnySQLiteColumn, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const topics = sqliteTable('topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon').default('📚'),
  color: text('color').default('#6366f1'),
  parentId: integer('parent_id').references((): AnySQLiteColumn => topics.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const resources = sqliteTable('resources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id').references(() => topics.id),
  type: text('type', { enum: ['video', 'pdf', 'article', 'snippet'] }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  fileUrl: text('file_url'),
  thumbnailUrl: text('thumbnail_url'),
  tags: text('tags').default('[]'), // JSON array stored as text
  transcript: text('transcript'),
  transcriptStatus: text('transcript_status', {
    enum: ['pending', 'processing', 'done', 'failed'],
  }),
  aiSummary: text('ai_summary'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at'),
})

export const snippets = sqliteTable('snippets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  resourceId: integer('resource_id').references(() => resources.id),
  title: text('title').notNull(),
  description: text('description'),
  language: text('language').notNull().default('typescript'),
  code: text('code').notNull(),
  tags: text('tags').default('[]'), // JSON array stored as text
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
export type Resource = typeof resources.$inferSelect
export type NewResource = typeof resources.$inferInsert
export type Snippet = typeof snippets.$inferSelect
export type NewSnippet = typeof snippets.$inferInsert
