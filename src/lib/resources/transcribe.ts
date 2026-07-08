import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { fetchCaptions } from './youtubeCaptions'
import { transcribeWithGemini } from './youtubeGemini'

export interface TranscriptResult {
  formatted: string
  summary: string
  keyPoints: string[]
}

export function extractYouTubeId(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ??
    url.match(/youtu\.be\/([^?/]+)/)
  return m?.[1] ?? null
}

export async function transcribeYouTube(videoUrl: string): Promise<TranscriptResult> {
  const videoId = extractYouTubeId(videoUrl)
  if (!videoId) throw new Error('Invalid YouTube URL')

  let rawTranscript: string
  try {
    const segments = await fetchCaptions(videoId)
    rawTranscript = segments.map((s) => s.text).join(' ')
  } catch (err) {
    console.warn(`[transcribe] Caption fetch failed for ${videoId}, trying Gemini fallback…`, err instanceof Error ? err.message : err)
    const geminiText = await transcribeWithGemini(videoId)
    if (!geminiText) throw err
    rawTranscript = geminiText
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    system: `You are a technical content editor. You receive a raw auto-generated YouTube transcript and return a JSON object with:
- "formatted": the transcript cleaned up into readable paragraphs with chapter markers where topic shifts are detected
- "summary": a 2-3 sentence summary of the content
- "keyPoints": an array of 3-7 key takeaways as short strings

Return ONLY valid JSON, no markdown fences.`,
    prompt: `Raw transcript:\n\n${rawTranscript.slice(0, 12000)}`,
  })

  try {
    return JSON.parse(text) as TranscriptResult
  } catch {
    return {
      formatted: rawTranscript,
      summary: '',
      keyPoints: [],
    }
  }
}
