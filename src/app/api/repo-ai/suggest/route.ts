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

// The model has a hard per-request token ceiling — a full
// file tree (up to 400 paths) plus 8 full key files easily blows past it
// ("Request too large ... Requested 6984"). Cap the combined context text
// well under that, leaving headroom for the larger structured output
// (explanation + code example per suggestion) so the request always fits.
const MAX_CONTEXT_CHARS = 12_000

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
  explanation: string
  language: string
  code: string
}

// Parsed from a markdown-delimited format (## title / prose / fenced code
// block) rather than JSON — small models reliably mangle JSON
// string-escaping for multi-line code containing quotes/backticks/newlines,
// but this format has no escaping to get wrong. Splits on `## ` headings
// directly (rather than a separator line the model may not reliably emit)
// since that's the one element models consistently produce once per
// suggestion.
function extractSuggestions(text: string): Suggestion[] {
  const headings = [...text.matchAll(/^##\s+(.+)$/gm)]
  const suggestions: Suggestion[] = []

  for (let i = 0; i < headings.length; i++) {
    const title = headings[i][1].trim()
    const start = (headings[i].index ?? 0) + headings[i][0].length
    const end = i + 1 < headings.length ? headings[i + 1].index : text.length
    const block = text.slice(start, end)

    const codeMatch = block.match(/```(\S*)\n([\s\S]*?)```/)
    if (!codeMatch) continue

    const language = codeMatch[1] || 'text'
    const code = codeMatch[2].trim()
    // Strip a stray subheading (e.g. "### Explanation") the model
    // sometimes adds before the prose.
    const explanation = block
      .slice(0, codeMatch.index)
      .replace(/^#{1,4}\s+.*$/m, '')
      .trim()

    if (title && explanation && code) suggestions.push({ title, explanation, language, code })
  }

  return suggestions
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
      model: groq('openai/gpt-oss-20b'),
      maxOutputTokens: 1600,
      system: `You are a technical mentor reviewing a codebase to suggest what its author should study next. Given a file tree and excerpts from key files, suggest 3-5 specific topics they likely need but probably haven't formally learned. For each, produce a full learning resource, not just a pointer: a title, a short explanation (2-4 sentences) of the concept and why the code suggests they need it, and a minimal runnable code example (under 20 lines) demonstrating it.

Output EXACTLY this format, repeated once per suggestion, with no other text before, after, or between them:

## <title>
<explanation, 2-4 sentences of plain prose — no sub-heading before it>
\`\`\`<language>
<code>
\`\`\`

Be concrete — name the library/pattern, not "learn more about databases". Use the actual language name (e.g. typescript, python) as the fence tag.`,
      prompt: `Repo: ${repo.fullName}\n\n${contextText}`,
    })
    text = result.text
  } catch (err) {
    console.error(`[repo-ai/suggest] Groq request failed for repo ${repo.fullName}:`, err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI request failed: ${message}` }, { status: 502 })
  }

  const suggestions = extractSuggestions(text)
  if (suggestions.length === 0) {
    console.error(`[repo-ai/suggest] Could not extract suggestions from model output for repo ${repo.fullName}:`, text)
    return NextResponse.json({ error: 'Could not parse suggestions from AI response' }, { status: 500 })
  }

  const rows = await db.insert(repoSuggestions)
    .values({ repoId: repo.id, suggestions })
    .returning()

  return NextResponse.json(rows[0])
}
