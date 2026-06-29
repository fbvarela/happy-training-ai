'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
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
        setText((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch {
      setText('Failed to generate learning map.')
    } finally {
      setLoading(false)
    }
  }

  if (!triggered) {
    return (
      <button
        onClick={handleSynthesize}
        disabled={resources.length === 0}
        className="btn btn-ghost btn-sm"
      >
        <Sparkles size={14} />
        Generate Learning Map
        {resources.length === 0 && ' (no resources)'}
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Sparkles size={13} style={{ color: 'var(--leaf)' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Learning Map — {topic.name}
        </span>
        {loading && <Loader2 size={13} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />}
      </div>
      {text ? (
        <StreamingText text={text} />
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          Analyzing {resources.length} resources…
        </p>
      )}
    </div>
  )
}
