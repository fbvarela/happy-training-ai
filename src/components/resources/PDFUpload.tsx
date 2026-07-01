'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { TopicMultiSelect } from '@/components/topics/TopicMultiSelect'
import type { Topic } from '@/lib/db/schema'

interface PDFUploadProps {
  topics: Topic[]
}

export function PDFUpload({ topics }: PDFUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [topicIds, setTopicIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  function handleFile(f: File) {
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    try {
      // 1. Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title || file.name)

      const uploadRes = await fetch('/api/resources/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { fileUrl } = await uploadRes.json()

      // 2. Create resource record
      const createRes = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || file.name,
          type: 'pdf',
          fileUrl,
          topicIds,
        }),
      })
      if (!createRes.ok) throw new Error('Failed to save resource')
      const resource = await createRes.json()

      toast.success('PDF uploaded')
      router.push(`/resources/${resource.id}/pdf`)
      router.refresh()
    } catch {
      toast.error('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="field" style={{ margin: 0 }}>
        <label className="input-label">PDF File</label>
        <div
          style={{ border: '2px dashed var(--line)', borderRadius: '10px', padding: '32px', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') handleFile(f) }}
        >
          <Upload size={22} style={{ margin: '0 auto 8px', color: 'var(--text-muted)', display: 'block' }} />
          {file ? (
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--bark)' }}>{file.name}</p>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Drop a PDF here or click to browse</p>
          )}
          <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      </div>

      <div className="field" style={{ margin: 0 }}>
        <label className="input-label" htmlFor="pdf-title">Title</label>
        <input id="pdf-title" className="hf-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title" />
      </div>

      <div className="field" style={{ margin: 0 }}>
        <label className="input-label" htmlFor="pdf-topics">Topics</label>
        <TopicMultiSelect id="pdf-topics" topics={topics} selectedIds={topicIds} onChange={setTopicIds} />
      </div>

      <div>
        <button type="submit" disabled={!file || loading} className="btn btn-primary">
          {loading ? 'Uploading…' : 'Upload PDF'}
        </button>
      </div>
    </form>
  )
}
