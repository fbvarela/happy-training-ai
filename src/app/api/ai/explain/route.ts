import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createCohere } from '@ai-sdk/cohere'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_EXPLAIN_CODE_PROMPT, EXPLAIN_CODE_PROMPT_KEY } from '@/lib/ai/explainCodePrompt'

export async function POST(req: NextRequest) {
  const { code, language } = await req.json()
  if (!code) return new Response('Missing code', { status: 400 })

  const system = (await getSetting(EXPLAIN_CODE_PROMPT_KEY)) || DEFAULT_EXPLAIN_CODE_PROMPT
  const cohere = createCohere({ apiKey: process.env.COHERE_API_KEY })

  const result = streamText({
    model: cohere('command-a-03-2025'),
    maxOutputTokens: 4096,
    system,
    prompt: `Language: ${language}\n\n\`\`\`${language}\n${code}\n\`\`\``,
  })

  return result.toTextStreamResponse()
}
