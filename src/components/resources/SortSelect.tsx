'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

const OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'topic', label: 'Topic (A–Z)' },
]

export function SortSelect({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'date-desc') params.delete('sort')
    else params.set('sort', value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <ArrowUpDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <select
        className="hf-input"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        style={{ padding: '5px 8px', fontSize: '0.82rem', width: 'auto' }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
