import Link from 'next/link'
import { Code2, FileText, Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getSnippets } from '@/lib/snippets/queries'

export default async function SnippetsPage() {
  const snippets = await getSnippets()

  return (
    <div>
      <TopBar
        title="Notes"
        description="Notes, code, and reference material"
        actions={
          <Link href="/snippets/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            New Note
          </Link>
        }
      />

      {snippets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileText size={24} />
          </div>
          <p>No notes yet. Capture ideas, code snippets, or reference material.</p>
          <Link href="/snippets/new" className="btn btn-primary btn-sm">Create your first note</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {snippets.map((s) => {
            const Icon = s.language === 'markdown' ? FileText : Code2
            return (
              <Link key={s.id} href={`/snippets/${s.id}`} className="hf-card-link">
                <div className="hf-card" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '13px' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'var(--cream)',
                      border: '1px solid var(--line)',
                      color: 'var(--bark)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={17} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </div>
                    {s.description && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.description}
                      </div>
                    )}
                  </div>
                  <span className="hf-badge hf-badge-leaf">{s.language}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}