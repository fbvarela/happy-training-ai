import type { Octokit } from '@octokit/rest'
import { db } from '@/lib/db'
import { repoFiles, connectedRepos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const IGNORED_DIR_RE = /(^|\/)(node_modules|\.git|dist|build|\.next|vendor|coverage|target|out)(\/|$)/
const SOURCE_EXT_RE = /\.(ts|tsx|js|jsx|py|go|rs|rb|java|kt|c|cpp|h|hpp|cs|php|md|json|yaml|yml|sql)$/
const MAX_FILES = 250
const MAX_FILE_CHARS = 6_000
const MAX_FILE_SIZE_BYTES = 200_000

const EXT_LANGUAGE: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  py: 'python', go: 'go', rs: 'rust', rb: 'ruby', java: 'java', kt: 'kotlin',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp', php: 'php',
  md: 'markdown', json: 'json', yaml: 'yaml', yml: 'yaml', sql: 'sql',
}

export async function syncRepoFiles(octokit: Octokit, repoId: number, owner: string, repo: string, branch: string): Promise<number> {
  const { data: tree } = await octokit.git.getTree({ owner, repo, tree_sha: branch, recursive: 'true' })

  const blobs = (tree.tree ?? []).filter(
    (entry) =>
      entry.type === 'blob' &&
      entry.path &&
      !IGNORED_DIR_RE.test(entry.path) &&
      SOURCE_EXT_RE.test(entry.path) &&
      (entry.size ?? 0) > 0 &&
      (entry.size ?? 0) < MAX_FILE_SIZE_BYTES
  ).slice(0, MAX_FILES)

  const files = await Promise.all(
    blobs.map(async (entry) => {
      const { data: blob } = await octokit.git.getBlob({ owner, repo, file_sha: entry.sha! })
      const content = Buffer.from(blob.content, 'base64').toString('utf8').slice(0, MAX_FILE_CHARS)
      const ext = entry.path!.split('.').pop() ?? ''
      return {
        repoId,
        path: entry.path!,
        sha: entry.sha!,
        size: entry.size ?? 0,
        language: EXT_LANGUAGE[ext] ?? null,
        content,
      }
    })
  )

  await db.delete(repoFiles).where(eq(repoFiles.repoId, repoId))
  if (files.length > 0) {
    await db.insert(repoFiles).values(files)
  }
  await db.update(connectedRepos).set({ lastSyncedAt: new Date() }).where(eq(connectedRepos.id, repoId))

  return files.length
}
