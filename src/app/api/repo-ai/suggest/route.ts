import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getCurrentUser } from '@/lib/auth/session'
import { getConnectedRepoById } from '@/lib/repos/queries'
import { getOctokitForUser } from '@/lib/github/client'
import { buildRepoContext } from '@/lib/github/repoContext'
import { db } from '@/lib/db'
import { repoSuggestions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repoId = Number(req.nextUrl.searchParams.get('repoId'))
  const repo = await getConnectedRepoById(user.id, repoId)
  if (!repo) return NextResponse.json({ error: 'Repo not found' }, { status: 404 })

  const rows = await db.select().from(repoSuggestions)
    .where(eq(repoSuggestions.repoId, repoId))
    .orderBy(desc(repoSuggestions.createdAt))
    .limit(1)

  return NextResponse.json(rows[0] ?? null)
}

interface Suggestion {
  title: string
  why: string
}

function extractJsonArray(text: string): Suggestion[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s) => s?.title && s?.why)
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { repoId } = await req.json()
  const repo = await getConnectedRepoById(user.id, Number(repoId))
  if (!repo) return NextResponse.json({ error: 'Repo not found' }, { status: 404 })

  const octokit = await getOctokitForUser(user.id)
  const context = await buildRepoContext(octokit, repo.owner, repo.name, repo.defaultBranch)

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    system: `You are a technical mentor reviewing a codebase to suggest what its author should study next. Given a file tree and excerpts from key files, suggest 3-7 specific topics they likely need but probably haven't formally learned, each with a one-sentence justification citing what in the code suggests it. Be concrete — name the library/pattern, not "learn more about databases". Output ONLY a JSON array of {"title": string, "why": string}, no other text.`,
    prompt: `Repo: ${repo.fullName}

File tree:
${context.fileTree.join('\n')}

Key files:
${context.keyFiles.map((f) => `--- ${f.path} ---\n${f.content}`).join('\n\n')}`,
  })

  const suggestions = extractJsonArray(text)
  if (suggestions.length === 0) {
    return NextResponse.json({ error: 'Could not generate suggestions' }, { status: 500 })
  }

  const rows = await db.insert(repoSuggestions)
    .values({ repoId: repo.id, suggestions })
    .returning()

  return NextResponse.json(rows[0])
}
