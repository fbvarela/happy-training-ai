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
3. **Key concepts** — for EACH notable pattern, algorithm, or API used, give its name, a short explanation, and then a minimal, runnable code example demonstrating it in isolation, in a fenced code block tagged with the actual programming language of that example (e.g. \`\`\`java, \`\`\`python — never \`\`\`markdown or \`\`\`text, even if the source content itself is prose/markdown). Keep each example short (under 15 lines) and focused on just that concept.
4. **Gotchas** — any edge cases, caveats, or things to watch out for

Be direct. Skip generic introductions. Cover every section fully — do not cut the explanation short.`,
    prompt: `Language: ${language}\n\n\`\`\`${language}\n${code}\n\`\`\``,
  })

  return result.toTextStreamResponse()
}
