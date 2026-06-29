import Link from 'next/link'
import { BookOpen, Brain, Code, LayoutList, Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getTopicIcon } from '@/lib/topics/icons'

import { db } from '@/lib/db'
import { resources, snippets, topics } from '@/lib/db/schema'
import { isNull, desc } from 'drizzle-orm'

export default async function HomePage() {
  const [topicList, recentResources, snippetList] = await Promise.all([
    db.select().from(topics).orderBy(desc(topics.createdAt)).limit(6),
    db.select().from(resources).where(isNull(resources.deletedAt)).orderBy(desc(resources.createdAt)).limit(5),
    db.select().from(snippets).orderBy(desc(snippets.createdAt)).limit(5),
  ])

  const stats = [
    { label: 'Topics', value: topicList.length, icon: LayoutList, href: '/topics' },
    { label: 'Resources', value: recentResources.length, icon: BookOpen, href: '/resources' },
    { label: 'Snippets', value: snippetList.length, icon: Code, href: '/snippets' },
  ]

  return (
    <div>
      <TopBar
        title="Happy Training AI"
        description="Your personal learning knowledge base"
        actions={
          <Link href="/resources/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            Add Resource
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="stat-card">
            <div className="stat-icon">
              <Icon size={22} />
            </div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="hf-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 className="hf-card-title" style={{ margin: 0 }}>
              <BookOpen size={16} />
              Recent Resources
            </h2>
            <Link href="/resources" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          {recentResources.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              No resources yet.{' '}
              <Link href="/resources/new" style={{ color: 'var(--bark)', textDecoration: 'underline' }}>Add one</Link>
            </p>
          ) : (
            <div>
              {recentResources.map((r) => (
                <Link key={r.id} href={`/resources/${r.id}`} className="list-item">
                  <span className="list-type-badge">{r.type}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="hf-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 className="hf-card-title" style={{ margin: 0 }}>
              <LayoutList size={16} />
              Topics
            </h2>
            <Link href="/topics" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          {topicList.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              No topics yet.{' '}
              <Link href="/topics/new" style={{ color: 'var(--bark)', textDecoration: 'underline' }}>Create one</Link>
            </p>
          ) : (
            <div>
              {topicList.map((t) => {
                const TIcon = getTopicIcon(t.icon)
                return (
                  <Link key={t.id} href={`/topics/${t.id}`} className="list-item">
                    <TIcon size={15} style={{ color: t.color ?? 'var(--leaf)', flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="hf-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2 className="hf-card-title" style={{ margin: 0 }}>
            <Brain size={16} />
            AI Suggestions
          </h2>
          <Link href="/ai" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            Open →
          </Link>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
          Topic synthesis, related resource suggestions, and snippet explanations — powered by Groq and Cohere.
        </p>
      </div>
    </div>
  )
}
