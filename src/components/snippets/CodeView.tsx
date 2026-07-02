'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { codeToHtml } from 'shiki'
import { MarkdownPreview } from '@/components/markdown/MarkdownPreview'

interface CodeViewProps {
  code: string
  language: string
}

const isMarkdown = (language: string) => language.toLowerCase() === 'markdown'

export function CodeView({ code, language }: CodeViewProps) {
  const [html, setHtml] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'preview' | 'source'>(isMarkdown(language) ? 'preview' : 'source')

  useEffect(() => {
    codeToHtml(code, { lang: language, theme: 'one-dark-pro' })
      .then(setHtml)
      .catch(() => setHtml(`<pre><code>${code}</code></pre>`))
  }, [code, language])

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {isMarkdown(language) && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button
            onClick={() => setMode('preview')}
            className={`btn btn-sm ${mode === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem' }}
          >
            Preview
          </button>
          <button
            onClick={() => setMode('source')}
            className={`btn btn-sm ${mode === 'source' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem' }}
          >
            Source
          </button>
        </div>
      )}

      {isMarkdown(language) && mode === 'preview' ? (
        <MarkdownPreview content={code} />
      ) : (
        <div style={{ position: 'relative', width: '100%', maxWidth: '100%', minWidth: 0 }} className="group">
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute', right: '8px', top: '8px',
              width: '28px', height: '28px', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '6px', border: 'none',
              background: 'rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              opacity: 0, transition: 'opacity 0.15s',
              zIndex: 1,
            }}
            className="copy-btn"
            aria-label="Copy code"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <style>{`.group:hover .copy-btn { opacity: 1 !important }`}</style>
          {html ? (
            <div
              style={{ fontSize: '0.875rem', borderRadius: '10px', overflow: 'auto', width: '100%', maxWidth: '100%' }}
              className="[&_pre]:p-4 [&_pre]:rounded-none [&_pre]:m-0 [&_pre]:overflow-auto [&_pre]:max-w-full"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <pre style={{ background: 'var(--cream)', borderRadius: '10px', padding: '16px', fontSize: '0.875rem', overflow: 'auto', border: '1px solid var(--line)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <code>{code}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
