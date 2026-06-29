'use client'

import { useState } from 'react'
import { Plus, Trash2, Video, FileText, Newspaper, Paperclip, GripVertical } from 'lucide-react'
import type { ResourceElement } from '@/lib/db/schema'

const TYPE_OPTIONS = [
  { value: 'video',   label: 'Video',   icon: Video },
  { value: 'pdf',     label: 'PDF',     icon: FileText },
  { value: 'article', label: 'Article', icon: Newspaper },
  { value: 'file',    label: 'File',    icon: Paperclip },
]

function typeIcon(type: string) {
  const opt = TYPE_OPTIONS.find(o => o.value === type)
  const Icon = opt?.icon ?? Paperclip
  return <Icon size={15} style={{ flexShrink: 0, opacity: 0.6 }} />
}

function detectType(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return 'video'
  if (/\.pdf$/i.test(url)) return 'pdf'
  if (url.startsWith('http')) return 'article'
  return 'file'
}

interface DraftElement {
  localId: string
  type: string
  url: string
  title: string
  saved: boolean
  id?: number
}

interface Props {
  resourceId: number
  initialElements: ResourceElement[]
}

export function ElementsEditor({ resourceId, initialElements }: Props) {
  const [elements, setElements] = useState<DraftElement[]>(
    initialElements.map(e => ({
      localId: String(e.id),
      id: e.id,
      type: e.type,
      url: e.url ?? '',
      title: e.title ?? '',
      saved: true,
    }))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  function addBlank() {
    setElements(prev => [...prev, {
      localId: `new-${Date.now()}`,
      type: 'video',
      url: '',
      title: '',
      saved: false,
    }])
  }

  function update(localId: string, patch: Partial<DraftElement>) {
    setElements(prev => prev.map(e => e.localId === localId ? { ...e, ...patch } : e))
  }

  function handleUrlChange(localId: string, url: string) {
    const autoType = url ? detectType(url) : undefined
    update(localId, { url, ...(autoType ? { type: autoType } : {}) })
  }

  async function save(el: DraftElement) {
    if (!el.url.trim()) return
    setSaving(s => ({ ...s, [el.localId]: true }))
    try {
      if (el.id) {
        await fetch(`/api/resources/${resourceId}/elements/${el.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: el.url, title: el.title, type: el.type }),
        })
        update(el.localId, { saved: true })
      } else {
        const res = await fetch(`/api/resources/${resourceId}/elements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: el.url,
            title: el.title,
            type: el.type,
            order: elements.indexOf(el),
          }),
        })
        const data = await res.json()
        update(el.localId, { saved: true, id: data.id })
      }
    } finally {
      setSaving(s => ({ ...s, [el.localId]: false }))
    }
  }

  async function remove(el: DraftElement) {
    if (el.id) {
      await fetch(`/api/resources/${resourceId}/elements/${el.id}`, { method: 'DELETE' })
    }
    setElements(prev => prev.filter(e => e.localId !== el.localId))
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {elements.map((el) => (
          <div key={el.localId} style={{
            display: 'grid',
            gridTemplateColumns: '20px 120px 1fr auto auto',
            gap: '8px',
            alignItems: 'center',
            background: 'var(--cream)',
            border: `1.5px solid ${el.saved ? 'var(--line)' : 'var(--sun)'}`,
            borderRadius: '10px',
            padding: '10px 12px',
          }}>
            <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab' }} />

            <select
              className="hf-input"
              value={el.type}
              onChange={e => update(el.localId, { type: e.target.value, saved: false })}
              style={{ padding: '5px 8px', fontSize: '0.82rem' }}
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
              <input
                className="hf-input"
                type="url"
                placeholder="URL (YouTube, PDF link, article…)"
                value={el.url}
                onChange={e => handleUrlChange(el.localId, e.target.value)}
                onBlur={() => { if (!el.saved && el.url) save(el) }}
                style={{ padding: '5px 10px', fontSize: '0.85rem' }}
              />
              <input
                className="hf-input"
                placeholder="Label (optional)"
                value={el.title}
                onChange={e => update(el.localId, { title: e.target.value, saved: false })}
                onBlur={() => { if (!el.saved && el.url) save(el) }}
                style={{ padding: '5px 10px', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {typeIcon(el.type)}
              {!el.saved && (
                <span style={{ fontSize: '0.7rem', color: 'var(--sun)', fontWeight: 600 }}>●</span>
              )}
            </div>

            <button
              onClick={() => remove(el)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '4px',
                borderRadius: '6px', display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#d94f3d')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              aria-label="Remove element"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addBlank} className="btn btn-ghost btn-sm" style={{ marginTop: '10px' }}>
        <Plus size={14} />
        Add element
      </button>
    </div>
  )
}
