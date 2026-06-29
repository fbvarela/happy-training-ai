'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Video, FileText, Newspaper, Paperclip, BookOpen, Upload, Link as LinkIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { ResourceElement } from '@/lib/db/schema'

const TYPE_OPTIONS = [
  { value: 'video',   label: 'Video',   Icon: Video },
  { value: 'pdf',     label: 'PDF',     Icon: FileText },
  { value: 'article', label: 'Article', Icon: Newspaper },
  { value: 'file',    label: 'File',    Icon: Paperclip },
]

function detectType(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return 'video'
  if (/\.pdf$/i.test(url)) return 'pdf'
  if (url.startsWith('http')) return 'article'
  return 'file'
}

/* ─── Saved element row (read + edit mode) ─── */
function SavedRow({
  element,
  resourceId,
  onUpdate,
  onDelete,
}: {
  element: ResourceElement
  resourceId: number
  onUpdate: (updated: ResourceElement) => void
  onDelete: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState(element.type)
  const [url, setUrl] = useState(element.url ?? '')
  const [title, setTitle] = useState(element.title ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const TypeIcon = TYPE_OPTIONS.find(o => o.value === type)?.Icon ?? Paperclip
  const displayUrl = element.url ?? element.fileUrl ?? '—'
  const readHref = element.type === 'pdf' && element.fileUrl
    ? element.fileUrl
    : `/resources/${resourceId}/read`

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/resources/${resourceId}/elements/${element.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() || null, title: title.trim() || null, type }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onUpdate(updated)
      setEditing(false)
      toast.success('Element saved')
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
      toast.success('Element removed')
    } catch {
      toast.error('Failed to remove')
      setDeleting(false)
    }
  }

  if (!editing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px',
        background: 'var(--cream)',
        border: '1.5px solid var(--line)',
        borderRadius: '10px',
      }}>
        <TypeIcon size={16} style={{ color: 'var(--bark)', flexShrink: 0, opacity: 0.65 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {element.title && (
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--bark)', marginBottom: '2px' }}>
              {element.title}
            </div>
          )}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayUrl}
          </div>
        </div>
        <span className="hf-badge" style={{ fontSize: '0.72rem' }}>{element.type}</span>
        {confirmDelete ? (
          <>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
              <X size={13} />
            </button>
            <button onClick={remove} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <Check size={13} /> Remove
            </button>
          </>
        ) : (
          <>
            <Link
              href={readHref}
              target={element.type === 'pdf' && element.fileUrl ? '_blank' : undefined}
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 8px' }}
              title="Read / Open"
            >
              <BookOpen size={13} />
            </Link>
            <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Edit">
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} title="Delete">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{
      padding: '14px',
      background: 'var(--cream)',
      border: '1.5px solid var(--bark)',
      borderRadius: '10px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
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
          onChange={e => { setUrl(e.target.value); if (e.target.value) setType(detectType(e.target.value)) }}
          style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
        />
      </div>
      <input
        className="hf-input"
        placeholder="Label (optional, e.g. 'Lecture slides')"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ padding: '6px 10px', fontSize: '0.82rem' }}
      />
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button onClick={() => { setEditing(false); setUrl(element.url ?? ''); setTitle(element.title ?? ''); setType(element.type) }} className="btn btn-ghost btn-sm">
          <X size={13} /> Cancel
        </button>
        <button onClick={save} disabled={saving || !url.trim()} className="btn btn-primary btn-sm">
          <Check size={13} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

/* ─── New (unsaved) element row ─── */
function NewRow({
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
      setUploadedFileUrl(data.fileUrl)
      setUploadedFileName(file.name)
      setType(data.type)
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
      const el = await res.json()
      onSaved(el)
      toast.success('Element added')
    } catch {
      toast.error('Failed to add element')
      setSaving(false)
    }
  }

  const canSave = mode === 'url' ? !!url.trim() : !!uploadedFileUrl

  return (
    <div style={{
      padding: '14px',
      background: 'var(--cream)',
      border: '1.5px dashed var(--sun)',
      borderRadius: '10px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => setMode('file')}
          className={`btn btn-sm ${mode === 'file' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.78rem' }}
        >
          <Upload size={12} /> Upload file
        </button>
        <button
          onClick={() => setMode('url')}
          className={`btn btn-sm ${mode === 'url' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.78rem' }}
        >
          <LinkIcon size={12} /> Paste URL
        </button>
      </div>

      {mode === 'file' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          {uploadedFileUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <Check size={14} style={{ color: 'var(--leaf)' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--bark)' }}>
                {uploadedFileName}
              </span>
              <button onClick={() => { setUploadedFileUrl(null); setUploadedFileName(null) }} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'center', border: '1px dashed var(--line)', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}
            >
              {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</> : <><Upload size={14} /> Choose file</>}
            </button>
          )}
          <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
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
              placeholder="Label (optional)"
              value={title}
              autoFocus
              onChange={e => setTitle(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }}
            />
          </div>
        </div>
      ) : (
        <>
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
              placeholder="Paste a URL…"
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
        </>
      )}

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">
          <X size={13} /> Cancel
        </button>
        <button onClick={save} disabled={saving || uploading || !canSave} className="btn btn-primary btn-sm">
          <Check size={13} /> {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

/* ─── Main editor ─── */
interface Props {
  resourceId: number
  initialElements: ResourceElement[]
}

export function ElementsEditor({ resourceId, initialElements }: Props) {
  const [elements, setElements] = useState<ResourceElement[]>(initialElements)
  const [addingNew, setAddingNew] = useState(false)

  function handleUpdate(updated: ResourceElement) {
    setElements(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  function handleDelete(id: number) {
    setElements(prev => prev.filter(e => e.id !== id))
  }

  function handleSaved(el: ResourceElement) {
    setElements(prev => [...prev, el])
    setAddingNew(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {elements.map(el => (
        <SavedRow
          key={el.id}
          element={el}
          resourceId={resourceId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {addingNew && (
        <NewRow
          resourceId={resourceId}
          order={elements.length}
          onSaved={handleSaved}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {!addingNew && (
        <button onClick={() => setAddingNew(true)} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
          <Plus size={14} />
          Add element
        </button>
      )}
    </div>
  )
}
