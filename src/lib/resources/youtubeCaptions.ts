/**
 * Fetch YouTube captions directly via multiple innertube API clients + web fallback.
 * Replaces the `youtube-transcript` npm package, which YouTube blocks outright
 * on datacenter/cloud IPs (Vercel etc.) — it has no fallback strategy.
 */

const INNERTUBE_BASE = 'https://www.youtube.com/youtubei/v1/player'
const WEB_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// Multiple client configs to try — YouTube blocks some clients from certain IPs
const INNERTUBE_CLIENTS = [
  {
    name: 'WEB',
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20241126.01.00',
      },
    },
    ua: WEB_UA,
  },
  {
    name: 'ANDROID',
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38',
      },
    },
    ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
  },
  {
    name: 'IOS',
    context: {
      client: {
        clientName: 'IOS',
        clientVersion: '20.10.4',
      },
    },
    ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X;)',
  },
]

export interface CaptionSegment {
  text: string
  duration: number
  offset: number
  lang: string
}

// ── HTML entity decoder ─────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

// ── XML parsing ─────────────────────────────────────────────────────────────

/** Parse srv3 (<p t="ms" d="ms">) or classic (<text start="s" dur="s">) */
function parseTranscriptXml(xml: string, lang: string): CaptionSegment[] {
  const srv3Re = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g
  const segments: CaptionSegment[] = []
  let m: RegExpExecArray | null

  while ((m = srv3Re.exec(xml)) !== null) {
    const offset = parseInt(m[1], 10)
    const duration = parseInt(m[2], 10)
    const inner = m[3]

    let text = ''
    const sRe = /<s[^>]*>([^<]*)<\/s>/g
    let sm: RegExpExecArray | null
    while ((sm = sRe.exec(inner)) !== null) text += sm[1]
    if (!text) text = inner.replace(/<[^>]+>/g, '')

    text = decodeEntities(text).trim()
    if (text) segments.push({ text, duration, offset, lang })
  }

  if (segments.length > 0) return segments

  const classicRe = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g
  while ((m = classicRe.exec(xml)) !== null) {
    segments.push({
      text: decodeEntities(m[3]),
      duration: parseFloat(m[2]),
      offset: parseFloat(m[1]),
      lang,
    })
  }

  return segments
}

// ── Extract inline JSON from YouTube page ───────────────────────────────────

function parseInlineJson(html: string, varName: string): Record<string, unknown> | null {
  const needle = `var ${varName} = `
  const idx = html.indexOf(needle)
  if (idx === -1) return null

  const start = idx + needle.length
  let depth = 0
  for (let i = start; i < html.length; i++) {
    if (html[i] === '{') depth++
    else if (html[i] === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

// ── Caption track selection + fetch ─────────────────────────────────────────

interface CaptionTrack {
  baseUrl: string
  languageCode: string
}

interface InnertubeResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] }
  }
  playabilityStatus?: {
    status?: string
    reason?: string
  }
}

async function fetchFromTracks(tracks: CaptionTrack[], lang?: string): Promise<CaptionSegment[]> {
  if (!tracks || tracks.length === 0) return []

  const track = lang ? (tracks.find((t) => t.languageCode === lang) ?? tracks[0]) : tracks[0]

  try {
    if (!new URL(track.baseUrl).hostname.endsWith('.youtube.com')) return []
  } catch {
    return []
  }

  const res = await fetch(track.baseUrl, {
    headers: { 'User-Agent': WEB_UA },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) return []

  const xml = await res.text()
  return parseTranscriptXml(xml, track.languageCode)
}

// ── Supadata (paid API, bypasses YouTube's datacenter-IP bot gate) ──────────

async function fetchFromSupadata(videoId: string, lang?: string): Promise<CaptionSegment[]> {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) return []

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const params = new URLSearchParams({ url: videoUrl, text: 'false' })
  if (lang) params.set('lang', lang)

  const res = await fetch(`https://api.supadata.ai/v1/transcript?${params}`, {
    headers: { 'x-api-key': apiKey },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = (await res.json()) as {
    content?: Array<{ text: string; offset: number; duration: number; lang?: string }>
    lang?: string
  }
  if (!Array.isArray(data.content)) return []
  const segLang = data.lang ?? lang ?? 'en'
  return data.content.map((s) => ({
    text: s.text,
    offset: s.offset,
    duration: s.duration,
    lang: s.lang ?? segLang,
  }))
}

// ── Main fetch function ─────────────────────────────────────────────────────

/**
 * Fetch captions for a YouTube video. Tries Supadata first (if configured),
 * then multiple innertube API clients (WEB, ANDROID, IOS), then falls back to
 * scraping the web page.
 */
export async function fetchCaptions(videoId: string, lang?: string): Promise<CaptionSegment[]> {
  const errors: string[] = []
  const apiKey = process.env.YOUTUBE_API_KEY

  if (process.env.SUPADATA_API_KEY) {
    try {
      const segments = await fetchFromSupadata(videoId, lang)
      if (segments.length > 0) {
        console.log(`[youtube-captions] ${videoId}: got ${segments.length} segments via Supadata`)
        return segments
      }
      errors.push('Supadata: empty content')
    } catch (err) {
      errors.push(`Supadata: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const innertubeUrl = apiKey
    ? `${INNERTUBE_BASE}?key=${apiKey}&prettyPrint=false`
    : `${INNERTUBE_BASE}?prettyPrint=false`

  for (const client of INNERTUBE_CLIENTS) {
    try {
      const res = await fetch(innertubeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': client.ua,
        },
        body: JSON.stringify({
          context: client.context,
          videoId,
        }),
        signal: AbortSignal.timeout(10_000),
      })

      if (res.ok) {
        const data = (await res.json()) as InnertubeResponse

        const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (Array.isArray(tracks) && tracks.length > 0) {
          const segments = await fetchFromTracks(tracks, lang)
          if (segments.length > 0) {
            console.log(`[youtube-captions] ${videoId}: got ${segments.length} segments via ${client.name} innertube`)
            return segments
          }
        }

        const status = data?.playabilityStatus?.status
        const reason = data?.playabilityStatus?.reason
        if (status && status !== 'OK') {
          errors.push(`${client.name}: ${status} - ${reason ?? 'unknown'}`)
        } else {
          errors.push(`${client.name}: no caption tracks in response`)
        }
      } else {
        errors.push(`${client.name}: HTTP ${res.status}`)
      }
    } catch (err) {
      errors.push(`${client.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': WEB_UA,
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      errors.push(`WebPage: HTTP ${res.status}`)
    } else {
      const html = await res.text()

      if (html.includes('class="g-recaptcha"')) {
        errors.push('WebPage: CAPTCHA/rate-limited')
      } else if (!html.includes('"playabilityStatus":')) {
        errors.push('WebPage: no playabilityStatus (bot-blocked?)')
      } else {
        const playerResponse = parseInlineJson(html, 'ytInitialPlayerResponse') as InnertubeResponse | null

        const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (Array.isArray(tracks) && tracks.length > 0) {
          const segments = await fetchFromTracks(tracks, lang)
          if (segments.length > 0) {
            console.log(`[youtube-captions] ${videoId}: got ${segments.length} segments via web page`)
            return segments
          }
          errors.push('WebPage: tracks found but XML fetch failed')
        } else {
          const hasCaptions = html.includes('"captionTracks"')
          errors.push(
            hasCaptions
              ? "WebPage: captionTracks key exists but couldn't parse tracks"
              : 'WebPage: no caption tracks in page data'
          )
        }
      }
    }
  } catch (err) {
    errors.push(`WebPage: ${err instanceof Error ? err.message : String(err)}`)
  }

  const detail = errors.join('; ')
  console.warn(`[youtube-captions] ${videoId}: all strategies failed: ${detail}`)
  throw new Error(`Captions not available (${detail})`)
}
