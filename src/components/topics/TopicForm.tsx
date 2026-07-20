'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TOPIC_ICONS, DEFAULT_TOPIC_ICON } from '@/lib/topics/icons'
import type { Topic } from '@/lib/db/schema'

const COLORS = [
  '#4a7c59', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#f97316', '#e8a020', '#14b8a6',
  '#06b6d4', '#84cc16', '#c46b3a', '#3d2b1f',
]

interface TopicFormProps {
  topic?: Topic
}

export function TopicForm({ topic }: TopicFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(topic?.name ?? '')
  const [description, setDescription] = useState(topic?.description ?? '')
  const [icon, setIcon] = useState(topic?.icon ?? DEFAULT_TOPIC_ICON)
  const [color, setColor] = useState(topic?.color ?? '#4a7c59')
  const [contentKind, setContentKind] = useState<string | null>(topic?.contentKind ?? null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const url = topic ? `/api/topics/${topic.id}` : '/api/topics'
      const method = topic ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, icon, color, contentKind }),
      })

      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()
      toast.success(topic ? 'Topic updated' : 'Topic created')
      router.push(`/topics/${data.id}`)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="field">
        <label className="input-label" htmlFor="name">Name</label>
        <input
          id="name"
          className="hf-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. TypeScript"
          required
        />
      </div>

      <div className="field">
        <label className="input-label" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="hf-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this topic about?"
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="field">
        <span className="input-label">Icon</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          {Object.entries(TOPIC_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              aria-label={key}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: icon === key ? '2px solid var(--bark)' : '1.5px solid var(--line)',
                background: icon === key ? 'var(--bark)' : 'var(--cream)',
                color: icon === key ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.14s',
              }}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="input-label">Color</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: color === c ? '3px solid var(--bark)' : '2px solid transparent',
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px',
                background: c,
                cursor: 'pointer',
                transition: 'transform 0.14s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <span className="input-label">New notes under this topic</span>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={() => setContentKind(contentKind === 'prose' ? null : 'prose')}
            className={`btn btn-sm ${contentKind === 'prose' || !contentKind ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem' }}
          >
            Mostly writing
          </button>
          <button
            type="button"
            onClick={() => setContentKind(contentKind === 'code' ? null : 'code')}
            className={`btn btn-sm ${contentKind === 'code' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem' }}
          >
            Mostly code
          </button>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          Just a default for the note editor — every resource can still hold any kind of content.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
          {loading ? 'Saving…' : topic ? 'Save Changes' : 'Create Topic'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  )
}
