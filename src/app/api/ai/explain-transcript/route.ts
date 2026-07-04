import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { stripHtml } from '@/lib/text/stripHtml'

export const maxDuration = 120

const MAX_TRANSCRIPT_CHARS = 12_000

export async function POST(req: NextRequest) {
  const { transcript } = await req.json()
  if (!transcript || typeof transcript !== 'string') return new Response('Missing transcript', { status: 400 })

  const clean = stripHtml(transcript).slice(0, MAX_TRANSCRIPT_CHARS)

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are a senior instructor explaining a topic covered in a video/article transcript.

Write a clear, well-organized explanation in Markdown:
- Use ## headings to break the explanation into sections.
- Explain the concepts in your own words — do not just restate the transcript.
- Where the topic involves code, include fenced code blocks with the correct language tag (e.g. \`\`\`typescript) showing a concrete, runnable example.
- Keep prose concise; prioritize clarity over exhaustiveness.
- Output Markdown only, no preamble like "Here is an explanation".`,
    prompt: `Transcript:\n\n${clean}`,
  })

  return result.toTextStreamResponse()
}
