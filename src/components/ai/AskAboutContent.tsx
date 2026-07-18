'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Save, Check, RotateCcw, X, MessageCircleQuestion } from 'lucide-react'
import { toast } from 'sonner'
import { StreamingText } from './StreamingText'
import { LANGUAGES } from '@/lib/snippets/languages'
import type { ResourceElement } from '@/lib/db/schema'

interface AskAboutContentProps {
  content: string
  contentLabel: string
  resourceId: number
  defaultLanguage?: string
  onSaved?: (element: ResourceElement) => void
}

function parseTitleAndLanguage(text: string, defaultLanguage = 'markdown') {
  const titleMatch = text.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : ''
  const body = titleMatch ? text.slice(0, titleMatch.index) + text.slice((titleMatch.index ?? 0) + titleMatch[0].length) : text

  const fenceMatch = text.match(/```(\S*)/)
  const fenceLang = fenceMatch?.[1]
  const language = fenceLang && (LANGUAGES as readonly string[]).includes(fenceLang) ? fenceLang : defaultLanguage

  return { title, body: body.trim(), language }
}

export function AskAboutContent({ content, contentLabel, resourceId, defaultLanguage, onSaved }: AskAboutContentProps) {
  const [triggered, setTriggered] = useState(false)
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleAsk() {
    if (!question.trim()) return
    setAsked(true)
    setLoading(true)
    setSaved(false)
    setFailed(false)
    setText('')

    let accumulated = ''
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, question, contentLabel }),
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
      setText('Failed to generate an answer. Please try again in a few minutes.')
    } finally {
      setLoading(false)
    }
  }

  async function saveAsSnippet() {
    const { title, body, language } = parseTitleAndLanguage(text, defaultLanguage)
    setSaving(true)
    try {
      const res = await fetch(`/api/resources/${resourceId}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'snippet',
          title: title || `Q&A: ${question.slice(0, 60)}`,
          language,
          code: body,
        }),
      })
      if (!res.ok) throw new Error()
      const element = await res.json()
      onSaved?.(element)
      setSaved(true)
      toast.success('Saved as snippet')
      setTriggered(false)
      setAsked(false)
      setQuestion('')
    } catch {
      toast.error('Failed to save answer')
    } finally {
      setSaving(false)
    }
  }

  function hide() {
    setTriggered(false)
    setAsked(false)
    setQuestion('')
    setText('')
    setFailed(false)
    setSaved(false)
  }

  return (
    <div style={{ marginTop: '20px' }}>
      {!triggered ? (
        <button onClick={() => setTriggered(true)} className="btn btn-ghost btn-sm">
          <MessageCircleQuestion size={14} />
          Ask AI
        </button>
      ) : (
        <div style={{ background: 'var(--cream)', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Sparkles size={13} style={{ color: 'var(--leaf)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
              Ask AI
            </span>
            {loading && <Loader2 size={13} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />}
            {!loading && failed && (
              <button onClick={handleAsk} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
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
            <button onClick={hide} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '4px' }} aria-label="Close ask AI">
              <X size={13} />
            </button>
          </div>

          {!asked ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder={`Ask something about ${contentLabel}…`}
                className="hf-input"
                style={{ flex: 1, fontSize: '0.875rem', padding: '6px 10px' }}
                autoFocus
              />
              <button onClick={handleAsk} disabled={!question.trim()} className="btn btn-primary btn-sm">
                Ask
              </button>
            </div>
          ) : text ? (
            <StreamingText text={text} />
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Generating answer…</p>
          )}
        </div>
      )}
    </div>
  )
}
