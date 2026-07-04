'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Save, Check, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { StreamingText } from './StreamingText'
import type { ResourceElement } from '@/lib/db/schema'

interface ExplainTranscriptProps {
  transcript: string
  resourceId: number
  onSaved?: (element: ResourceElement) => void
}

export function ExplainTranscript({ transcript, resourceId, onSaved }: ExplainTranscriptProps) {
  const [triggered, setTriggered] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleExplain() {
    setTriggered(true)
    setLoading(true)
    setSaved(false)
    setFailed(false)
    setText('')

    let accumulated = ''
    try {
      const res = await fetch('/api/ai/explain-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setText(accumulated)
      }
      if (!accumulated.trim()) throw new Error('Empty response')
    } catch {
      setFailed(true)
      setText('Failed to generate explanation. Please try again in a few minutes.')
    } finally {
      setLoading(false)
    }
  }

  async function saveAsSnippet() {
    setSaving(true)
    try {
      const res = await fetch(`/api/resources/${resourceId}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'snippet', title: 'AI Explanation', language: 'markdown', code: text }),
      })
      if (!res.ok) throw new Error()
      const element = await res.json()
      onSaved?.(element)
      setSaved(true)
      toast.success('Saved as snippet')
    } catch {
      toast.error('Failed to save explanation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: '20px' }}>
      {!triggered ? (
        <button onClick={handleExplain} className="btn btn-ghost btn-sm">
          <Sparkles size={14} />
          AI Explain
        </button>
      ) : (
        <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Sparkles size={13} style={{ color: 'var(--leaf)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
              AI Explanation
            </span>
            {loading && <Loader2 size={13} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />}
            {!loading && failed && (
              <button onClick={handleExplain} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                <RotateCcw size={13} /> Retry
              </button>
            )}
            {!loading && !failed && text && (
              <button
                onClick={saveAsSnippet}
                disabled={saving || saved}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                {saved ? <Check size={13} /> : saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                {saved ? 'Saved' : saving ? 'Saving…' : 'Save as snippet'}
              </button>
            )}
          </div>
          {text ? (
            <StreamingText text={text} />
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Generating explanation…</p>
          )}
        </div>
      )}
    </div>
  )
}
