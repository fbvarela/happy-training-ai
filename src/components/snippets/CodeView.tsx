'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { codeToHtml } from 'shiki'
import { Button } from '@/components/ui/button'

interface CodeViewProps {
  code: string
  language: string
}

export function CodeView({ code, language }: CodeViewProps) {
  const [html, setHtml] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    codeToHtml(code, {
      lang: language,
      theme: 'one-dark-pro',
    }).then(setHtml).catch(() => setHtml(`<pre><code>${code}</code></pre>`))
  }, [code, language])

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </Button>
      {html ? (
        <div
          className="text-sm rounded overflow-auto [&_pre]:p-4 [&_pre]:rounded [&_pre]:m-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="bg-muted rounded p-4 text-sm overflow-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
