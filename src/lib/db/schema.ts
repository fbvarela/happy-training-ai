import { AnyPgColumn, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("📚"),
  color: text("color").default("#6366f1"),
  parentId: integer("parent_id").references((): AnyPgColumn => topics.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").references(() => topics.id),
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

export type Topic = typeof topics.$inferSelect
export type NewTopic = typeof topics.$inferInsert
export type Resource = typeof resources.$inferSelect
export type NewResource = typeof resources.$inferInsert
export type Snippet = typeof snippets.$inferSelect
export type NewSnippet = typeof snippets.$inferInsert
