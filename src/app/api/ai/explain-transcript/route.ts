import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createCohere } from '@ai-sdk/cohere'
import { buildExplanationContext } from '@/lib/resources/explainTranscript'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_EXPLAIN_TRANSCRIPT_PROMPT, EXPLAIN_TRANSCRIPT_PROMPT_KEY } from '@/lib/ai/explainTranscriptPrompt'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { transcript } = await req.json()
  if (!transcript || typeof transcript !== 'string') return new Response('Missing transcript', { status: 400 })

  const context = await buildExplanationContext(transcript)
  const system = (await getSetting(EXPLAIN_TRANSCRIPT_PROMPT_KEY)) || DEFAULT_EXPLAIN_TRANSCRIPT_PROMPT

  const cohere = createCohere({ apiKey: process.env.COHERE_API_KEY })

  const result = streamText({
    model: cohere('command-a-03-2025'),
    maxOutputTokens: 4096,
    maxRetries: 5,
    system,
    prompt: `Transcript:\n\n${context}`,
  })

  return result.toTextStreamResponse()
}
