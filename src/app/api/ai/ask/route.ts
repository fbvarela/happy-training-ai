import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getSetting } from '@/lib/settings/queries'
import { ASK_CONTENT_PROMPT_KEY, DEFAULT_ASK_CONTENT_PROMPT } from '@/lib/ai/askContentPrompt'

// The model has a hard per-request token ceiling (see
// src/lib/resources/explainTranscript.ts and src/app/api/repo-ai/suggest/route.ts
// for the same constraint) — long transcripts sent in full fail outright
// with "Request too large". Cap content well under that, leaving headroom
// for the system prompt, question, and output tokens.
const MAX_CONTENT_CHARS = 9_000

export async function POST(req: NextRequest) {
  const { content, question, contentLabel } = await req.json()
  if (!content?.trim()) return new Response('Missing content', { status: 400 })
  if (!question?.trim()) return new Response('Missing question', { status: 400 })

  const system = (await getSetting(ASK_CONTENT_PROMPT_KEY)) || DEFAULT_ASK_CONTENT_PROMPT
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

  const result = streamText({
    model: groq('openai/gpt-oss-20b'),
    maxOutputTokens: 1200,
    maxRetries: 5,
    system,
    prompt: `Content (${contentLabel || 'this content'}):\n${content.slice(0, MAX_CONTENT_CHARS)}\n\nQuestion: ${question}`,
  })

  return result.toTextStreamResponse()
}
