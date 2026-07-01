'use client'

import { useEffect, useRef, useState } from 'react'
import { Pencil, Check, X, WandSparkles, Loader2, ChevronDown, ChevronUp, Bold, Italic } from 'lucide-react'
import { toast } from 'sonner'
import DOMPurify from 'dompurify'

interface Props {
  transcript: string | null
  resourceId?: number
  elementId?: number
  inline?: boolean
}

const ALLOWED_TAGS = ['p', 'br', 'div', 'h3', 'strong', 'b', 'em', 'i', 'span']
const ALLOWED_ATTR = ['style']
const HTML_TAG_RE = /<(p|div|h3|strong|b|em|i|span|br)\b/i

const FONT_SIZES: Record<string, string> = {
  small: '0.8rem',
  normal: '',
  large: '1.15rem',
  huge: '1.5rem',
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function plainToHtml(text: string) {
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((para) => {
      const isHeading = para === para.toUpperCase() && para.length < 80 && /^[A-Z\s,:-]+$/.test(para)
      const tag = isHeading ? 'h3' : 'p'
      return `<${tag}>${escapeHtml(para)}</${tag}>`
    })
    .join('')
}

function sanitize(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

export function TranscriptBlock({ transcript: initial, resourceId, elementId, inline }: Props) {
  const [transcript, setTranscript] = useState(initial ?? '')
  const [collapsed, setCollapsed] = useState(!!initial)
  const [editing, setEditing] = useState(!initial)
  const [saving, setSaving] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [confirmRewrite, setConfirmRewrite] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const patchEndpoint = elementId ? `/api/elements/${elementId}` : `/api/resources/${resourceId}`
  const rewriteEndpoint = elementId ? `/api/elements/${elementId}/rewrite` : `/api/resources/${resourceId}/rewrite`

  useEffect(() => {
    if (editing && editorRef.current) {
      const source = transcript
      editorRef.current.innerHTML = HTML_TAG_RE.test(source) ? sanitize(source) : plainToHtml(source)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  function exec(command: 'bold' | 'italic') {
    editorRef.current?.focus()
    document.execCommand(command)
  }

  function applyFontSize(size: keyof typeof FONT_SIZES) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !editorRef.current) return
    const range = sel.getRangeAt(0)
    if (!editorRef.current.contains(range.commonAncestorContainer)) return

    const span = document.createElement('span')
    if (FONT_SIZES[size]) span.style.fontSize = FONT_SIZES[size]

    try {
      range.surroundContents(span)
    } catch {
      const contents = range.extractContents()
      span.appendChild(contents)
      range.insertNode(span)
    }
    sel.removeAllRanges()
  }

  async function save() {
    const html = sanitize(editorRef.current?.innerHTML ?? '')
    const plain = editorRef.current?.textContent?.trim() ?? ''
    if (!plain) { toast.error('Transcript is empty'); return }
    setSaving(true)
    try {
      const res = await fetch(patchEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: html }),
      })
      if (!res.ok) throw new Error()
      setTranscript(html)
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
      toast.success('Transcript rewritten!', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rewrite failed', { id: toastId })
    } finally {
      setRewriting(false)
    }
  }

  return (
    <div className={inline ? undefined : 'reader-transcript-section'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: collapsed ? 0 : '12px', flexWrap: 'wrap', gap: '8px' }}>
        <button
          onClick={() => { setCollapsed(c => !c); if (editing) setEditing(false) }}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)', padding: '4px 0', gap: '5px' }}
        >
          {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          Transcript
        </button>

        {!collapsed && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>

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

            {!editing && !confirmRewrite && transcript && (
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
                  onClick={() => setEditing(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Pencil size={12} /> Edit
                </button>
              </>
            )}

            {!editing && !confirmRewrite && !transcript && (
              <button
                onClick={() => setEditing(true)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                <Pencil size={12} /> Add transcript
              </button>
            )}

            {editing && (
              <>
                <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                  <X size={12} /> Cancel
                </button>
                <button onClick={save} disabled={saving} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }}>
                  <Check size={12} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        editing ? (
          <div>
            <div className="tb-toolbar" style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="tb-toolbar-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('bold')}
                title="Bold"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                className="tb-toolbar-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('italic')}
                title="Italic"
              >
                <Italic size={14} />
              </button>
              <div className="tb-toolbar-sep" />
              <select
                className="tb-size-select"
                defaultValue=""
                onMouseDown={(e) => e.preventDefault()}
                onChange={(e) => {
                  const value = e.target.value as keyof typeof FONT_SIZES
                  if (value) applyFontSize(value)
                  e.target.value = ''
                }}
                title="Text size"
              >
                <option value="" disabled>Size</option>
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
                <option value="huge">Huge</option>
              </select>
            </div>
            <div
              ref={editorRef}
              className="tb-content tb-editor hf-input"
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Paste a transcript here…"
              autoFocus
            />
          </div>
        ) : transcript ? (
          HTML_TAG_RE.test(transcript) ? (
            <div className="tb-content" dangerouslySetInnerHTML={{ __html: sanitize(transcript) }} />
          ) : (
            <div className="tb-content">
              {transcript.split('\n\n').filter(Boolean).map((para, i) => {
                const isHeading = para === para.toUpperCase() && para.length < 80 && /^[A-Z\s,:-]+$/.test(para)
                return isHeading
                  ? <h3 key={i}>{para}</h3>
                  : <p key={i}>{para}</p>
              })}
            </div>
          )
        ) : (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No transcript yet.
          </p>
        )
      )}
    </div>
  )
}
