'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteSnippetButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this snippet?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Snippet deleted')
      router.push('/snippets')
      router.refresh()
    } catch {
      toast.error('Failed to delete snippet')
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn btn-danger btn-sm">
      <Trash2 size={14} />
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
