import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Pencil, Play, Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDeleteButton'
import { getTopicById } from '@/lib/topics/queries'
import { getTopicIcon } from '@/lib/topics/icons'
import { getResourceIcon as getResIcon } from '@/lib/resources/icons'
import { getResourcesByTopicId } from '@/lib/resources/queries'

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const topic = await getTopicById(Number(id))
  if (!topic) notFound()

  const TopicIcon = getTopicIcon(topic.icon)

  const topicResources = await getResourcesByTopicId(Number(id))
  const completedCount = topicResources.filter((r) => r.transcriptStatus === 'done').length
  const progress = topicResources.length > 0 ? Math.round((completedCount / topicResources.length) * 100) : 0

  return (
    <div className="resource-course-page">
      <TopBar
        title={topic.name}
        description={topic.description ?? undefined}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/topics/${topic.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="Edit course" aria-label="Edit course">
              <Pencil size={14} />
            </Link>
            <ConfirmDeleteButton
              id={topic.id}
              endpoint="/api/topics"
              redirectTo="/topics"
              confirmMessage="Resources won't be deleted."
              confirmLabel="Yes, delete"
              successMessage="Course deleted"
              errorMessage="Failed to delete course"
            />
          </div>
        }
      />

      {/* ── Course hero: progress + stats ──────────────── */}
      <div className="hf-card" style={{ padding: '22px 24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '46px',
              height: '46px',
              borderRadius: '13px',
              flexShrink: 0,
              background: (topic.color ?? 'var(--leaf)') + '18',
              border: `1.5px solid ${(topic.color ?? 'var(--leaf)')}33`,
              color: topic.color ?? 'var(--leaf)',
            }}
          >
            <TopicIcon size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Course progress
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--bark)', marginTop: '2px' }}>
              {completedCount} of {topicResources.length} material{topicResources.length !== 1 ? 's' : ''} covered · {progress}%
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Materials</div>
              <div style={{ fontFamily: '"Fraunces", serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--bark)' }}>{topicResources.length}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Covered</div>
              <div style={{ fontFamily: '"Fraunces", serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--leaf)' }}>{completedCount}</div>
            </div>
          </div>
        </div>
        <div className="course-progress">
          <div className="course-progress-track" style={{ height: '10px' }}>
            <div className="course-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ── Materials ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <span className="section-label">Course materials</span>
        <Link href={`/resources/new?topicId=${topic.id}`} className="btn btn-primary btn-sm">
          <Plus size={14} /> Add material
        </Link>
      </div>

      {topicResources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Play size={24} />
          </div>
          <p>No materials in this course yet. Add videos, PDFs, articles, or files to get started.</p>
          <Link href={`/resources/new?topicId=${topic.id}`} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add a material
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {topicResources.map((r) => {
            const TypeIcon = getResIcon(r.type)
            const done = r.transcriptStatus === 'done'
            return (
              <Link key={r.id} href={`/resources/${r.id}`} className="hf-card-link">
                <div className="hf-card" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '38px',
                        height: '38px',
                        borderRadius: '11px',
                        flexShrink: 0,
                        background: done ? 'color-mix(in srgb, var(--leaf) 12%, var(--surface))' : 'var(--cream)',
                        border: `1.5px solid ${done ? 'color-mix(in srgb, var(--leaf) 30%, var(--line))' : 'var(--line)'}`,
                        color: done ? 'var(--leaf)' : 'var(--bark)',
                      }}
                    >
                      <TypeIcon size={17} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </div>
                      {r.description && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {r.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '9px', alignItems: 'center' }}>
                        <span className="hf-badge">{r.type}</span>
                        {done && (
                          <span className="hf-badge hf-badge-leaf" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} /> covered
                          </span>
                        )}
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