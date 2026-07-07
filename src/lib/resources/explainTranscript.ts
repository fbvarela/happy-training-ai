import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { stripHtml } from '@/lib/text/stripHtml'

// llama-3.1-8b-instant has a hard ~6,000 token per-request ceiling (Groq TPM
// limit applies per call, not just over time) — a full transcript sent in
// one request fails outright with "Request too large". So for long
// transcripts we chunk, take notes per chunk (small output, sequential to
// stay under the ceiling), then synthesize the notes into the final
// explanation — the same map-reduce shape as rewriteTranscript().
const CHUNK_SIZE = 8_000
const CHUNK_THRESHOLD = 9_000
const MAX_TOTAL_CHARS = 100_000
// Keeps the combined notes small enough that the final synthesis call
// (notes + system prompt + its own maxOutputTokens) still fits under
// llama-3.1-8b-instant's ~6,000 token per-request ceiling.
const MAX_NOTES_CHARS = 6_000

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

async function noteChunk(chunk: string): Promise<string> {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    maxOutputTokens: 350,
    maxRetries: 5,
    system: `You are taking detailed notes on a section of a video/article transcript. List the key points, topics, technical terms, and any code/library/API names mentioned, as concise bullet points. Preserve specifics (names, numbers, technical terms) exactly — do not generalize them away.`,
    prompt: chunk,
  })
  return text.trim()
}

/**
 * Reduces a raw (possibly HTML) transcript down to a compact set of
 * per-section notes suitable as input to a final "explain" prompt, staying
 * within Groq's per-request token ceiling regardless of transcript length.
 */
export async function buildExplanationContext(rawTranscript: string): Promise<string> {
  const text = stripHtml(rawTranscript).slice(0, MAX_TOTAL_CHARS)
  if (text.length <= CHUNK_THRESHOLD) return text

  const chunks = splitIntoChunks(text)
  const notes: string[] = []
  for (const chunk of chunks) {
    notes.push(await noteChunk(chunk))
  }
  return notes.map((n, i) => `[Section ${i + 1}]\n${n}`).join('\n\n').slice(0, MAX_NOTES_CHARS)
}
