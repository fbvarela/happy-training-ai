'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteTopicButton({ id }: { id: number }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setConfirming(false)
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

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resources won't be deleted.</span>
        <button onClick={() => setConfirming(false)} className="btn btn-ghost btn-sm">
          <X size={13} /> No
        </button>
        <button onClick={handleDelete} className="btn btn-danger btn-sm">
          <Check size={13} /> Yes, delete
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} disabled={loading} className="btn btn-danger btn-sm">
      <Trash2 size={14} />
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
