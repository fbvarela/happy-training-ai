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

  lines.forEach((line, i) => {
    const fence = line.match(/^```(\w*)/)
    if (fence) {
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
    if (heading) {
      const level = heading[1].length
      const fontSize = level === 1 ? '1.15rem' : level === 2 ? '1.05rem' : '0.95rem'
      blocks.push(<p key={i} className="font-semibold" style={{ fontSize, marginTop: '14px', marginBottom: '4px' }}>{heading[2]}</p>)
    } else if (line.startsWith('**') && line.endsWith('**')) {
      blocks.push(<p key={i} className="font-semibold mt-3 mb-1">{line.slice(2, -2)}</p>)
    } else if (/^\*\*.*\*\*/.test(line)) {
      blocks.push(
        <p key={i} className="mt-3 mb-1" style={{ textAlign: 'justify' }}>
          <span className="font-semibold">{line.match(/\*\*(.*?)\*\*/)?.[1]}</span>
          {line.replace(/\*\*(.*?)\*\*/, '')}
        </p>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      blocks.push(<li key={i} className="ml-4 text-sm" style={{ textAlign: 'justify' }}>{line.slice(2)}</li>)
    } else if (/^\d+\.\s/.test(line)) {
      blocks.push(<p key={i} className="text-sm mt-2" style={{ textAlign: 'justify' }}>{line}</p>)
    } else if (line.trim() === '') {
      blocks.push(<br key={i} />)
    } else {
      blocks.push(<p key={i} className="text-sm leading-relaxed" style={{ textAlign: 'justify', hyphens: 'auto' }}>{line}</p>)
    }
  })

  return <div ref={ref} className={className}>{blocks}</div>
}
