'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

interface ReaderViewProps {
  children: React.ReactNode
  title: string
  description?: string
}

const SIZES = [
  { label: 'S', body: '1rem',    line: 1.7,  heading: '1.5rem'  },
  { label: 'M', body: '1.125rem', line: 1.75, heading: '1.75rem' },
  { label: 'L', body: '1.25rem', line: 1.8,  heading: '2rem'    },
  { label: 'XL', body: '1.4rem', line: 1.85, heading: '2.25rem' },
]

export function ReaderView({ children, title, description }: ReaderViewProps) {
  const [sizeIdx, setSizeIdx] = useState(1)
  const size = SIZES[sizeIdx]

  return (
    <div style={{ maxWidth: '780px' }}>
      {/* Reader toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '6px',
        marginBottom: '32px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--line)',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>Text size</span>
        <button
          onClick={() => setSizeIdx(Math.max(0, sizeIdx - 1))}
          disabled={sizeIdx === 0}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px', borderRadius: '6px' }}
          aria-label="Decrease font size"
        >
          <Minus size={13} />
        </button>
        {SIZES.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setSizeIdx(i)}
            style={{
              padding: '3px 9px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: i === sizeIdx ? 700 : 400,
              background: i === sizeIdx ? 'var(--bark-bg)' : 'transparent',
              color: i === sizeIdx ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'background 0.14s, color 0.14s',
            }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setSizeIdx(Math.min(SIZES.length - 1, sizeIdx + 1))}
          disabled={sizeIdx === SIZES.length - 1}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px', borderRadius: '6px' }}
          aria-label="Increase font size"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Article title */}
      <h1 style={{
        fontFamily: '"Fraunces", serif',
        fontSize: size.heading,
        fontWeight: 700,
        lineHeight: 1.25,
        color: 'var(--bark)',
        marginBottom: description ? '12px' : '28px',
      }}>
        {title}
      </h1>
      {description && (
        <p style={{
          fontSize: size.body,
          color: 'var(--text-muted)',
          lineHeight: size.line,
          marginBottom: '28px',
          fontStyle: 'italic',
          textAlign: 'justify',
          hyphens: 'auto',
        }}>
          {description}
        </p>
      )}

      {/* Content */}
      <div
        style={{
          fontSize: size.body,
          lineHeight: size.line,
          color: 'var(--text)',
        }}
        className="reader-body"
      >
        {children}
      </div>
    </div>
  )
}
