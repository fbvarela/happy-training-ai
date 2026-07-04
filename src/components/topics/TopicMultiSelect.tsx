'use client'

import type { Topic } from '@/lib/db/schema'
import { getTopicIcon } from '@/lib/topics/icons'

interface Props {
  topics: Topic[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  id?: string
}

export function TopicMultiSelect({ topics, selectedIds, onChange, id }: Props) {
  function toggle(topicId: number) {
    onChange(
      selectedIds.includes(topicId)
        ? selectedIds.filter((i) => i !== topicId)
        : [...selectedIds, topicId]
    )
  }

  if (topics.length === 0) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No topics yet.</p>
  }

  return (
    <div
      id={id}
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        border: '1.5px solid var(--line)', borderRadius: '10px',
        padding: '10px', background: 'var(--surface)',
      }}
    >
      {topics.map((t) => {
        const checked = selectedIds.includes(t.id)
        const Icon = getTopicIcon(t.icon)
        return (
          <label
            key={t.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', borderRadius: '99px', cursor: 'pointer',
              fontSize: '0.82rem',
              border: `1.5px solid ${checked ? 'var(--bark)' : 'var(--line)'}`,
              background: checked ? 'var(--cream)' : 'transparent',
              color: checked ? 'var(--bark)' : 'var(--text-muted)',
              fontWeight: checked ? 600 : 400,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(t.id)}
              style={{ margin: 0 }}
            />
            <Icon size={14} />
            {t.name}
          </label>
        )
      })}
    </div>
  )
}
