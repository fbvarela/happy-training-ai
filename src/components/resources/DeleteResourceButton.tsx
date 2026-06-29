'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function DeleteResourceButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this resource?')) return

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
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 size={16} />
      {loading ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
