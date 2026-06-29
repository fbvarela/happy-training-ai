'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteResourceButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this resource and all its elements?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Resource deleted')
      router.push('/resources')
      router.refresh()
    } catch {
      toast.error('Failed to delete resource')
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
