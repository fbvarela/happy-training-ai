import { AnyPgColumn, integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core"

export const topics = pgTable('topics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon').default('book'),
  color: text('color').default('#6366f1'),
  parentId: integer('parent_id').references((): AnyPgColumn => topics.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  fileUrl: text("file_url"),
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags").default("[]"),
  transcript: text("transcript"),
  transcriptStatus: text("transcript_status"),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
})

export const resourceTopics = pgTable("resource_topics", {
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  topicId: integer("topic_id").notNull().references(() => topics.id),
}, (t) => [
  primaryKey({ columns: [t.resourceId, t.topicId] }),
])

export const snippets = pgTable("snippets", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id),
  title: text("title").notNull(),
  description: text("description"),
  language: text("language").notNull().default("typescript"),
  code: text("code").notNull(),
  tags: text("tags").default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const resourceElements = pgTable('resource_elements', {
  id: serial('id').primaryKey(),
  resourceId: integer('resource_id').notNull().references(() => resources.id),
  type: text('type').notNull(), // 'video' | 'pdf' | 'article' | 'file' | 'image' | 'snippet'
  url: text('url'),
  fileUrl: text('file_url'),
  title: text('title'),
  order: integer('order').notNull().default(0),
  transcript: text('transcript'),
  transcriptStatus: text('transcript_status'),
  language: text('language'), // set when type = 'snippet'
  code: text('code'), // set when type = 'snippet'
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
export type Resource = typeof resources.$inferSelect
export type NewResource = typeof resources.$inferInsert
export type ResourceElement = typeof resourceElements.$inferSelect
export type NewResourceElement = typeof resourceElements.$inferInsert
export type Snippet = typeof snippets.$inferSelect
export type NewSnippet = typeof snippets.$inferInsert
export type ResourceTopic = typeof resourceTopics.$inferSelect
export type NewResourceTopic = typeof resourceTopics.$inferInsert
