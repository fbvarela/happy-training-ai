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

// llama-3.1-8b-instant has a hard ~6,000 token per-request ceiling — a full
// file tree (up to 400 paths) plus 8 full key files easily blows past it
// ("Request too large ... Requested 6984"). Cap the combined context text
// well under that so the request always fits.
const MAX_CONTEXT_CHARS = 14_000

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

  let context: Awaited<ReturnType<typeof buildRepoContext>>
  try {
    const octokit = await getOctokitForUser(user.id)
    context = await buildRepoContext(octokit, repo.owner, repo.name, repo.defaultBranch)
  } catch (err) {
    console.error(`[repo-ai/suggest] Failed to read repo ${repo.fullName}:`, err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Could not read repo from GitHub: ${message}` }, { status: 502 })
  }

  let text: string
  try {
    const contextText = `File tree:
${context.fileTree.join('\n')}

Key files:
${context.keyFiles.map((f) => `--- ${f.path} ---\n${f.content}`).join('\n\n')}`.slice(0, MAX_CONTEXT_CHARS)

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
    const result = await generateText({
      model: groq('llama-3.1-8b-instant'),
      maxOutputTokens: 800,
      system: `You are a technical mentor reviewing a codebase to suggest what its author should study next. Given a file tree and excerpts from key files, suggest 3-7 specific topics they likely need but probably haven't formally learned, each with a one-sentence justification citing what in the code suggests it. Be concrete — name the library/pattern, not "learn more about databases". Output ONLY a JSON array of {"title": string, "why": string}, no other text.`,
      prompt: `Repo: ${repo.fullName}\n\n${contextText}`,
    })
    text = result.text
  } catch (err) {
    console.error(`[repo-ai/suggest] Groq request failed for repo ${repo.fullName}:`, err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI request failed: ${message}` }, { status: 502 })
  }

  const suggestions = extractJsonArray(text)
  if (suggestions.length === 0) {
    console.error(`[repo-ai/suggest] Could not extract suggestions from model output for repo ${repo.fullName}:`, text)
    return NextResponse.json({ error: 'Could not parse suggestions from AI response' }, { status: 500 })
  }

  const rows = await db.insert(repoSuggestions)
    .values({ repoId: repo.id, suggestions })
    .returning()

  return NextResponse.json(rows[0])
}
