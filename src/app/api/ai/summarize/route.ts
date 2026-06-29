import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export async function POST(req: NextRequest) {
  const { title, transcript, content, type } = await req.json()
  if (!transcript && !content) return new Response('Missing content', { status: 400 })

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
  const text = transcript ?? content ?? ''

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are a technical content summarizer. Given a ${type ?? 'resource'} titled "${title}", produce a concise summary.
Structure your response as:
1. **Summary** — 2-3 sentences capturing the main idea
2. **Key takeaways** — 3-5 bullet points
3. **Who should read this** — one sentence on the target audience

Be specific. Use the actual content, not generic statements.`,
    prompt: text.slice(0, 12000),
  })

  return result.toTextStreamResponse()
}
