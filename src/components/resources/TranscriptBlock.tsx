'use client'

import { useState } from 'react'
import { Pencil, Check, X, WandSparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  transcript: string
  resourceId?: number
  elementId?: number
  inline?: boolean
}

export function TranscriptBlock({ transcript: initial, resourceId, elementId, inline }: Props) {
  const [transcript, setTranscript] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [confirmRewrite, setConfirmRewrite] = useState(false)

  const patchEndpoint = elementId ? `/api/elements/${elementId}` : `/api/resources/${resourceId}`
  const rewriteEndpoint = elementId ? `/api/elements/${elementId}/rewrite` : `/api/resources/${resourceId}/rewrite`

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(patchEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: draft }),
      })
      if (!res.ok) throw new Error()
      setTranscript(draft)
      setEditing(false)
      toast.success('Transcript saved')
    } catch {
      toast.error('Failed to save transcript')
    } finally {
      setSaving(false)
    }
  }

  async function doRewrite() {
    setConfirmRewrite(false)
    setRewriting(true)
    const toastId = toast.loading('Rewriting transcript… this may take a minute')
    try {
      const res = await fetch(rewriteEndpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Rewrite failed')
      setTranscript(data.transcript)
      setDraft(data.transcript)
      toast.success('Transcript rewritten!', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rewrite failed', { id: toastId })
    } finally {
      setRewriting(false)
    }
  }

  return (
    <div className={inline ? undefined : 'reader-transcript-section'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div className="reader-transcript-label">Transcript</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Rewrite confirm inline */}
          {confirmRewrite && !editing && (
            <>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Replace with AI rewrite?</span>
              <button onClick={() => setConfirmRewrite(false)} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                <X size={12} /> Cancel
              </button>
              <button onClick={doRewrite} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }}>
                <Check size={12} /> Rewrite
              </button>
            </>
          )}

          {!editing && !confirmRewrite && (
            <>
              <button
                onClick={() => setConfirmRewrite(true)}
                disabled={rewriting}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem' }}
                title="Rewrite for readability using AI"
              >
                {rewriting
                  ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  : <WandSparkles size={12} />}
                Rewrite
              </button>
              <button
                onClick={() => { setDraft(transcript); setEditing(true) }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                <Pencil size={12} /> Edit
              </button>
            </>
          )}

          {editing && (
            <>
              <button onClick={() => { setEditing(false); setDraft(transcript) }} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                <X size={12} /> Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }}>
                <Check size={12} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="hf-input"
          style={{ width: '100%', minHeight: '480px', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.75, resize: 'vertical', boxSizing: 'border-box' }}
          autoFocus
        />
      ) : (
        transcript.split('\n\n').filter(Boolean).map((para, i) => {
          const isHeading = para === para.toUpperCase() && para.length < 80 && /^[A-Z\s,:-]+$/.test(para)
          return isHeading
            ? <h3 key={i} style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', margin: '1.6em 0 0.5em' }}>{para}</h3>
            : <p key={i} style={{ margin: '0 0 1.2em', textAlign: 'justify', hyphens: 'auto' }}>{para}</p>
        })
      )}
    </div>
  )
}
