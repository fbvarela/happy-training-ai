'use client'

import { useState } from 'react'
import { MessageSquare, Send, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { StreamingText } from '@/components/ai/StreamingText'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export function RepoChat({ repoId }: { repoId: number }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [syncing, setSyncing] = useState(false)

  async function sync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/repo-ai/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`Synced ${data.synced} files`)
    } catch {
      toast.error('Failed to sync repo files')
    } finally {
      setSyncing(false)
    }
  }

  async function ask() {
    const q = question.trim()
    if (!q || asking) return
    setQuestion('')
    setMessages((prev) => [...prev, { role: 'user', text: q }, { role: 'assistant', text: '' }])
    setAsking(true)

    try {
      const res = await fetch('/api/repo-ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId, question: q }),
      })
      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', text: accumulated }
          return next
        })
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', text: 'Failed to get an answer. Please try again.' }
        return next
      })
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="hf-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 className="hf-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <MessageSquare size={16} />
          Ask about this repo
        </h2>
        <button onClick={sync} disabled={syncing} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
          {syncing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={13} />}
          {syncing ? 'Syncing…' : 'Re-sync files'}
        </button>
      </div>

      {messages.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Sync the repo first (button above), then ask questions like &quot;where is X handled?&quot; — answers cite file paths.
        </p>
      )}

      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px', maxHeight: '480px', overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i}>
              {m.role === 'user' ? (
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--bark)' }}>{m.text}</div>
              ) : m.text ? (
                <StreamingText text={m.text} />
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Thinking…</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          className="hf-input"
          placeholder="Ask a question about this repo…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ask() }}
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
        />
        <button onClick={ask} disabled={asking || !question.trim()} className="btn btn-primary btn-sm">
          {asking ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}
