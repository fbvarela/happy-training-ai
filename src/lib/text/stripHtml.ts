const HTML_TAG_RE = /<(p|div|h1|h2|h3|h4|strong|b|em|i|span|br)\b/i

export function stripHtml(text: string): string {
  if (!HTML_TAG_RE.test(text)) return text
  return text
    .replace(/<\/(p|div|h[1-4])>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
