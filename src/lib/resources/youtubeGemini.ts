/**
 * Gemini video understanding fallback for when YouTube caption fetching is
 * blocked (e.g. "Sign in to confirm you're not a bot" on all Innertube
 * clients). Bypasses cloud-IP scraping blocks entirely — Google fetches the
 * video itself when given a YouTube URL via fileData. Uses the v1beta
 * generateContent REST API.
 */

const CHUNK_SECS = 20 * 60 // 20-minute windows — well under per-request video context cap
const MAX_CHUNKS = 24 // hard stop at 8h of video

async function callGeminiModel(
  model: string,
  videoUrl: string,
  apiKey: string,
  window?: { startSec: number; endSec: number }
): Promise<{ text: string | null; status: number; body: string; finishReason?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const basePrompt =
    "Produce a COMPLETE verbatim transcript of every spoken word, from the exact " +
    "start to the exact end of the clip provided. Do not shorten, abbreviate, " +
    "paraphrase, or summarize. Do not skip sections. Do not write '[continues]', " +
    "'[transcript continues]', or any placeholder — write every word actually " +
    "spoken. Output plain text only, split into paragraphs at natural speaker/topic " +
    "breaks. No headings, no timestamps, no speaker labels, no commentary. Clean " +
    "only obvious filler (um, uh) and stutters. If the clip contains no speech, " +
    "output the single word: EMPTY"

  const prompt = window
    ? `${basePrompt}\n\nClip window: ${window.startSec}s to ${window.endSec}s.`
    : basePrompt

  const fileData: Record<string, unknown> = {
    fileUri: videoUrl,
    mimeType: 'video/*',
  }
  const videoMetadata = window
    ? { startOffset: `${window.startSec}s`, endOffset: `${window.endSec}s` }
    : undefined

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [videoMetadata ? { fileData, videoMetadata } : { fileData }, { text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 65_536,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(300_000),
  })

  if (!res.ok) return { text: null, status: res.status, body: await res.text() }

  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] }
      finishReason?: string
    }[]
  }
  const candidate = data.candidates?.[0]
  const text = candidate?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim()
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    console.warn(
      `[youtube-gemini] ${model} finishReason=${candidate.finishReason} window=${window ? `${window.startSec}-${window.endSec}s` : 'full'} (text: ${text?.length ?? 0} chars)`
    )
  }
  return {
    text: text && text.length > 0 ? text : null,
    status: res.status,
    body: '',
    finishReason: candidate?.finishReason,
  }
}

async function callGeminiModelChunked(
  model: string,
  videoUrl: string,
  apiKey: string
): Promise<{ text: string | null; status: number; body: string }> {
  const chunks: string[] = []
  let lastStatus = 0
  let lastBody = ''

  for (let i = 0; i < MAX_CHUNKS; i++) {
    const startSec = i * CHUNK_SECS
    const endSec = startSec + CHUNK_SECS
    const { text, status, body } = await callGeminiModel(model, videoUrl, apiKey, { startSec, endSec })
    lastStatus = status
    lastBody = body

    // Retryable error — surface so the retry-wrapper above can handle it
    if (status === 503 || status === 429) return { text: null, status, body }

    // Non-retryable HTTP error — bail with what we have
    if (status >= 400) {
      if (chunks.length === 0) return { text: null, status, body }
      break
    }

    // End of video sentinel: Gemini returns "EMPTY" or null for past-end windows
    if (!text || text === 'EMPTY' || text.length < 20) break

    chunks.push(text)
  }

  return {
    text: chunks.length > 0 ? chunks.join('\n\n') : null,
    status: lastStatus || 200,
    body: lastBody,
  }
}

export async function transcribeWithGemini(videoId: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
  if (!key) {
    console.warn('[youtube-gemini] GEMINI_API_KEY not set — Gemini fallback unavailable')
    return null
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const primary = process.env.GEMINI_VIDEO_MODEL ?? 'gemini-2.5-flash'
  const fallbacks = (process.env.GEMINI_VIDEO_FALLBACKS ?? 'gemini-2.0-flash,gemini-2.5-pro')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const models = [primary, ...fallbacks.filter((m) => m !== primary)]

  // 503/429 → retry same model with backoff before dropping to next
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { text, status, body } = await callGeminiModelChunked(model, videoUrl, key)
        if (text) return text
        if (status === 503 || status === 429) {
          const wait = 1500 * 2 ** attempt
          console.warn(`[youtube-gemini] ${model} ${status} for ${videoId}, retry in ${wait}ms`)
          await new Promise((r) => setTimeout(r, wait))
          continue
        }
        console.warn(`[youtube-gemini] ${model} error for ${videoId}: ${status} ${body}`)
        break // non-retryable — try next model
      } catch (err) {
        console.warn(`[youtube-gemini] ${model} threw for ${videoId}:`, err instanceof Error ? err.message : err)
        break
      }
    }
  }
  return null
}
