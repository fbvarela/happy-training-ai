import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getTopicWithResourceCount } from '@/lib/topics/queries'
import { getTopicIcon } from '@/lib/topics/icons'

export default async function TopicsPage() {
  const topics = await getTopicWithResourceCount()

  return (
    <div>
      <TopBar
        title="Courses"
        description="Your courses and learning tracks — organized by topic"
        actions={
          <Link href="/topics/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            New Course
          </Link>
        }
      />

      {topics.length === 0 ? (
        <div className="empty-state">
          <p>No courses yet.</p>
          <Link href="/topics/new" className="btn btn-ghost btn-sm">Create your first course</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const TopicIcon = getTopicIcon(topic.icon)
            const progress = topic.resourceCount > 0 ? Math.round((topic.completedCount / topic.resourceCount) * 100) : 0
            return (
            <Link key={topic.id} href={`/topics/${topic.id}`} className="hf-card-link">
              <div className="hf-card" style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      flexShrink: 0,
                      background: (topic.color ?? '#4a7c59') + '22',
                      border: `1.5px solid ${(topic.color ?? '#4a7c59')}44`,
                      color: topic.color ?? '#4a7c59',
                    }}
                  >
                    <TopicIcon size={20} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {topic.name}
                    </div>
                    {topic.description && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {topic.description}
                      </div>
                    )}
                    <div className="course-progress" style={{ marginTop: '10px' }}>
                      <div className="course-progress-track">
                        <div className="course-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="course-progress-label">
                        {topic.completedCount} of {topic.resourceCount} material{topic.resourceCount !== 1 ? 's' : ''} covered
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
