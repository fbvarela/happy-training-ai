import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_EXPLAIN_CODE_PROMPT, EXPLAIN_CODE_PROMPT_KEY } from '@/lib/ai/explainCodePrompt'

export async function POST(req: NextRequest) {
  const { code, language } = await req.json()
  if (!code) return new Response('Missing code', { status: 400 })

  const system = (await getSetting(EXPLAIN_CODE_PROMPT_KEY)) || DEFAULT_EXPLAIN_CODE_PROMPT
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

  const result = streamText({
    model: groq('openai/gpt-oss-20b'),
    maxOutputTokens: 2048,
    system,
    prompt: `Language: ${language}\n\n\`\`\`${language}\n${code}\n\`\`\``,
  })

  return result.toTextStreamResponse()
}
