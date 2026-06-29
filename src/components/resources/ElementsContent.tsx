'use client'

import { useRef, useState } from 'react'
import {
  Plus, Trash2, Pencil, Check, X,
  Video, FileText, Newspaper, Paperclip,
  Upload, Link as LinkIcon, Loader2, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ResourceElement } from '@/lib/db/schema'
import { TranscriptBlock } from './TranscriptBlock'
import { TranscribeButton } from './TranscribeButton'

export type ElementWithContent = ResourceElement & { extractedHtml?: string | null }

const TYPE_OPTIONS = [
  { value: 'video',   label: 'Video',   Icon: Video },
  { value: 'pdf',     label: 'PDF',     Icon: FileText },
  { value: 'article', label: 'Article', Icon: Newspaper },
  { value: 'file',    label: 'File',    Icon: Paperclip },
]

function detectType(url: string) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'video'
  if (/\.pdf$/i.test(url)) return 'pdf'
  if (url.startsWith('http')) return 'article'
  return 'file'
}

function typeFromExt(ext: string) {
  if (ext === '.pdf') return 'pdf'
  if (['.mp4', '.mov', '.webm', '.mkv', '.avi'].includes(ext)) return 'video'
  return 'file'
}

/* ─── Full inline content renderers ─── */

function VideoEmbed({ element }: { element: ElementWithContent }) {
  const ytId = element.url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]
  if (ytId) {
    return (
      <div style={{ aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
          loading="lazy"
          title={element.title ?? 'Video'}
        />
      </div>
    )
  }
  const src = element.fileUrl ?? element.url
  if (!src) return null
  return (
    <video controls style={{ width: '100%', borderRadius: '10px', background: '#000' }}>
      <source src={src} />
    </video>
  )
}

function PdfEmbed({ element }: { element: ElementWithContent }) {
  const src = element.fileUrl ?? element.url
  if (!src) return null
  return (
    <iframe
      src={src}
      style={{ width: '100%', height: '720px', border: '1px solid var(--line)', borderRadius: '10px' }}
      title={element.title ?? 'PDF'}
    />
  )
}

function ArticleContent({ element }: { element: ElementWithContent }) {
  if (element.extractedHtml) {
    return <div className="reader-body" dangerouslySetInnerHTML={{ __html: element.extractedHtml }} />
  }
  return (
    <div style={{ padding: '24px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
      <p style={{ margin: '0 0 12px' }}>Could not extract article content.</p>
      {element.url && (
        <a href={element.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
          <ExternalLink size={13} /> Open in browser
        </a>
      )}
    </div>
  )
}

function FileContent({ element }: { element: ElementWithContent }) {
  const href = element.fileUrl ?? element.url ?? '#'
  const name = element.title ?? href.split('/').pop() ?? 'file'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '18px 20px', background: 'var(--cream)',
      border: '1px solid var(--line)', borderRadius: '10px',
    }}>
      <Paperclip size={22} style={{ color: 'var(--bark)', opacity: 0.45, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
        <ExternalLink size={13} /> Open
      </a>
    </div>
  )
}

/* ─── Element section (full content + inline edit) ─── */

function ElementSection({
  element,
  resourceId,
  index,
  total,
  onUpdate,
  onDelete,
}: {
  element: ElementWithContent
  resourceId: number
  index: number
  total: number
  onUpdate: (el: ElementWithContent) => void
  onDelete: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState(element.type)
  const [url, setUrl] = useState(element.url ?? '')
  const [title, setTitle] = useState(element.title ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pdfVisible, setPdfVisible] = useState(false)

  const TypeIcon = TYPE_OPTIONS.find(o => o.value === element.type)?.Icon ?? Paperclip

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/resources/${resourceId}/elements/${element.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() || null, title: title.trim() || null, type }),
      })
      if (!res.ok) throw new Error()
      onUpdate({ ...await res.json(), extractedHtml: element.extractedHtml })
      setEditing(false)
      toast.success('Saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setConfirmDelete(false)
    setDeleting(true)
    try {
      await fetch(`/api/resources/${resourceId}/elements/${element.id}`, { method: 'DELETE' })
      onDelete(element.id)
      toast.success('Removed')
    } catch {
      toast.error('Failed to remove')
      setDeleting(false)
    }
  }

  const displayTitle = element.title
    || (element.type === 'video' ? 'Video' : element.type === 'pdf' ? 'PDF' : element.type === 'article' ? 'Article' : 'File')

  return (
    <div>
      {index > 0 && (
        <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 32px' }} />
      )}

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <TypeIcon size={15} style={{ color: 'var(--bark)', opacity: 0.55, flexShrink: 0 }} />
        {editing ? (
          <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Editing…</span>
        ) : (
          <h2 style={{
            flex: 1, margin: 0, fontSize: '1.05rem', fontWeight: 700,
            fontFamily: '"Fraunces", serif', color: 'var(--bark)',
          }}>
            {displayTitle}
          </h2>
        )}

        {confirmDelete ? (
          <>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
              <X size={12} /> No
            </button>
            <button onClick={remove} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <Check size={12} /> Remove
            </button>
          </>
        ) : editing ? (
          <>
            <button onClick={() => { setEditing(false); setUrl(element.url ?? ''); setTitle(element.title ?? ''); setType(element.type) }}
              className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
              <X size={12} /> Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }}>
              <Check size={12} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Edit">
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} title="Remove">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '14px', background: 'var(--cream)', border: '1.5px solid var(--line)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select className="hf-input" value={type} onChange={e => setType(e.target.value)} style={{ width: '120px', flexShrink: 0, padding: '6px 8px', fontSize: '0.82rem' }}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              className="hf-input"
              type="url"
              placeholder="URL"
              value={url}
              autoFocus
              onChange={e => { setUrl(e.target.value); if (e.target.value) setType(detectType(e.target.value)) }}
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
            />
          </div>
          <input
            className="hf-input"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
          />
          {element.fileUrl && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              File: {element.fileUrl.split('/').pop()}
            </div>
          )}
        </div>
      )}

      {/* Full inline content */}
      {element.type === 'video' && <VideoEmbed element={element} />}
      {element.type === 'pdf' && (
        <>
          <button
            onClick={() => setPdfVisible(v => !v)}
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: 'flex-start', fontSize: '0.78rem', marginBottom: pdfVisible ? '10px' : 0 }}
          >
            {pdfVisible ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {pdfVisible ? 'Hide PDF' : 'Show PDF'}
          </button>
          {pdfVisible && <PdfEmbed element={element} />}
        </>
      )}
      {element.type === 'article' && <ArticleContent element={element} />}
      {element.type === 'file' && <FileContent element={element} />}

      {/* Transcribe + transcript */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {element.type === 'video' && element.id > 0 && (
          <div>
            <TranscribeButton resourceId={element.id} status={element.transcriptStatus} isElement />
          </div>
        )}
        {element.transcript && (
          <TranscriptBlock transcript={element.transcript} elementId={element.id} inline />
        )}
      </div>
    </div>
  )
}

/* ─── Add element form ─── */

function AddForm({
  resourceId,
  order,
  onSaved,
  onCancel,
}: {
  resourceId: number
  order: number
  onSaved: (el: ElementWithContent) => void
  onCancel: () => void
}) {
  const [mode, setMode] = useState<'file' | 'url'>('file')
  const [type, setType] = useState('pdf')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/resources/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      setUploadedFileUrl(data.fileUrl)
      setUploadedFileName(file.name)
      setType(typeFromExt(ext))
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (mode === 'url' && !url.trim()) { toast.error('URL is required'); return }
    if (mode === 'file' && !uploadedFileUrl) { toast.error('Please select a file'); return }
    setSaving(true)
    try {
      const body = mode === 'url'
        ? { url: url.trim(), title: title.trim() || null, type, order }
        : { fileUrl: uploadedFileUrl, title: title.trim() || null, type, order }
      const res = await fetch(`/api/resources/${resourceId}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      onSaved({ ...await res.json(), extractedHtml: null })
      toast.success('Added')
    } catch {
      toast.error('Failed to add')
      setSaving(false)
    }
  }

  const canSave = mode === 'url' ? !!url.trim() : !!uploadedFileUrl

  return (
    <div>
      <hr style={{ border: 'none', borderTop: '1.5px dashed var(--sun)', margin: '0 0 20px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setMode('file')} className={`btn btn-sm ${mode === 'file' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.78rem' }}>
            <Upload size={12} /> Upload file
          </button>
          <button onClick={() => setMode('url')} className={`btn btn-sm ${mode === 'url' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.78rem' }}>
            <LinkIcon size={12} /> Paste URL
          </button>
        </div>

        {mode === 'file' ? (
          <>
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {uploadedFileUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Check size={14} style={{ color: 'var(--leaf)', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFileName}</span>
                <button onClick={() => { setUploadedFileUrl(null); setUploadedFileName(null) }} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}><X size={12} /></button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'center', border: '1px dashed var(--line)', borderRadius: '8px', padding: '14px', fontSize: '0.85rem' }}
              >
                {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</> : <><Upload size={14} /> Choose file</>}
              </button>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="hf-input" value={type} onChange={e => setType(e.target.value)} style={{ width: '110px', flexShrink: 0, padding: '6px 8px', fontSize: '0.82rem' }}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input className="hf-input" placeholder="Title (optional)" value={title} autoFocus onChange={e => setTitle(e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="hf-input" value={type} onChange={e => setType(e.target.value)} style={{ width: '110px', flexShrink: 0, padding: '6px 8px', fontSize: '0.82rem' }}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input
                className="hf-input" type="url" placeholder="Paste a URL…" value={url} autoFocus
                onChange={e => { setUrl(e.target.value); if (e.target.value) setType(detectType(e.target.value)) }}
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>
            <input className="hf-input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.82rem' }} />
          </>
        )}

        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-ghost btn-sm"><X size={13} /> Cancel</button>
          <button onClick={save} disabled={saving || uploading || !canSave} className="btn btn-primary btn-sm">
            <Check size={13} /> {saving ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main export ─── */

interface Props {
  resourceId: number
  initialElements: ElementWithContent[]
}

export function ElementsContent({ resourceId, initialElements }: Props) {
  const [elements, setElements] = useState<ElementWithContent[]>(initialElements)
  const [adding, setAdding] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {elements.map((el, i) => (
        <ElementSection
          key={el.id}
          element={el}
          resourceId={resourceId}
          index={i}
          total={elements.length}
          onUpdate={updated => setElements(prev => prev.map(e => e.id === updated.id ? updated : e))}
          onDelete={id => setElements(prev => prev.filter(e => e.id !== id))}
        />
      ))}

      {elements.length === 0 && !adding && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          border: '1.5px dashed var(--line)', borderRadius: '12px',
          color: 'var(--text-muted)',
        }}>
          No content yet. Add a file or paste a URL to get started.
        </div>
      )}

      {adding ? (
        <AddForm
          resourceId={resourceId}
          order={elements.length}
          onSaved={el => { setElements(prev => [...prev, el]); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button onClick={() => setAdding(true)} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          <Plus size={14} /> Add content
        </button>
      )}
    </div>
  )
}
