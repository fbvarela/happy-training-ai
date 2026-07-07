import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { stripHtml } from '@/lib/text/stripHtml'

const CHUNK_SIZE = 8_000
const CHUNK_THRESHOLD = 9_000
const SUMMARIZATION_GUARD_RATIO = 0.6

const SYSTEM_PROMPT = `You rewrite raw YouTube auto-generated transcripts into clean, readable text.

Rules:
- DO NOT summarize, shorten, condense, or omit any content. Every idea, argument, and example must appear in the output.
- Create proper paragraph breaks when the topic or thought shifts.
- Remove speech disfluencies: "um", "uh", "er", filler uses of "like", "you know", "right?", and similar.
- Remove repeated stutters and false starts (e.g. "I I I think" → "I think").
- Remove duplicate or near-duplicate sentences caused by caption overlap.
- If the content has natural sections (new topic, time jump, Q&A), add a short ALL-CAPS heading on its own line.
- Output plain text only. No markdown symbols (**, #, -, etc.).
- Paragraphs separated by blank lines. Section headings on their own line in ALL CAPS.
- It is critical that you do NOT summarize or shorten the text.`

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

async function rewriteChunk(chunk: string): Promise<string> {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    system: SYSTEM_PROMPT,
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
  const text = stripHtml(rawTranscript)
  if (text.length <= CHUNK_THRESHOLD) {
    return rewriteChunk(text)
  }
  const chunks = splitIntoChunks(text)
  // llama-3.1-8b-instant has a tight tokens-per-minute quota — running chunks
  // concurrently blows through it immediately (each chunk is a few thousand
  // tokens), so process them one at a time instead of Promise.all.
  const parts: string[] = []
  for (const chunk of chunks) {
    parts.push(await rewriteChunk(chunk))
  }
  return parts.join('\n\n')
}
