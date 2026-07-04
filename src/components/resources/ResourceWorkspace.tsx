'use client'

import { useRef, useState, type ReactNode } from 'react'
import {
  Plus, Trash2, Pencil, Check, X,
  Video, FileText, Newspaper, Paperclip, Image as ImageIcon, Code2,
  Upload, Link as LinkIcon, Loader2, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ResourceElement } from '@/lib/db/schema'
import { TranscriptBlock } from './TranscriptBlock'
import { TranscribeButton } from './TranscribeButton'
import { ExplainTranscript } from '../ai/ExplainTranscript'
import { CodeEditor } from '../snippets/CodeEditor'
import { CodeView } from '../snippets/CodeView'
import { MarkdownPreview } from '../markdown/MarkdownPreview'
import { LANGUAGES } from '@/lib/snippets/languages'
import { proxyImageUrl } from '@/lib/r2'
import { compressImageFile } from '@/lib/image/compress'

export type ElementWithContent = ResourceElement & {
  extractedHtml?: string | null
  /** True for the synthesized item representing the resource's own content (its url/file). */
  isResource?: boolean
}

const TYPE_OPTIONS = [
  { value: 'video',   label: 'Video',   Icon: Video },
  { value: 'pdf',     label: 'PDF',     Icon: FileText },
  { value: 'image',   label: 'Image',   Icon: ImageIcon },
  { value: 'article', label: 'Article', Icon: Newspaper },
  { value: 'file',    label: 'File',    Icon: Paperclip },
]

function TypeGlyph({ type, size, style }: { type: string; size: number; style?: React.CSSProperties }) {
  switch (type) {
    case 'video':   return <Video size={size} style={style} />
    case 'pdf':     return <FileText size={size} style={style} />
    case 'image':   return <ImageIcon size={size} style={style} />
    case 'article': return <Newspaper size={size} style={style} />
    case 'snippet': return <Code2 size={size} style={style} />
    default:        return <Paperclip size={size} style={style} />
  }
}

function detectType(url: string) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'video'
  if (/\.pdf(\?|$)/i.test(url)) return 'pdf'
  if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)) return 'image'
  if (url.startsWith('http')) return 'article'
  return 'file'
}

function typeFromExt(ext: string) {
  if (ext === '.pdf') return 'pdf'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'image'
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
  const src = proxyImageUrl(element.fileUrl ?? element.url)
  if (!src) return null
  return (
    <video controls style={{ width: '100%', borderRadius: '10px', background: '#000' }}>
      <source src={src} />
    </video>
  )
}

function PdfEmbed({ element }: { element: ElementWithContent }) {
  const src = proxyImageUrl(element.fileUrl ?? element.url)
  const [visible, setVisible] = useState(true)
  if (!src) return null
  return (
    <div>
      <button
        onClick={() => setVisible(v => !v)}
        className="btn btn-ghost btn-sm"
        style={{ fontSize: '0.78rem', marginBottom: visible ? '10px' : 0 }}
      >
        {visible ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {visible ? 'Hide PDF' : 'Show PDF'}
      </button>
      {visible && (
        <iframe
          src={src}
          style={{ width: '100%', height: '720px', border: '1px solid var(--line)', borderRadius: '10px' }}
          title={element.title ?? 'PDF'}
        />
      )}
    </div>
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
  const href = proxyImageUrl(element.fileUrl ?? element.url) || '#'
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

function ImageContent({ element }: { element: ElementWithContent }) {
  const src = proxyImageUrl(element.fileUrl ?? element.url)
  const [open, setOpen] = useState(false)
  if (!src) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Click to view full size"
        style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={element.title ?? 'Image'}
          style={{ width: '100%', maxHeight: '640px', objectFit: 'contain', borderRadius: '10px', border: '1px solid var(--line)', background: 'var(--cream)', display: 'block' }}
        />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(20, 14, 9, 0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '32px', cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              position: 'absolute', top: '18px', right: '20px',
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={element.title ?? 'Image'}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '6px', cursor: 'default', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}
    </>
  )
}

function SnippetContent({ element }: { element: ElementWithContent }) {
  if (!element.code) return null
  return <CodeView code={element.code} language={element.language ?? 'typescript'} />
}

function InlineContent({ element }: { element: ElementWithContent }) {
  if (element.type === 'video') return <VideoEmbed element={element} />
  if (element.type === 'pdf') return <PdfEmbed element={element} />
  if (element.type === 'image') return <ImageContent element={element} />
  if (element.type === 'article') return <ArticleContent element={element} />
  if (element.type === 'snippet') return <SnippetContent element={element} />
  return <FileContent element={element} />
}

/* ─── Main panel (focused element, full content + inline edit) ─── */

function MainPanel({
  element,
  resourceId,
  onUpdate,
  onDelete,
  onHide,
  onElementAdded,
}: {
  element: ElementWithContent
  resourceId: number
  onUpdate: (el: ElementWithContent) => void
  onDelete: (id: number) => void
  /** When set, this panel is a toggled-open complement (not the main resource) — show a collapse control. */
  onHide?: () => void
  onElementAdded?: (el: ElementWithContent) => void
}) {
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState(element.type)
  const [url, setUrl] = useState(element.url ?? '')
  const [title, setTitle] = useState(element.title ?? '')
  const [language, setLanguage] = useState(element.language ?? 'typescript')
  const [code, setCode] = useState(element.code ?? '')
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const displayTitle = element.title
    || (element.type === 'video' ? 'Video' : element.type === 'pdf' ? 'PDF' : element.type === 'article' ? 'Article' : element.type === 'snippet' ? 'Snippet' : 'File')

  async function save() {
    setSaving(true)
    try {
      const body = type === 'snippet'
        ? { title: title.trim() || null, type, language, code: code.trim() }
        : { url: url.trim() || null, title: title.trim() || null, type }
      const res = await fetch(`/api/resources/${resourceId}/elements/${element.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <TypeGlyph type={element.type} size={17} style={{ color: 'var(--bark)', opacity: 0.55, flexShrink: 0 }} />
        {editing ? (
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Editing…</span>
        ) : (
          <h2 style={{ flex: 1, margin: 0, fontSize: '1.3rem', fontWeight: 700, fontFamily: '"Fraunces", serif', color: 'var(--bark)' }}>
            {displayTitle}
          </h2>
        )}

        {element.isResource ? (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>main resource</span>
        ) : confirmDelete ? (
          <>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
              <X size={13} /> No
            </button>
            <button onClick={remove} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              <Check size={13} /> Remove
            </button>
          </>
        ) : editing ? (
          <>
            <button onClick={() => { setEditing(false); setUrl(element.url ?? ''); setTitle(element.title ?? ''); setType(element.type); setLanguage(element.language ?? 'typescript'); setCode(element.code ?? ''); setPreviewing(false) }}
              className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
              <X size={13} /> Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }}>
              <Check size={13} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <>
            {onHide && (
              <button onClick={onHide} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Hide">
                <ChevronUp size={14} /> Hide
              </button>
            )}
            <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Edit">
              <Pencil size={14} />
            </button>
            <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} title="Remove">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '14px', background: 'var(--cream)', border: '1.5px solid var(--line)', borderRadius: '10px' }}>
          {type === 'snippet' ? (
            <>
              <select className="hf-input" value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '160px', padding: '6px 8px', fontSize: '0.82rem' }}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input className="hf-input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.82rem' }} />
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
              {language === 'markdown' && previewing ? (
                <MarkdownPreview content={code} />
              ) : (
                <CodeEditor value={code} onChange={setCode} language={language} />
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select className="hf-input" value={type} onChange={e => setType(e.target.value)} style={{ width: '120px', flexShrink: 0, padding: '6px 8px', fontSize: '0.82rem' }}>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input
                  className="hf-input" type="url" placeholder="URL" value={url} autoFocus
                  onChange={e => { setUrl(e.target.value); if (e.target.value) setType(detectType(e.target.value)) }}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                />
              </div>
              <input className="hf-input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.82rem' }} />
              {element.fileUrl && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>File: {element.fileUrl.split('/').pop()}</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Content — hidden while editing a snippet, since the edit form above already has its own Source/Preview toggle */}
      {!(editing && element.type === 'snippet') && <InlineContent element={element} />}

      {/* Transcribe + transcript */}
      {element.type !== 'image' && element.type !== 'snippet' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {element.type === 'video' && (element.isResource || element.id > 0) && (
            <div>
              {element.isResource
                ? <TranscribeButton resourceId={element.resourceId} status={element.transcriptStatus} />
                : <TranscribeButton resourceId={element.id} status={element.transcriptStatus} isElement />}
            </div>
          )}
          {element.isResource
            ? <TranscriptBlock transcript={element.transcript} resourceId={element.resourceId} inline />
            : <TranscriptBlock transcript={element.transcript} elementId={element.id} inline />}
          {element.transcript && (
            <ExplainTranscript
              transcript={element.transcript}
              resourceId={resourceId}
              onSaved={(el) => onElementAdded?.({ ...el, extractedHtml: null })}
            />
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Complement card (sidebar, click to show below the main resource) ─── */

function ComplementCard({
  element,
  resourceId,
  expanded,
  onToggle,
  onDelete,
}: {
  element: ElementWithContent
  resourceId: number
  expanded: boolean
  onToggle: () => void
  onDelete: (id: number) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const sub = element.type === 'snippet' ? (element.language ?? 'snippet') : (element.url ?? element.fileUrl ?? element.type)

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
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onToggle() }}
      title={expanded ? 'Shown below — click to hide' : 'Click to show below the main resource'}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px',
        background: expanded ? 'var(--cream)' : 'var(--surface)',
        border: `1.5px solid ${expanded ? 'var(--bark)' : 'var(--line)'}`,
        borderRadius: '10px',
        cursor: 'pointer',
      }}
    >
      <TypeGlyph type={element.type} size={15} style={{ color: 'var(--bark)', opacity: 0.6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {element.title ?? element.type}
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sub}
        </div>
      </div>
      {confirmDelete ? (
        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm" style={{ padding: '3px 7px' }}>
            <X size={12} />
          </button>
          <button onClick={remove} disabled={deleting} className="btn btn-danger btn-sm" style={{ padding: '3px 7px', fontSize: '0.72rem' }}>
            <Check size={12} />
          </button>
        </div>
      ) : (
        <>
          {expanded ? <ChevronUp size={15} style={{ color: 'var(--bark)', flexShrink: 0 }} /> : <ChevronDown size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            disabled={deleting}
            className="btn btn-danger btn-sm"
            style={{ padding: '3px 7px', flexShrink: 0 }}
            title="Remove"
          >
            <Trash2 size={12} />
          </button>
        </>
      )}
    </div>
  )
}

/* ─── Add form ─── */

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
  const [mode, setMode] = useState<'file' | 'url' | 'snippet'>('file')
  const [type, setType] = useState('pdf')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [code, setCode] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(rawFile: File) {
    setUploading(true)
    try {
      // Compress images client-side so phone photos fit under the
      // serverless function body-size limit before they're sent.
      const file = rawFile.type.startsWith('image/') ? await compressImageFile(rawFile) : rawFile

      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/resources/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Upload failed')
      }
      const data = await res.json()
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      setUploadedFileUrl(data.fileUrl)
      setUploadedFileName(file.name)
      setType(typeFromExt(ext))
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (mode === 'url' && !url.trim()) { toast.error('URL is required'); return }
    if (mode === 'file' && !uploadedFileUrl) { toast.error('Please select a file'); return }
    if (mode === 'snippet' && !code.trim()) { toast.error('Code is required'); return }
    setSaving(true)
    try {
      const body = mode === 'url'
        ? { url: url.trim(), title: title.trim() || null, type, order }
        : mode === 'snippet'
          ? { type: 'snippet', title: title.trim() || null, language, code: code.trim(), order }
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

  const canSave = mode === 'url' ? !!url.trim() : mode === 'snippet' ? !!code.trim() : !!uploadedFileUrl

  return (
    <div style={{ border: '1.5px dashed var(--sun)', borderRadius: '10px', padding: '12px', background: 'var(--cream)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => setMode('file')} className={`btn btn-sm ${mode === 'file' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.76rem', flex: 1, justifyContent: 'center' }}>
          <Upload size={12} /> Upload
        </button>
        <button onClick={() => setMode('url')} className={`btn btn-sm ${mode === 'url' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.76rem', flex: 1, justifyContent: 'center' }}>
          <LinkIcon size={12} /> URL
        </button>
        <button onClick={() => setMode('snippet')} className={`btn btn-sm ${mode === 'snippet' ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.76rem', flex: 1, justifyContent: 'center' }}>
          <Code2 size={12} /> Snippet
        </button>
      </div>

      {mode === 'snippet' ? (
        <>
          <select className="hf-input" value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: '6px 8px', fontSize: '0.82rem' }}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input className="hf-input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.82rem' }} />
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
          {language === 'markdown' && previewing ? (
            <MarkdownPreview content={code} />
          ) : (
            <CodeEditor value={code} onChange={setCode} language={language} />
          )}
        </>
      ) : mode === 'file' ? (
        <>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          {uploadedFileUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
              <Check size={14} style={{ color: 'var(--leaf)', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFileName}</span>
              <button onClick={() => { setUploadedFileUrl(null); setUploadedFileName(null) }} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}><X size={12} /></button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-ghost btn-sm"
              style={{ justifyContent: 'center', border: '1px dashed var(--line)', borderRadius: '8px', padding: '14px', fontSize: '0.82rem' }}
            >
              {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</> : <><Upload size={14} /> Choose file</>}
            </button>
          )}
          <input className="hf-input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.82rem' }} />
        </>
      ) : (
        <>
          <input
            className="hf-input" type="url" placeholder="Paste a URL…" value={url} autoFocus
            onChange={e => { setUrl(e.target.value); if (e.target.value) setType(detectType(e.target.value)) }}
            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
          />
          <input className="hf-input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.82rem' }} />
        </>
      )}

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm"><X size={12} /> Cancel</button>
        <button onClick={save} disabled={saving || uploading || !canSave} className="btn btn-primary btn-sm">
          <Check size={12} /> {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

/* ─── Workspace ─── */

interface Props {
  resourceId: number
  initialElements: ElementWithContent[]
  sidebarFooter?: ReactNode
}

export function ResourceWorkspace({ resourceId, initialElements, sidebarFooter }: Props) {
  const [elements, setElements] = useState<ElementWithContent[]>(initialElements)
  const [expandedIds, setExpandedIds] = useState<number[]>([])
  const [adding, setAdding] = useState(false)

  // The main resource always sits first; everything else is a complement
  // shown in the sidebar. Selecting a complement adds it below the main
  // panel instead of replacing it, so both stay visible together.
  const main = elements[0] ?? null
  const secondary = elements.slice(1)
  const expanded = secondary.filter(el => expandedIds.includes(el.id))

  function toggleExpanded(id: number) {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function handleUpdate(updated: ElementWithContent) {
    setElements(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  function handleDelete(id: number) {
    setElements(prev => prev.filter(e => e.id !== id))
    setExpandedIds(prev => prev.filter(i => i !== id))
  }

  function handleSaved(el: ElementWithContent) {
    setElements(prev => [...prev, el])
    setAdding(false)
  }

  function handleElementAdded(el: ElementWithContent) {
    setElements(prev => [...prev, el])
  }

  return (
    <div className="resource-detail-layout">
      {/* Main: primary resource, plus any expanded complements stacked below */}
      <div>
        {main ? (
          <>
            <MainPanel
              key={main.id}
              element={main}
              resourceId={resourceId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onElementAdded={handleElementAdded}
            />
            {expanded.map(el => (
              <div key={el.id} style={{ marginTop: '32px' }}>
                <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 32px' }} />
                <MainPanel
                  element={el}
                  resourceId={resourceId}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onHide={() => toggleExpanded(el.id)}
                  onElementAdded={handleElementAdded}
                />
              </div>
            ))}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '56px 24px', border: '1.5px dashed var(--line)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            No content yet. Add a file or paste a URL in the panel on the right.
          </div>
        )}
      </div>

      {/* Sidebar: complements + add + metadata */}
      <aside className="resource-detail-sidebar">
        {secondary.length > 0 && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Complements · {secondary.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {secondary.map(el => (
                <ComplementCard
                  key={el.id}
                  element={el}
                  resourceId={resourceId}
                  expanded={expandedIds.includes(el.id)}
                  onToggle={() => toggleExpanded(el.id)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {adding ? (
          <AddForm
            resourceId={resourceId}
            order={elements.length}
            onSaved={handleSaved}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button onClick={() => setAdding(true)} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            <Plus size={14} /> Add content
          </button>
        )}

        {sidebarFooter}
      </aside>
    </div>
  )
}
