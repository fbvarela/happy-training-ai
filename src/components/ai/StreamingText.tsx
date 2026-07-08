'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { CodeView } from '@/components/snippets/CodeView'

interface StreamingTextProps {
  text: string
  className?: string
}

export function StreamingText({ text, className }: StreamingTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [text])

  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let codeLines: string[] | null = null
  let codeLang = 'text'
  let listItems: ReactNode[] = []

  function flushList(key: string | number) {
    if (listItems.length === 0) return
    blocks.push(<ul key={`list-${key}`} className="ml-4" style={{ margin: '4px 0' }}>{listItems}</ul>)
    listItems = []
  }

  lines.forEach((line, i) => {
    const fence = line.match(/^```(\w*)/)
    if (fence) {
      flushList(i)
      if (codeLines === null) {
        codeLines = []
        codeLang = fence[1] || 'text'
      } else {
        blocks.push(<CodeView key={i} code={codeLines.join('\n')} language={codeLang} />)
        codeLines = null
      }
      return
    }
    if (codeLines !== null) {
      codeLines.push(line)
      return
    }

    const heading = line.match(/^(#{1,4})\s+(.*)/)
    const bullet = line.match(/^[-•*]\s+(.*)/)
    const numbered = line.match(/^\d+\.\s+(.*)/)

    if (heading) {
      flushList(i)
      const level = heading[1].length
      const fontSize = level === 1 ? '1.15rem' : level === 2 ? '1.05rem' : '0.95rem'
      blocks.push(<p key={i} className="font-semibold" style={{ fontSize, marginTop: '14px', marginBottom: '4px' }}>{renderInline(heading[2])}</p>)
    } else if (bullet) {
      listItems.push(<li key={i} className="text-sm" style={{ textAlign: 'justify' }}>{renderInline(bullet[1])}</li>)
    } else if (numbered) {
      flushList(i)
      blocks.push(<p key={i} className="text-sm mt-2" style={{ textAlign: 'justify' }}>{renderInline(line)}</p>)
    } else if (line.trim() === '') {
      flushList(i)
      blocks.push(<br key={i} />)
    } else {
      flushList(i)
      blocks.push(<p key={i} className="text-sm leading-relaxed" style={{ textAlign: 'justify', hyphens: 'auto' }}>{renderInline(line)}</p>)
    }
  })
  flushList('end')

  return <div ref={ref} className={className}>{blocks}</div>
}

/** Render inline markdown (currently just **bold**) within a line of text. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}
