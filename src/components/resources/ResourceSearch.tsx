'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

const DEBOUNCE_MS = 250
const MIN_CHARS = 3

export function ResourceSearch({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(current)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(current)
  }, [current])

  const commit = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!val.trim()) params.delete('search')
    else params.set('search', val.trim())
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [router, pathname, searchParams])

  function handleChange(val: string) {
    setValue(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.trim().length >= MIN_CHARS) {
      timerRef.current = setTimeout(() => commit(val), DEBOUNCE_MS)
    } else if (val.trim().length === 0) {
      timerRef.current = setTimeout(() => commit(val), DEBOUNCE_MS)
    }
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current)
    commit(value)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (timerRef.current) clearTimeout(timerRef.current)
      commit(value)
    } else if (e.key === 'Escape') {
      setValue('')
      if (timerRef.current) clearTimeout(timerRef.current)
      commit('')
    }
  }

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      <input
        className="hf-input"
        type="text"
        placeholder={`Search resources… (${MIN_CHARS}+ chars)`}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ paddingLeft: '32px', paddingRight: value ? '32px' : '13px', padding: '7px 13px 7px 32px', fontSize: '0.82rem', width: '100%' }}
      />
      {value && (
        <button
          onClick={() => { setValue(''); commit('') }}
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
