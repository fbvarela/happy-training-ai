import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { buildExplanationContext } from '@/lib/resources/explainTranscript'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_EXPLAIN_TRANSCRIPT_PROMPT, EXPLAIN_TRANSCRIPT_PROMPT_KEY } from '@/lib/ai/explainTranscriptPrompt'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { transcript } = await req.json()
  if (!transcript || typeof transcript !== 'string') return new Response('Missing transcript', { status: 400 })

  const context = await buildExplanationContext(transcript)
  const system = (await getSetting(EXPLAIN_TRANSCRIPT_PROMPT_KEY)) || DEFAULT_EXPLAIN_TRANSCRIPT_PROMPT

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

  const result = streamText({
    model: groq('llama-3.1-8b-instant'),
    maxOutputTokens: 2000,
    maxRetries: 5,
    system,
    prompt: `Transcript:\n\n${context}`,
  })

  return result.toTextStreamResponse()
}
