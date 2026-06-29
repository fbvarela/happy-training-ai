import Link from 'next/link'
import { Plus, Code2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getSnippets } from '@/lib/snippets/queries'

export default async function SnippetsPage() {
  const snippets = await getSnippets()

  return (
    <div>
      <TopBar
        title="Snippets"
        description="Code snippets with syntax highlighting"
        actions={
          <Link href="/snippets/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            New Snippet
          </Link>
        }
      />

      {snippets.length === 0 ? (
        <div className="empty-state">
          <p>No snippets yet.</p>
          <Link href="/snippets/new" className="btn btn-ghost btn-sm">Create your first snippet</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {snippets.map((s) => (
            <Link key={s.id} href={`/snippets/${s.id}`} style={{ textDecoration: 'none' }}>
              <div className="hf-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Code2 size={18} style={{ color: 'var(--bark)', flexShrink: 0, opacity: 0.7 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </div>
                  {s.description && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.description}
                    </div>
                  )}
                </div>
                <span className="hf-badge">{s.language}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
