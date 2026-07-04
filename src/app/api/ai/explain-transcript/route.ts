import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { stripHtml } from '@/lib/text/stripHtml'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_EXPLAIN_TRANSCRIPT_PROMPT, EXPLAIN_TRANSCRIPT_PROMPT_KEY } from '@/lib/ai/explainTranscriptPrompt'

export const maxDuration = 120

const MAX_TRANSCRIPT_CHARS = 12_000

export async function POST(req: NextRequest) {
  const { transcript } = await req.json()
  if (!transcript || typeof transcript !== 'string') return new Response('Missing transcript', { status: 400 })

  const clean = stripHtml(transcript).slice(0, MAX_TRANSCRIPT_CHARS)
  const system = (await getSetting(EXPLAIN_TRANSCRIPT_PROMPT_KEY)) || DEFAULT_EXPLAIN_TRANSCRIPT_PROMPT

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system,
    prompt: `Transcript:\n\n${clean}`,
  })

  return result.toTextStreamResponse()
}
