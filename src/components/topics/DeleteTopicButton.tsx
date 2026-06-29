'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteTopicButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this topic? Resources in it will not be deleted.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/topics/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Topic deleted')
      router.push('/topics')
      router.refresh()
    } catch {
      toast.error('Failed to delete topic')
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
