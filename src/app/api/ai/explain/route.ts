import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export async function POST(req: NextRequest) {
  const { code, language } = await req.json()
  if (!code) return new Response('Missing code', { status: 400 })

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

  const result = streamText({
    model: groq('llama-3.1-8b-instant'),
    maxOutputTokens: 2048,
    system: `You are a senior software engineer. Explain the provided code clearly and thoroughly — don't skimp on depth.
Structure your response as:
1. **What it does** — one sentence overview
2. **How it works** — step-by-step walkthrough of the logic
3. **Key concepts** — list any notable patterns, algorithms, or APIs used
4. **Gotchas** — any edge cases, caveats, or things to watch out for

Be direct. Skip generic introductions. Cover every section fully — do not cut the explanation short.`,
    prompt: `Language: ${language}\n\n\`\`\`${language}\n${code}\n\`\`\``,
  })

  return result.toTextStreamResponse()
}
