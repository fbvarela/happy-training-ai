'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'
import type { Topic } from '@/lib/db/schema'

export function TopicFilterSelect({ topics, current }: { topics: Topic[]; current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value) params.delete('topic')
    else params.set('topic', value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <select
        className="hf-input"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        style={{ padding: '5px 8px', fontSize: '0.82rem', width: 'auto' }}
      >
        <option value="">All topics</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  )
}
