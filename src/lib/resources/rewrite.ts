import { generateText } from 'ai'
import { createCohere } from '@ai-sdk/cohere'
import { stripHtml } from '@/lib/text/stripHtml'
import { toTranscriptHtml } from '@/lib/text/transcriptMarkdown'
import { getSetting } from '@/lib/settings/queries'
import { DEFAULT_REWRITE_TRANSCRIPT_PROMPT, REWRITE_TRANSCRIPT_PROMPT_KEY } from '@/lib/ai/rewriteTranscriptPrompt'

const CHUNK_SIZE = 8_000
const CHUNK_THRESHOLD = 9_000
// Since rewrite must now preserve the speaker's wording near-verbatim, keep
// output close to the input length. If the model still condenses hard enough
// to fall below this ratio, we trust the original over the AI.
const SUMMARIZATION_GUARD_RATIO = 0.75

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
  const cohere = createCohere({ apiKey: process.env.COHERE_API_KEY })
  const { text } = await generateText({
    model: cohere('command-a-03-2025'),
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
  let rewritten: string
  if (text.length <= CHUNK_THRESHOLD) {
    rewritten = await rewriteChunk(text, systemPrompt)
  } else {
    const chunks = splitIntoChunks(text)
    // The model has a tight tokens-per-minute quota — running chunks
    // concurrently blows through it immediately (each chunk is a few thousand
    // tokens), so process them one at a time instead of Promise.all.
    const parts: string[] = []
    for (const chunk of chunks) {
      parts.push(await rewriteChunk(chunk, systemPrompt))
    }
    rewritten = parts.join('\n\n')
  }
  // The transcript renderer displays sanitized HTML (<p>/<h3>/<strong>/<em>),
  // and LLM rewrites sometimes come back with markdown emphasis or headings
  // glued to paragraphs. Normalize to that HTML subset so it renders cleanly.
  return toTranscriptHtml(rewritten)
}
