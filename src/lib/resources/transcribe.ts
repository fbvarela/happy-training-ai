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

  // Literal transcription: keep the verbatim words exactly as spoken. No
  // summarizing, restructuring, or chapter-marking here — the "rewrite"
  // action is the place that makes the transcript more legible (removing
  // babbling/stutters/overlaps) while preserving every word.
  return {
    formatted: rawTranscript,
    summary: '',
    keyPoints: [],
  }
}
