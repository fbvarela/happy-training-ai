import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_SUMMARIZE_PROMPT, SUMMARIZE_PROMPT_KEY } from '@/lib/ai/summarizePrompt'

export async function POST(req: NextRequest) {
  const { title, transcript, content, type } = await req.json()
  if (!transcript && !content) return new Response('Missing content', { status: 400 })

  const system = (await getSetting(SUMMARIZE_PROMPT_KEY)) || DEFAULT_SUMMARIZE_PROMPT
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
  const text = transcript ?? content ?? ''

  const result = streamText({
    model: groq('llama-3.1-8b-instant'),
    system,
    prompt: `Resource: "${title}" (${type ?? 'resource'})\n\n${text.slice(0, 12000)}`,
  })

  return result.toTextStreamResponse()
}
