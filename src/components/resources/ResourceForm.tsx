'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { Resource, Topic } from '@/lib/db/schema'

interface ResourceFormProps {
  resource?: Resource & { topicName?: string | null }
  topics: Topic[]
}

export function ResourceForm({ resource, topics }: ResourceFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTopicId = searchParams.get('topicId') ?? resource?.topicId?.toString() ?? ''

  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState(resource?.url ?? '')
  const [title, setTitle] = useState(resource?.title ?? '')
  const [description, setDescription] = useState(resource?.description ?? '')
  const [topicId, setTopicId] = useState(defaultTopicId)
  const [type, setType] = useState(resource?.type ?? 'article')

  function handleUrlChange(val: string) {
    setUrl(val)
    if (!resource) {
      if (/youtube\.com|youtu\.be/.test(val)) setType('video')
      else if (/\.pdf$/i.test(val)) setType('pdf')
      else if (val.startsWith('http')) setType('article')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const endpoint = resource ? `/api/resources/${resource.id}` : '/api/resources'
      const method = resource ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          url: url || null,
          type,
          topicId: topicId || null,
        }),
      })

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      toast.success(resource ? 'Resource updated' : 'Resource added')
      router.push(`/resources/${data.id}`)
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
        <label className="input-label" htmlFor="url">URL</label>
        <input
          id="url"
          className="hf-input"
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://..."
        />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Paste a YouTube URL, article URL, or leave blank for manual entry.
        </p>
      </div>

      <div className="field">
        <label className="input-label" htmlFor="type">Type</label>
        <select
          id="type"
          className="hf-input"
          value={type}
          onChange={(e) => setType(e.target.value as Resource['type'])}
          style={{ cursor: 'pointer' }}
        >
          <option value="video">🎥 Video</option>
          <option value="pdf">📄 PDF</option>
          <option value="article">📰 Article</option>
          <option value="snippet">💻 Snippet</option>
        </select>
      </div>

      <div className="field">
        <label className="input-label" htmlFor="title">Title *</label>
        <input
          id="title"
          className="hf-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Understanding TypeScript Generics"
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
          placeholder="Brief notes about this resource"
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="field">
        <label className="input-label" htmlFor="topic">Topic</label>
        <select
          id="topic"
          className="hf-input"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="">— No topic —</option>
          {topics.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.icon} {t.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || !title.trim()}>
          {loading ? 'Saving…' : resource ? 'Save Changes' : 'Add Resource'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  )
}
