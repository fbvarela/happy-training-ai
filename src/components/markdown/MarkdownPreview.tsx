'use client'

import { useMemo } from 'react'
import { renderMarkdown } from '@/lib/markdown/render'

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const html = useMemo(() => renderMarkdown(content), [content])

  if (!content.trim()) {
    return (
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Nothing to preview yet.
      </p>
    )
  }

  return <div className="reader-body" dangerouslySetInnerHTML={{ __html: html }} />
}
