'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Topic } from '@/lib/db/schema'

interface PDFUploadProps {
  topics: Topic[]
}

export function PDFUpload({ topics }: PDFUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [topicId, setTopicId] = useState<string | null>(null)
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
      if (topicId) formData.append('topicId', topicId)

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
          topicId: topicId ? Number(topicId) : null,
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
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div className="space-y-2">
        <Label>PDF File</Label>
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f?.type === 'application/pdf') handleFile(f)
          }}
        >
          <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
          {file ? (
            <p className="text-sm font-medium">{file.name}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Drop a PDF here or click to browse</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pdf-title">Title</Label>
        <Input
          id="pdf-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Topic</Label>
        <Select value={topicId ?? undefined} onValueChange={setTopicId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a topic (optional)" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.icon} {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={!file || loading}>
        {loading ? 'Uploading…' : 'Upload PDF'}
      </Button>
    </form>
  )
}
