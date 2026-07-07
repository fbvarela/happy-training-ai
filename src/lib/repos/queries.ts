import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { connectedRepos, repoFiles, repoSuggestions, type NewConnectedRepo, type ConnectedRepo, type RepoSuggestion } from '@/lib/db/schema'

export async function getConnectedRepos(userId: number): Promise<ConnectedRepo[]> {
  return db.select().from(connectedRepos).where(eq(connectedRepos.userId, userId))
}

export async function getConnectedRepoById(userId: number, id: number): Promise<ConnectedRepo | undefined> {
  const rows = await db.select().from(connectedRepos)
    .where(and(eq(connectedRepos.id, id), eq(connectedRepos.userId, userId)))
  return rows[0]
}

export async function connectRepo(data: NewConnectedRepo): Promise<ConnectedRepo> {
  const rows = await db.insert(connectedRepos).values(data).returning()
  return rows[0]
}

export async function getLatestSuggestion(repoId: number): Promise<RepoSuggestion | undefined> {
  const rows = await db.select().from(repoSuggestions)
    .where(eq(repoSuggestions.repoId, repoId))
    .orderBy(desc(repoSuggestions.createdAt))
    .limit(1)
  return rows[0]
}

export async function disconnectRepo(userId: number, id: number): Promise<void> {
  await db.delete(repoSuggestions).where(eq(repoSuggestions.repoId, id))
  await db.delete(repoFiles).where(eq(repoFiles.repoId, id))
  await db.delete(connectedRepos).where(and(eq(connectedRepos.id, id), eq(connectedRepos.userId, userId)))
}
