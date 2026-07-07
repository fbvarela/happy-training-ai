'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Suggestion {
  title: string
  why: string
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
      if (!res.ok) throw new Error()
      setRun(await res.json())
    } catch {
      toast.error('Failed to generate suggestions')
    } finally {
      setLoading(false)
    }
  }

  async function addAsTopic(suggestion: Suggestion, index: number) {
    setAddingIndex(index)
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: suggestion.title, description: suggestion.why }),
      })
      if (!res.ok) throw new Error()
      setRun((prev) => {
        if (!prev) return prev
        const suggestions = prev.suggestions.map((s, i) => i === index ? { ...s, addedAsResourceId: -1 } : s)
        return { ...prev, suggestions }
      })
      toast.success(`Added topic: ${suggestion.title}`)
    } catch {
      toast.error('Failed to add topic')
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {run.suggestions.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', background: 'var(--cream)', borderRadius: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--bark)' }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.why}</div>
              </div>
              <button
                onClick={() => addAsTopic(s, i)}
                disabled={!!s.addedAsResourceId || addingIndex === i}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', flexShrink: 0 }}
              >
                {s.addedAsResourceId ? <Check size={13} /> : addingIndex === i ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
                {s.addedAsResourceId ? 'Added' : 'Add as topic'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
