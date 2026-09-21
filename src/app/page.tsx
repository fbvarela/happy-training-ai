import Link from 'next/link'
import { BookOpen, Brain, Code, GraduationCap, LayoutList, Plus, ArrowRight, Play, Sparkles } from 'lucide-react'
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

  const totalMaterials = courses.reduce((sum, t) => sum + t.resourceCount, 0)
  const totalCompleted = courses.reduce((sum, t) => sum + t.completedCount, 0)
  const overallProgress = totalMaterials > 0 ? Math.round((totalCompleted / totalMaterials) * 100) : 0

  // The most recent course with any activity becomes the "Continue learning" focus.
  const inProgress = [...courses]
    .filter((t) => t.resourceCount > 0)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

  const courseList = courses.slice(0, 6)

  return (
    <div>
      {/* ── Learning hub spotlight ─────────────────────── */}
      <div className="spotlight mb-8">
        <div className="spotlight-inner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <span className="section-label">Learning hub</span>
              <h1 className="spotlight-title" style={{ marginTop: '12px' }}>
                Continue your training
              </h1>
              <p className="spotlight-sub" style={{ maxWidth: '46ch' }}>
                {totalMaterials > 0
                  ? `${totalCompleted} of ${totalMaterials} materials covered across ${courses.length} courses — ${overallProgress}% overall.`
                  : 'Build your personal course library — add materials and track progress.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <Link href="/resources/new" className="btn btn-primary btn-sm">
                  <Plus size={15} /> Add material
                </Link>
                <Link href="/topics/new" className="shell-btn">
                  <LayoutList size={14} /> New course
                </Link>
              </div>
            </div>

            {inProgress && (
              <div className="spotlight-card" style={{ flex: '0 1 300px', minWidth: 260 }}>
                <div className="label">Continue learning</div>
                <div className="value" style={{ margin: '8px 0 14px' }}>
                  {inProgress.name}
                </div>
                <div className="course-progress" style={{ marginBottom: '14px' }}>
                  <div className="course-progress-track" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.14)' }}>
                    <div className="course-progress-fill" style={{ width: `${Math.round((inProgress.completedCount / inProgress.resourceCount) * 100)}%` }} />
                  </div>
                  <div className="course-progress-label" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {inProgress.completedCount} of {inProgress.resourceCount} materials covered
                  </div>
                </div>
                <Link
                  href={`/topics/${inProgress.id}`}
                  className="shell-btn"
                  style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(255,255,255,0.22)' }}
                >
                  <Play size={13} /> Resume course <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8" style={{ gap: '16px' }}>
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

      {/* ── Your courses ──────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <span className="section-label">Your courses</span>
          <Link href="/topics" style={{ fontSize: '0.82rem', color: 'var(--leaf)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {courseList.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="empty-state-icon" style={{ margin: 0 }}>
              <LayoutList size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text)' }}>No courses yet</p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Organize materials into courses and track your learning progress.</p>
            </div>
            <Link href="/topics/new" className="btn btn-primary btn-sm">Create a course</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courseList.map((t) => {
              const TIcon = getTopicIcon(t.icon)
              const progress = t.resourceCount > 0 ? Math.round((t.completedCount / t.resourceCount) * 100) : 0
              return (
                <Link key={t.id} href={`/topics/${t.id}`} className="hf-card-link">
                  <div className="hf-card" style={{ padding: '16px 18px', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          borderRadius: '11px',
                          flexShrink: 0,
                          background: (t.color ?? 'var(--leaf)') + '18',
                          border: `1.5px solid ${(t.color ?? 'var(--leaf)')}33`,
                          color: t.color ?? 'var(--leaf)',
                        }}
                      >
                        <TIcon size={19} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {t.resourceCount} material{t.resourceCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--leaf)', flexShrink: 0 }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="course-progress-track" style={{ marginTop: '12px' }}>
                      <div className="course-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Recent + browse ───────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="section-label">Recent materials</span>
            <Link href="/resources" style={{ fontSize: '0.82rem', color: 'var(--leaf)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="hf-card">
            {recentResources.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                No materials yet.{' '}
                <Link href="/resources/new" style={{ color: 'var(--leaf)', textDecoration: 'underline' }}>Add one</Link>
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
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="section-label">Browse by topic</span>
            <Link href="/topics" style={{ fontSize: '0.82rem', color: 'var(--leaf)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="hf-card">
            {courseList.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                No topics yet.{' '}
                <Link href="/topics/new" style={{ color: 'var(--leaf)', textDecoration: 'underline' }}>Create one</Link>
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
      </div>

      {/* ── AI studio ─────────────────────────────────── */}
      <div className="hf-card" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div className="icon-tile">
          <Brain size={22} />
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--bark)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={15} style={{ color: 'var(--sun)' }} />
            AI Studio
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Generate course learning maps, AI explanations, and resource suggestions — powered by Cohere.
          </p>
        </div>
        <Link href="/ai" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
          Open AI Studio <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}