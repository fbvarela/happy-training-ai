'use client'

import { useEffect, useRef } from 'react'

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

  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold mt-3 mb-1">{line.slice(2, -2)}</p>
        }
        if (/^\*\*.*\*\*/.test(line)) {
          return (
            <p key={i} className="mt-3 mb-1">
              <span className="font-semibold">{line.match(/\*\*(.*?)\*\*/)?.[1]}</span>
              {line.replace(/\*\*(.*?)\*\*/, '')}
            </p>
          )
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="ml-4 text-sm">{line.slice(2)}</li>
        }
        if (/^\d+\.\s/.test(line)) {
          return <p key={i} className="text-sm mt-2">{line}</p>
        }
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-sm leading-relaxed">{line}</p>
      })}
    </div>
  )
}
