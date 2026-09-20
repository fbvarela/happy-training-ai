export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Convert stray markdown emphasis (which LLM rewrites sometimes emit) into the transcript's allowed HTML subset. */
export function inlineMarkdown(escaped: string): string {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

/** Strip optional markdown heading markers (# or wrapping **) from a line. */
function stripHeadingMarkers(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\*\*(.+?)\*\*$/, '$1')
    .replace(/^\*([^*]+)\*$/, '$1')
    .trim()
}

/** True when a line reads as a section heading: a short all-caps line, optionally with # or ** markers. */
export function isTranscriptHeading(line: string): boolean {
  const clean = stripHeadingMarkers(line)
  return (
    clean.length < 80 &&
    clean === clean.toUpperCase() &&
    /^[A-Z0-9\s,:-]+$/.test(clean)
  )
}

/**
 * Normalize a plain-text transcript (possibly with stray markdown from an LLM
 * rewrite) into the sanitized HTML subset the transcript renderer uses:
 * <p>, <h3>, <strong>, <em>. Every short all-caps line becomes its own <h3>,
 * regardless of blank-line separation, so headings never merge into paragraphs.
 */
export function toTranscriptHtml(text: string): string {
  const lines = text.split('\n')
  const blocks: string[] = []
  let para: string[] = []
  const flush = () => {
    const joined = para.join(' ').replace(/\s+/g, ' ').trim()
    para = []
    if (!joined) return
    blocks.push(`<p>${inlineMarkdown(escapeHtml(joined))}</p>`)
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    if (isTranscriptHeading(line)) {
      flush()
      blocks.push(`<h3>${escapeHtml(stripHeadingMarkers(line))}</h3>`)
    } else {
      para.push(raw.trim())
    }
  }
  flush()
  return blocks.join('')
}