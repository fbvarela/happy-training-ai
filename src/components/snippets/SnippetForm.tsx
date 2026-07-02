'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CodeEditor } from './CodeEditor'
import { MarkdownPreview } from '@/components/markdown/MarkdownPreview'
import { LANGUAGES, type Language } from '@/lib/snippets/languages'
import type { Snippet } from '@/lib/db/schema'

interface SnippetFormProps {
  snippet?: Snippet
}

export function SnippetForm({ snippet }: SnippetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(snippet?.title ?? '')
  const [description, setDescription] = useState(snippet?.description ?? '')
  const [language, setLanguage] = useState<Language>((snippet?.language as Language) ?? 'typescript')
  const [code, setCode] = useState(snippet?.code ?? '')
  const [previewing, setPreviewing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !code.trim()) return

    setLoading(true)
    try {
      const url = snippet ? `/api/snippets/${snippet.id}` : '/api/snippets'
      const method = snippet ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, language, code }),
      })

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      toast.success(snippet ? 'Snippet updated' : 'Snippet created')
      router.push(`/snippets/${data.id}`)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '14px' }}>
        <div className="field" style={{ margin: 0 }}>
          <label className="input-label" htmlFor="title">Title *</label>
          <input
            id="title"
            className="hf-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Fetch with retry"
            required
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label className="input-label" htmlFor="language">Language</label>
          <select
            id="language"
            className="hf-input"
            value={language}
            onChange={e => setLanguage(e.target.value as Language)}
            style={{ cursor: 'pointer' }}
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="field" style={{ margin: 0 }}>
        <label className="input-label" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="hf-input"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does this snippet do?"
          rows={2}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="field" style={{ margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label className="input-label" style={{ margin: 0 }}>Code *</label>
          {language === 'markdown' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setPreviewing(false)} className={`btn btn-sm ${!previewing ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.75rem' }}>
                Source
              </button>
              <button type="button" onClick={() => setPreviewing(true)} className={`btn btn-sm ${previewing ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.75rem' }}>
                Preview
              </button>
            </div>
          )}
        </div>
        {language === 'markdown' && previewing ? (
          <MarkdownPreview content={code} />
        ) : (
          <CodeEditor value={code} onChange={setCode} language={language} />
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" disabled={loading || !title.trim() || !code.trim()} className="btn btn-primary">
          {loading ? 'Saving…' : snippet ? 'Save Changes' : 'Create Snippet'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  )
}
