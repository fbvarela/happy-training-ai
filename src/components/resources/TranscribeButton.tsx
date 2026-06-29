'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface TranscribeButtonProps {
  resourceId: number
  status: string | null
}

export function TranscribeButton({ resourceId, status }: TranscribeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isDone = status === 'done'
  const isProcessing = status === 'processing'

  async function handleTranscribe() {
    setLoading(true)
    const toastId = toast.loading('Transcribing video… this may take 20–30 seconds')

    try {
      const res = await fetch(`/api/resources/${resourceId}/transcribe`, { method: 'POST' })
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

  if (isDone) {
    return (
      <Button size="sm" variant="outline" onClick={handleTranscribe} disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        Re-transcribe
      </Button>
    )
  }

  return (
    <Button size="sm" onClick={handleTranscribe} disabled={loading || isProcessing}>
      {loading || isProcessing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Sparkles size={16} />
      )}
      {isProcessing ? 'Transcribing…' : 'Transcribe'}
    </Button>
  )
}
