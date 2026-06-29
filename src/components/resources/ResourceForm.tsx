'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Resource, Topic } from '@/lib/db/schema'

interface ResourceFormProps {
  resource?: Resource & { topicName?: string | null }
  topics: Topic[]
}

export function ResourceForm({ resource, topics }: ResourceFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTopicId = searchParams.get('topicId') ?? resource?.topicId?.toString() ?? ''

  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState(resource?.url ?? '')
  const [title, setTitle] = useState(resource?.title ?? '')
  const [description, setDescription] = useState(resource?.description ?? '')
  const [topicId, setTopicId] = useState<string | null>(defaultTopicId || null)
  const [type, setType] = useState(resource?.type ?? 'article')

  function handleUrlChange(val: string) {
    setUrl(val)
    if (!resource) {
      if (/youtube\.com|youtu\.be/.test(val)) setType('video')
      else if (/\.pdf$/i.test(val)) setType('pdf')
      else if (val.startsWith('http')) setType('article')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const endpoint = resource ? `/api/resources/${resource.id}` : '/api/resources'
      const method = resource ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          url: url || null,
          type,
          topicId: topicId ?? null,
        }),
      })

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      toast.success(resource ? 'Resource updated' : 'Resource added')
      router.push(`/resources/${data.id}`)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://..."
        />
        <p className="text-xs text-muted-foreground">Paste a YouTube URL, article URL, or leave blank for manual entry.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as Resource['type'])}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video">🎥 Video</SelectItem>
            <SelectItem value="pdf">📄 PDF</SelectItem>
            <SelectItem value="article">📰 Article</SelectItem>
            <SelectItem value="snippet">💻 Snippet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Understanding TypeScript Generics"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief notes about this resource"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="topic">Topic</Label>
        <Select value={topicId} onValueChange={setTopicId}>
          <SelectTrigger id="topic">
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

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Saving…' : resource ? 'Save Changes' : 'Add Resource'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
