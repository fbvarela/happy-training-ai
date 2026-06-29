'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StreamingText } from './StreamingText'
import type { Resource, Topic } from '@/lib/db/schema'

interface TopicSynthesisProps {
  topic: Topic
  resources: Resource[]
}

export function TopicSynthesis({ topic, resources }: TopicSynthesisProps) {
  const [triggered, setTriggered] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSynthesize() {
    setTriggered(true)
    setLoading(true)
    setText('')

    try {
      const res = await fetch('/api/ai/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: topic.name,
          resources: resources.map((r) => ({
            title: r.title,
            type: r.type,
            aiSummary: r.aiSummary,
          })),
        }),
      })
      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setText((prev) => prev + chunk)
      }
    } catch {
      setText('Failed to generate learning map.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      {!triggered ? (
        <Button variant="outline" size="sm" onClick={handleSynthesize} disabled={resources.length === 0}>
          <Sparkles size={16} />
          Generate Learning Map
          {resources.length === 0 && ' (no resources)'}
        </Button>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Learning Map — {topic.name}
              </span>
              {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            </div>
            {text ? (
              <StreamingText text={text} />
            ) : (
              <p className="text-sm text-muted-foreground">Analyzing {resources.length} resources…</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
