'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ConfirmDeleteButtonProps {
  id: number
  /** API endpoint that responds to DELETE (e.g. `/api/resources/5`). */
  endpoint: string
  /** Where to navigate after a successful delete (e.g. `/resources`). */
  redirectTo: string
  /** Shown next to the confirm controls; e.g. "Resources won't be deleted." */
  confirmMessage?: string
  confirmLabel?: string
  successMessage?: string
  errorMessage?: string
}

export function ConfirmDeleteButton({
  id,
  endpoint,
  redirectTo,
  confirmMessage = 'Delete?',
  confirmLabel = 'Yes, delete',
  successMessage = 'Deleted',
  errorMessage = 'Failed to delete',
}: ConfirmDeleteButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setConfirming(false)
    setLoading(true)
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(successMessage)
      router.push(redirectTo)
      router.refresh()
    } catch {
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{confirmMessage}</span>
        <button onClick={() => setConfirming(false)} className="btn btn-ghost btn-sm btn-icon" title="Cancel" aria-label="Cancel">
          <X size={13} />
        </button>
        <button onClick={handleDelete} className="btn btn-danger btn-sm btn-icon" title={confirmLabel} aria-label={confirmLabel}>
          <Check size={13} />
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} disabled={loading} className="btn btn-danger btn-sm btn-icon" title="Delete" aria-label="Delete">
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
    </button>
  )
}