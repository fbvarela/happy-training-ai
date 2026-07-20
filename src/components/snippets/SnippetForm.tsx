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
  const [language, setLanguage] = useState<Language>((snippet?.language as Language) ?? 'markdown')
  const [code, setCode] = useState(snippet?.code ?? '')
  const [previewing, setPreviewing] = useState(false)
  // New notes default to markdown (plain writing) — the language picker is
  // only worth showing up front for existing code notes; everyone else can
  // opt in via "Change format".
  const [formatExpanded, setFormatExpanded] = useState(!!snippet && snippet.language !== 'markdown')

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
      toast.success(snippet ? 'Note updated' : 'Note created')
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
      <div className={formatExpanded ? 'grid grid-cols-[1fr_180px] gap-[14px]' : undefined}>
        <div className="field" style={{ margin: 0 }}>
          <label className="input-label" htmlFor="title">Title *</label>
          <input
            id="title"
            className="hf-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Fetch with retry, or Rose pruning notes"
            required
          />
        </div>
        {formatExpanded ? (
          <div className="field" style={{ margin: 0 }}>
            <label className="input-label" htmlFor="language">Format</label>
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
        ) : (
          <button
            type="button"
            onClick={() => setFormatExpanded(true)}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: '6px', alignSelf: 'flex-start', fontSize: '0.78rem' }}
          >
            Change format
          </button>
        )}
      </div>

      <div className="field" style={{ margin: 0 }}>
        <label className="input-label" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="hf-input"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What's this note about?"
          rows={2}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="field" style={{ margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label className="input-label" style={{ margin: 0 }}>{language === 'markdown' ? 'Content *' : 'Code *'}</label>
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
          {loading ? 'Saving…' : snippet ? 'Save Changes' : 'Create Note'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  )
}
