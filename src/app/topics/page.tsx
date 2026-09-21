import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getTopicWithResourceCount } from '@/lib/topics/queries'
import { getTopicIcon } from '@/lib/topics/icons'

export default async function TopicsPage() {
  const topics = await getTopicWithResourceCount()
  const totalMaterials = topics.reduce((sum, t) => sum + t.resourceCount, 0)

  return (
    <div>
      <TopBar
        title="Courses"
        description={`Your courses and learning tracks — ${topics.length} course${topics.length !== 1 ? 's' : ''}, ${totalMaterials} material${totalMaterials !== 1 ? 's' : ''} across them`}
        actions={
          <Link href="/topics/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            New Course
          </Link>
        }
      />

      {topics.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Plus size={24} />
          </div>
          <p>No courses yet. Create a course to start organizing your training materials.</p>
          <Link href="/topics/new" className="btn btn-primary btn-sm">Create your first course</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const TopicIcon = getTopicIcon(topic.icon)
            const progress = topic.resourceCount > 0 ? Math.round((topic.completedCount / topic.resourceCount) * 100) : 0
            return (
              <Link key={topic.id} href={`/topics/${topic.id}`} className="hf-card-link">
                <div className="hf-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        flexShrink: 0,
                        background: (topic.color ?? 'var(--leaf)') + '18',
                        border: `1.5px solid ${(topic.color ?? 'var(--leaf)')}33`,
                        color: topic.color ?? 'var(--leaf)',
                        transition: 'transform 0.2s var(--ease-flow)',
                      }}
                    >
                      <TopicIcon size={20} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topic.name}
                      </div>
                      {topic.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {topic.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
                    <div className="course-progress">
                      <div className="course-progress-track">
                        <div className="course-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div className="course-progress-label">
                          {topic.completedCount} of {topic.resourceCount} material{topic.resourceCount !== 1 ? 's' : ''} covered
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--leaf)', flexShrink: 0 }}>{progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {topics.length > 0 && (
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <Link href="/topics/new" style={{ fontSize: '0.84rem', color: 'var(--leaf)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Plus size={14} /> Add another course <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}