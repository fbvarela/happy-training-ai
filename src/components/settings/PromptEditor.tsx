'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { RotateCcw, Check, ChevronDown, ChevronRight } from 'lucide-react'

interface PromptEditorProps {
  settingKey: string
  label: string
  description: string
  defaultPrompt: string
}

export function PromptEditor({ settingKey, label, description, defaultPrompt }: PromptEditorProps) {
  const [value, setValue] = useState(defaultPrompt)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/settings/${settingKey}`)
      .then((r) => r.json())
      .then((d) => setValue(d.value ?? defaultPrompt))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingKey])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/${settingKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Prompt saved')
    } catch {
      toast.error('Failed to save prompt')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setValue(defaultPrompt)
  }

  return (
    <div className="field" style={{ margin: 0 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
        }}
        aria-expanded={expanded}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <label className="input-label" style={{ margin: 0, cursor: 'pointer' }}>{label}</label>
      </button>
      {expanded && (
        <>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '6px 0 8px' }}>{description}</p>
          <textarea
            className="hf-input"
            rows={8}
            disabled={loading}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button onClick={save} disabled={saving || loading || !value.trim()} className="btn btn-primary btn-sm">
              <Check size={13} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={reset} disabled={loading} className="btn btn-ghost btn-sm">
              <RotateCcw size={13} /> Reset to default
            </button>
          </div>
        </>
      )}
    </div>
  )
}
