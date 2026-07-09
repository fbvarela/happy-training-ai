'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { CodeView } from '@/components/snippets/CodeView'
import { StreamingText } from '@/components/ai/StreamingText'

interface Suggestion {
  title: string
  explanation: string
  language: string
  code: string
  addedAsResourceId?: number
}

interface SuggestionRun {
  id: number
  repoId: number
  suggestions: Suggestion[]
  createdAt: string
}

export function RepoSuggestions({ repoId }: { repoId: number }) {
  const [run, setRun] = useState<SuggestionRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [addingIndex, setAddingIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/repo-ai/suggest?repoId=${repoId}`)
      .then((r) => r.json())
      .then((d) => setRun(d))
      .finally(() => setLoadingInitial(false))
  }, [repoId])

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/repo-ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Request failed (${res.status})`)
      }
      setRun(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate suggestions')
    } finally {
      setLoading(false)
    }
  }

  async function addAsResource(suggestion: Suggestion, index: number) {
    setAddingIndex(index)
    try {
      const resourceRes = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.explanation.slice(0, 200),
          type: 'article',
        }),
      })
      if (!resourceRes.ok) throw new Error()
      const resource = await resourceRes.json()

      const explanationRes = await fetch(`/api/resources/${resource.id}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'snippet',
          title: 'Explanation',
          language: 'markdown',
          code: suggestion.explanation,
          order: 0,
        }),
      })
      if (!explanationRes.ok) throw new Error()

      const codeRes = await fetch(`/api/resources/${resource.id}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'snippet',
          title: 'Code Example',
          language: suggestion.language,
          code: suggestion.code,
          order: 1,
        }),
      })
      if (!codeRes.ok) throw new Error()

      setRun((prev) => {
        if (!prev) return prev
        const suggestions = prev.suggestions.map((s, i) => i === index ? { ...s, addedAsResourceId: resource.id } : s)
        return { ...prev, suggestions }
      })
      toast.success(`Added resource: ${suggestion.title}`)
    } catch {
      toast.error('Failed to add resource')
    } finally {
      setAddingIndex(null)
    }
  }

  return (
    <div className="hf-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 className="hf-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Sparkles size={16} />
          Suggested resources
        </h2>
        <button onClick={generate} disabled={loading} className="btn btn-ghost btn-sm">
          {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
          {loading ? 'Analyzing…' : run ? 'Regenerate' : 'Suggest resources'}
        </button>
      </div>

      {loadingInitial ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading…</p>
      ) : !run ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          No suggestions yet. Click &quot;Suggest resources&quot; to analyze this repo&apos;s code and dependencies.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {run.suggestions.map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', background: 'var(--cream)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--bark)' }}>{s.title}</div>
                {s.addedAsResourceId ? (
                  <Link href={`/resources/${s.addedAsResourceId}`} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', flexShrink: 0 }}>
                    <Check size={13} /> View resource
                  </Link>
                ) : (
                  <button
                    onClick={() => addAsResource(s, i)}
                    disabled={addingIndex === i}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', flexShrink: 0 }}
                  >
                    {addingIndex === i ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
                    Add as resource
                  </button>
                )}
              </div>
              <StreamingText text={s.explanation} className="text-sm" />
              <div style={{ marginTop: '10px' }}>
                <CodeView code={s.code} language={s.language} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
