import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { getConnectedRepoById } from '@/lib/repos/queries'

export const maxDuration = 60

const MAX_MATCHED_FILES = 8
const MAX_FILE_CHARS = 4_000

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { repoId, question } = await req.json()
  if (!question || typeof question !== 'string') return new Response('Missing question', { status: 400 })

  const repo = await getConnectedRepoById(user.id, Number(repoId))
  if (!repo) return new Response('Repo not found', { status: 404 })

  const searchResult = await db.execute(sql`
    SELECT path, content
    FROM repo_files
    WHERE repo_id = ${repo.id} AND search_vector @@ plainto_tsquery('english', ${question})
    ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${question})) DESC
    LIMIT ${MAX_MATCHED_FILES}
  `)
  const matches = searchResult.rows as unknown as { path: string; content: string }[]

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

  if (matches.length === 0) {
    const result = streamText({
    model: groq('openai/gpt-oss-20b'),
      system: 'You answer questions about a repository, but no relevant indexed files were found for this question.',
      prompt: `The user asked: "${question}"\n\nNo matching files were found in the index. Tell them plainly that you couldn't find relevant files for this question in the synced repo, and suggest they try different keywords or re-sync the repo.`,
    })
    return result.toTextStreamResponse()
  }

  const result = streamText({
      model: groq('openai/gpt-oss-20b'),
    system: `You answer questions about the repository "${repo.fullName}" using only the provided file excerpts. Every factual claim must cite the file path it came from (e.g. "in src/foo.ts"). If the excerpts don't contain the answer, say so explicitly rather than guessing.`,
    prompt: `Question: ${question}

Relevant files:
${matches.map((m) => `--- ${m.path} ---\n${m.content.slice(0, MAX_FILE_CHARS)}`).join('\n\n')}`,
  })

  return result.toTextStreamResponse()
}
