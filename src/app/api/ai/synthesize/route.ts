import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createCohere } from '@ai-sdk/cohere'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_SYNTHESIZE_PROMPT, SYNTHESIZE_PROMPT_KEY } from '@/lib/ai/synthesizePrompt'

export async function POST(req: NextRequest) {
  const { topicName, resources } = await req.json()
  if (!topicName || !resources?.length) return new Response('Missing topic or resources', { status: 400 })

  const system = (await getSetting(SYNTHESIZE_PROMPT_KEY)) || DEFAULT_SYNTHESIZE_PROMPT
  const cohere = createCohere({ apiKey: process.env.COHERE_API_KEY })

  const resourceList = (resources as Array<{ title: string; type: string; aiSummary?: string | null }>)
    .map((r, i) => `${i + 1}. [${r.type}] ${r.title}${r.aiSummary ? ` — ${r.aiSummary}` : ''}`)
    .join('\n')

  const result = streamText({
    model: cohere('command-a-03-2025'),
    system,
    prompt: `Topic: ${topicName}

Resources:
${resourceList}`,
  })

  return result.toTextStreamResponse()
}
