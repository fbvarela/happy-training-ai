'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CodeEditor } from './CodeEditor'
import { LANGUAGES, type Language } from '@/lib/snippets/queries'
import type { Snippet } from '@/lib/db/schema'

interface SnippetFormProps {
  snippet?: Snippet
}

export function SnippetForm({ snippet }: SnippetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(snippet?.title ?? '')
  const [description, setDescription] = useState(snippet?.description ?? '')
  const [language, setLanguage] = useState<Language>((snippet?.language as Language) ?? 'typescript')
  const [code, setCode] = useState(snippet?.code ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !code.trim()) return

    setLoading(true)
    try {
      const url = snippet ? `/api/snippets/${snippet.id}` : '/api/snippets'
      const method = snippet ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, language, code }),
      })

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      toast.success(snippet ? 'Snippet updated' : 'Snippet created')
      router.push(`/snippets/${data.id}`)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fetch with retry"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this snippet do?"
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Code *</Label>
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !title.trim() || !code.trim()}>
          {loading ? 'Saving…' : snippet ? 'Save Changes' : 'Create Snippet'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
