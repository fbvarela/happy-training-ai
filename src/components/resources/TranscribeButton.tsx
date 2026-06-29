'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface TranscribeButtonProps {
  resourceId: number
  status: string | null
  isElement?: boolean
}

export function TranscribeButton({ resourceId, status, isElement }: TranscribeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isDone = status === 'done'
  const isProcessing = status === 'processing'

  async function handleTranscribe() {
    setLoading(true)
    const toastId = toast.loading('Transcribing… this may take 20–30 seconds')

    try {
      const endpoint = isElement
        ? `/api/elements/${resourceId}/transcribe`
        : `/api/resources/${resourceId}/transcribe`

      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Transcription failed')
      toast.success('Transcript ready!', { id: toastId })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transcription failed', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleTranscribe}
      disabled={loading || isProcessing}
      className={isDone ? 'btn btn-ghost btn-sm' : 'btn btn-leaf btn-sm'}
    >
      {loading || isProcessing
        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        : <Sparkles size={14} />}
      {isProcessing ? 'Transcribing…' : isDone ? 'Re-transcribe' : 'Transcribe'}
    </button>
  )
}
