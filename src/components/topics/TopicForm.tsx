'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Code2, Loader2, PencilLine, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { TOPIC_ICONS, DEFAULT_TOPIC_ICON } from '@/lib/topics/icons'
import { TOPIC_COLORS, DEFAULT_TOPIC_COLOR } from '@/lib/topics/theme'
import type { Topic } from '@/lib/db/schema'

interface TopicFormProps {
  topic?: Topic
}

export function TopicForm({ topic }: TopicFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(topic?.name ?? '')
  const [description, setDescription] = useState(topic?.description ?? '')
  const [icon, setIcon] = useState(topic?.icon ?? DEFAULT_TOPIC_ICON)
  const [color, setColor] = useState(topic?.color ?? DEFAULT_TOPIC_COLOR)
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
                borderRadius: '10px',
                border: icon === key ? '1.5px solid color-mix(in srgb, var(--leaf) 50%, transparent)' : '1.5px solid var(--line)',
                background: icon === key ? 'linear-gradient(135deg, var(--leaf), color-mix(in srgb, var(--leaf) 82%, var(--leaf-light)))' : 'var(--cream)',
                color: icon === key ? 'var(--on-dark)' : 'var(--text-muted)',
                boxShadow: icon === key ? 'var(--shadow-accent)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.16s var(--ease-flow)',
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
          {TOPIC_COLORS.map((c) => (
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
            <PencilLine size={13} /> Mostly writing
          </button>
          <button
            type="button"
            onClick={() => setContentKind(contentKind === 'code' ? null : 'code')}
            className={`btn btn-sm ${contentKind === 'code' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem' }}
          >
            <Code2 size={13} /> Mostly code
          </button>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          Just a default for the note editor — every resource can still hold any kind of content.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
          {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : topic ? <><Check size={15} /> Save Changes</> : <><Plus size={15} /> Create Course</>}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  )
}
