import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createCohere } from '@ai-sdk/cohere'

export async function POST(req: NextRequest) {
  const { topicName, resources } = await req.json()
  if (!topicName || !resources?.length) return new Response('Missing topic or resources', { status: 400 })

  const cohere = createCohere({ apiKey: process.env.COHERE_API_KEY })

  const resourceList = (resources as Array<{ title: string; type: string; aiSummary?: string | null }>)
    .map((r, i) => `${i + 1}. [${r.type}] ${r.title}${r.aiSummary ? ` — ${r.aiSummary}` : ''}`)
    .join('\n')

  const result = streamText({
    model: cohere('command-r-plus'),
    system: `You are a learning path advisor. Given a topic and its resources, produce a structured learning map.`,
    prompt: `Topic: ${topicName}

Resources:
${resourceList}

Produce a learning map with:
1. **What's covered** — what concepts and skills are addressed by these resources
2. **Suggested learning order** — recommend which resources to tackle first and why
3. **Knowledge gaps** — what important subtopics seem missing from this collection
4. **Next steps** — 3 specific things to learn or explore after completing these resources`,
  })

  return result.toTextStreamResponse()
}
