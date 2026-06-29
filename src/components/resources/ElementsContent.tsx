'use client'

import { useRef, useState } from 'react'
import {
  Plus, Trash2, Pencil, Check, X,
  Video, FileText, Newspaper, Paperclip,
  Upload, Link as LinkIcon, Loader2, ExternalLink, Play,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ResourceElement } from '@/lib/db/schema'
import { TranscriptBlock } from './TranscriptBlock'
import { TranscribeButton } from './TranscribeButton'

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

/* ─── Content display per element type ─── */

function VideoContent({ element }: { element: ResourceElement }) {
  const [playing, setPlaying] = useState(false)
  const ytId = element.url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]

  if (!ytId) {
    return element.url ? (
      <a href={element.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
        <ExternalLink size={13} /> Open video
      </a>
    ) : null
  }

  if (playing) {
    return (
      <div style={{ aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
          allow="autoplay"
          title={element.title ?? 'Video'}
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      style={{
        position: 'relative', display: 'block', width: '100%',
        aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden',
        background: '#000', border: 'none', cursor: 'pointer', padding: 0,
      }}
    >
      <img
        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
        alt={element.title ?? 'Video thumbnail'}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.85 }}
      />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play size={22} fill="white" color="white" style={{ marginLeft: 3 }} />
        </div>
      </div>
    </button>
  )
}

function PdfContent({ element, resourceId }: { element: ResourceElement; resourceId: number }) {
  const href = element.fileUrl ?? element.url ?? '#'
  const isLocal = href.startsWith('/uploads/')
  const name = element.title ?? element.fileUrl?.split('/').pop() ?? 'document.pdf'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '18px 20px',
      background: 'var(--cream)',
      border: '1px solid var(--line)',
      borderRadius: '10px',
    }}>
      <FileText size={28} style={{ color: 'var(--bark)', opacity: 0.5, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bark)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PDF</div>
      </div>
      <a
        href={isLocal ? href : `/resources/${resourceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost btn-sm"
        style={{ flexShrink: 0 }}
      >
        <ExternalLink size={13} /> Open
      </a>
    </div>
  )
}

function ArticleContent({ element }: { element: ResourceElement }) {
  const url = element.url ?? ''
  let domain = ''
  try { domain = new URL(url).hostname.replace('www.', '') } catch { /* ignore */ }

  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--cream)',
      border: '1px solid var(--line)',
      borderRadius: '10px',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <Newspaper size={22} style={{ color: 'var(--bark)', opacity: 0.45, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{domain}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
          <ExternalLink size={13} /> Open
        </a>
      )}
    </div>
  )
}

function FileContent({ element }: { element: ResourceElement }) {
  const href = element.fileUrl ?? element.url ?? '#'
  const name = element.title ?? href.split('/').pop() ?? 'file'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px',
      background: 'var(--cream)',
      border: '1px solid var(--line)',
      borderRadius: '10px',
    }}>
      <Paperclip size={20} style={{ color: 'var(--bark)', opacity: 0.45, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
        <ExternalLink size={13} /> Open
      </a>
    </div>
  )
}

/* ─── Element card (view + edit) ─── */

function ElementCard({
  element,
  resourceId,
  onUpdate,
  onDelete,
}: {
  element: ResourceElement
  resourceId: number
  onUpdate: (el: ResourceElement) => void
  onDelete: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState(element.type)
  const [url, setUrl] = useState(element.url ?? '')
  const [title, setTitle] = useState(element.title ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
      onUpdate(await res.json())
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

  return (
    <div style={{
      border: '1.5px solid var(--line)',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px',
        borderBottom: editing ? '1.5px solid var(--bark)' : '1px solid var(--line)',
        background: editing ? 'var(--bark-bg)' : 'var(--cream)',
      }}>
        <TypeIcon size={14} style={{ color: editing ? '#fff' : 'var(--bark)', opacity: editing ? 0.8 : 0.6, flexShrink: 0 }} />
        <span style={{
          flex: 1, fontSize: '0.875rem', fontWeight: 600,
          color: editing ? '#fff' : 'var(--bark)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {element.title ?? element.url ?? element.fileUrl ?? element.type}
        </span>

        {confirmDelete ? (
          <>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
              <X size={12} />
            </button>
            <button onClick={remove} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
              <Check size={12} /> Remove
            </button>
          </>
        ) : editing ? (
          <>
            <button onClick={() => { setEditing(false); setUrl(element.url ?? ''); setTitle(element.title ?? ''); setType(element.type) }}
              className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              <X size={12} /> Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn btn-sun btn-sm" style={{ padding: '3px 8px' }}>
              <Check size={12} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm" style={{ padding: '3px 8px' }} title="Edit">
              <Pencil size={12} />
            </button>
            <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '3px 8px' }} title="Delete">
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>

      {/* Edit form or content */}
      {editing ? (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="hf-input"
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ width: '120px', flexShrink: 0, padding: '6px 8px', fontSize: '0.82rem' }}
            >
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
            placeholder="Label (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
          />
          {element.fileUrl && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Uploaded file: {element.fileUrl.split('/').pop()}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {element.type === 'video' && <VideoContent element={element} />}
          {element.type === 'pdf' && <PdfContent element={element} resourceId={resourceId} />}
          {element.type === 'article' && <ArticleContent element={element} />}
          {element.type === 'file' && <FileContent element={element} />}

          {/* Transcription controls for video */}
          {element.type === 'video' && element.id > 0 && (
            <div>
              <TranscribeButton resourceId={element.id} status={element.transcriptStatus} isElement />
            </div>
          )}

          {/* Transcript (collapsed by default) */}
          {element.transcript && (
            <TranscriptBlock
              transcript={element.transcript}
              elementId={element.id}
              inline
            />
          )}
        </div>
      )}
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
  onSaved: (el: ResourceElement) => void
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
      const res = await fetch('/api/elements/upload', { method: 'POST', body: fd })
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
      onSaved(await res.json())
      toast.success('Added')
    } catch {
      toast.error('Failed to add')
      setSaving(false)
    }
  }

  const canSave = mode === 'url' ? !!url.trim() : !!uploadedFileUrl

  return (
    <div style={{
      border: '1.5px dashed var(--sun)',
      borderRadius: '12px',
      padding: '14px',
      background: 'var(--cream)',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
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
            <input className="hf-input" placeholder="Label (optional)" value={title} autoFocus onChange={e => setTitle(e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }} />
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select className="hf-input" value={type} onChange={e => setType(e.target.value)} style={{ width: '110px', flexShrink: 0, padding: '6px 8px', fontSize: '0.82rem' }}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              className="hf-input"
              type="url"
              placeholder="Paste a URL…"
              value={url}
              autoFocus
              onChange={e => { setUrl(e.target.value); if (e.target.value) setType(detectType(e.target.value)) }}
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
            />
          </div>
          <input className="hf-input" placeholder="Label (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.82rem' }} />
        </>
      )}

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm"><X size={13} /> Cancel</button>
        <button onClick={save} disabled={saving || uploading || !canSave} className="btn btn-primary btn-sm">
          <Check size={13} /> {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

/* ─── Main export ─── */

interface Props {
  resourceId: number
  initialElements: ResourceElement[]
}

export function ElementsContent({ resourceId, initialElements }: Props) {
  const [elements, setElements] = useState<ResourceElement[]>(initialElements)
  const [adding, setAdding] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {elements.map(el => (
        <ElementCard
          key={el.id}
          element={el}
          resourceId={resourceId}
          onUpdate={updated => setElements(prev => prev.map(e => e.id === updated.id ? updated : e))}
          onDelete={id => setElements(prev => prev.filter(e => e.id !== id))}
        />
      ))}

      {elements.length === 0 && !adding && (
        <div style={{
          textAlign: 'center', padding: '40px 24px',
          border: '1.5px dashed var(--line)', borderRadius: '12px',
          color: 'var(--text-muted)', fontSize: '0.9rem',
        }}>
          No content yet. Add a file or URL to get started.
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
        <button
          onClick={() => setAdding(true)}
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-start', marginTop: '4px' }}
        >
          <Plus size={14} /> Add content
        </button>
      )}
    </div>
  )
}
