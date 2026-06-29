'use client'

import { useState } from 'react'
import { ResourceForm } from './ResourceForm'
import { PDFUpload } from './PDFUpload'
import type { Topic } from '@/lib/db/schema'

interface Props {
  topics: Topic[]
}

export function NewResourceTabs({ topics }: Props) {
  const [tab, setTab] = useState<'url' | 'pdf'>('url')

  return (
    <div style={{ maxWidth: '540px' }}>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '24px', background: 'var(--cream)', borderRadius: '10px', padding: '3px' }}>
        <button
          onClick={() => setTab('url')}
          className={tab === 'url' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          style={{ flex: 1, borderRadius: '8px', border: 'none' }}
        >
          URL / Manual
        </button>
        <button
          onClick={() => setTab('pdf')}
          className={tab === 'pdf' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          style={{ flex: 1, borderRadius: '8px', border: 'none' }}
        >
          Upload PDF
        </button>
      </div>

      {tab === 'url' && <ResourceForm topics={topics} />}
      {tab === 'pdf' && <PDFUpload topics={topics} />}
    </div>
  )
}
