import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { stripHtml } from '@/lib/text/stripHtml'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_REWRITE_TRANSCRIPT_PROMPT, REWRITE_TRANSCRIPT_PROMPT_KEY } from '@/lib/ai/rewriteTranscriptPrompt'

const CHUNK_SIZE = 8_000
const CHUNK_THRESHOLD = 9_000
const SUMMARIZATION_GUARD_RATIO = 0.6

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length)
    if (end < text.length) {
      const boundary = text.lastIndexOf('\n\n', end)
      if (boundary > start + CHUNK_SIZE / 2) end = boundary + 2
      else {
        const sentence = text.lastIndexOf('. ', end)
        if (sentence > start + CHUNK_SIZE / 2) end = sentence + 2
      }
    }
    chunks.push(text.slice(start, end).trim())
    if (end >= text.length) break
    start = end
  }
  return chunks.filter(Boolean)
}

async function rewriteChunk(chunk: string, systemPrompt: string): Promise<string> {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    system: systemPrompt,
    prompt: chunk,
    maxRetries: 5,
  })
  if (text.length < chunk.length * SUMMARIZATION_GUARD_RATIO) {
    console.warn(`[rewrite] summarization guard tripped (${text.length}/${chunk.length}) — keeping original`)
    return chunk
  }
  return text.trim()
}

export async function rewriteTranscript(rawTranscript: string): Promise<string> {
  const systemPrompt = (await getSetting(REWRITE_TRANSCRIPT_PROMPT_KEY)) || DEFAULT_REWRITE_TRANSCRIPT_PROMPT
  const text = stripHtml(rawTranscript)
  if (text.length <= CHUNK_THRESHOLD) {
    return rewriteChunk(text, systemPrompt)
  }
  const chunks = splitIntoChunks(text)
  // llama-3.1-8b-instant has a tight tokens-per-minute quota — running chunks
  // concurrently blows through it immediately (each chunk is a few thousand
  // tokens), so process them one at a time instead of Promise.all.
  const parts: string[] = []
  for (const chunk of chunks) {
    parts.push(await rewriteChunk(chunk, systemPrompt))
  }
  return parts.join('\n\n')
}
