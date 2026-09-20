import Link from 'next/link'
import { BookOpen, Brain, Code, LayoutList, Plus, GraduationCap } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getTopicIcon } from '@/lib/topics/icons'
import { getTopicWithResourceCount } from '@/lib/topics/queries'

import { db } from '@/lib/db'
import { resources, snippets } from '@/lib/db/schema'
import { isNull, desc, count } from 'drizzle-orm'

export default async function HomePage() {
  const [courses, recentResources, [{ value: resourceCount }], [{ value: snippetCount }]] = await Promise.all([
    getTopicWithResourceCount(),
    db.select().from(resources).where(isNull(resources.deletedAt)).orderBy(desc(resources.createdAt)).limit(5),
    db.select({ value: count() }).from(resources).where(isNull(resources.deletedAt)),
    db.select({ value: count() }).from(snippets),
  ])

  const stats = [
    { label: 'Courses', value: courses.length, icon: GraduationCap, href: '/topics' },
    { label: 'Materials', value: resourceCount, icon: BookOpen, href: '/resources' },
    { label: 'Notes', value: snippetCount, icon: Code, href: '/snippets' },
  ]

  const courseList = courses.slice(0, 6)

  return (
    <div>
      <TopBar
        title="Happy Training AI"
        description="Your personal training-course organizer"
        actions={
          <Link href="/resources/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            Add Material
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

      <div className="hf-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 className="hf-card-title" style={{ margin: 0 }}>
            <GraduationCap size={16} />
            Your Courses
          </h2>
          <Link href="/topics" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        {courseList.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
            No courses yet.{' '}
            <Link href="/topics/new" style={{ color: 'var(--bark)', textDecoration: 'underline' }}>Create one</Link>
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courseList.map((t) => {
              const TIcon = getTopicIcon(t.icon)
              const progress = t.resourceCount > 0 ? Math.round((t.completedCount / t.resourceCount) * 100) : 0
              return (
                <Link key={t.id} href={`/topics/${t.id}`} className="hf-card-link">
                  <div className="hf-card" style={{ padding: '14px 16px', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <TIcon size={16} style={{ color: t.color ?? 'var(--leaf)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {t.resourceCount} material{t.resourceCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--leaf)', flexShrink: 0 }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="course-progress-track" style={{ marginTop: '10px' }}>
                      <div className="course-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="hf-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 className="hf-card-title" style={{ margin: 0 }}>
              <BookOpen size={16} />
              Recent Materials
            </h2>
            <Link href="/resources" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          {recentResources.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              No materials yet.{' '}
              <Link href="/resources/new" style={{ color: 'var(--bark)', textDecoration: 'underline' }}>Add one</Link>
            </p>
          ) : (
            <div>
              {recentResources.map((r) => (
                <Link key={r.id} href={`/resources/${r.id}`} className="hf-list-item">
                  <span className="hf-list-badge">{r.type}</span>
                  <span className="hf-list-title">{r.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="hf-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 className="hf-card-title" style={{ margin: 0 }}>
              <LayoutList size={16} />
              Browse by Topic
            </h2>
            <Link href="/topics" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          {courseList.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              No topics yet.{' '}
              <Link href="/topics/new" style={{ color: 'var(--bark)', textDecoration: 'underline' }}>Create one</Link>
            </p>
          ) : (
            <div>
              {courseList.map((t) => {
                const TIcon = getTopicIcon(t.icon)
                return (
                  <Link key={t.id} href={`/topics/${t.id}`} className="hf-list-item">
                    <TIcon size={15} style={{ color: t.color ?? 'var(--leaf)', flexShrink: 0 }} />
                    <span className="hf-list-title">{t.name}</span>
                    <span className="hf-list-badge">{t.resourceCount}</span>
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
          Topic learning maps, related resource suggestions, and snippet explanations — powered by Cohere.
        </p>
      </div>
    </div>
  )
}
