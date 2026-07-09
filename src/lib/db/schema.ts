import { AnyPgColumn, boolean, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core"

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

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  githubId: text('github_id').notNull().unique(),
  login: text('login').notNull(),
  avatarUrl: text('avatar_url'),
  accessToken: text('access_token').notNull(), // encrypted at rest, see src/lib/auth/tokenCrypto.ts
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const connectedRepos = pgTable('connected_repos', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  githubRepoId: text('github_repo_id').notNull(),
  owner: text('owner').notNull(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  defaultBranch: text('default_branch').notNull(),
  private: boolean('private').notNull().default(false),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const repoFiles = pgTable('repo_files', {
  id: serial('id').primaryKey(),
  repoId: integer('repo_id').notNull().references(() => connectedRepos.id),
  path: text('path').notNull(),
  sha: text('sha').notNull(),
  size: integer('size').notNull().default(0),
  language: text('language'),
  content: text('content'),
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
  // `search_vector` tsvector column + GIN index are created via raw DDL
  // (see scripts run for task #16) — not represented here since drizzle-orm
  // 0.45's pg-core has no generated-column helper; queried via sql`` escape hatch.
})

export const repoSuggestions = pgTable('repo_suggestions', {
  id: serial('id').primaryKey(),
  repoId: integer('repo_id').notNull().references(() => connectedRepos.id),
  suggestions: jsonb('suggestions').notNull(), // array of { title, explanation, language, code, addedAsResourceId? }
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
export type Setting = typeof settings.$inferSelect
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type ConnectedRepo = typeof connectedRepos.$inferSelect
export type NewConnectedRepo = typeof connectedRepos.$inferInsert
export type RepoFile = typeof repoFiles.$inferSelect
export type NewRepoFile = typeof repoFiles.$inferInsert
export type RepoSuggestion = typeof repoSuggestions.$inferSelect
export type NewRepoSuggestion = typeof repoSuggestions.$inferInsert
