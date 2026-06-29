'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StreamingText } from './StreamingText'

interface ExplainSnippetProps {
  code: string
  language: string
}

export function ExplainSnippet({ code, language }: ExplainSnippetProps) {
  const [triggered, setTriggered] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleExplain() {
    setTriggered(true)
    setLoading(true)
    setText('')

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })
      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // AI SDK data stream format: lines starting with "0:" contain text
        setText((prev) => prev + chunk)
      }
    } catch {
      setText('Failed to generate explanation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6">
      {!triggered ? (
        <Button variant="outline" size="sm" onClick={handleExplain}>
          <Sparkles size={16} />
          Explain with AI
        </Button>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Explanation</span>
              {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            </div>
            {text ? (
              <StreamingText text={text} />
            ) : (
              <p className="text-sm text-muted-foreground">Generating explanation…</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
