import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { TopBar } from '@/components/layout/TopBar'
import { DeleteTopicButton } from '@/components/topics/DeleteTopicButton'
import { getTopicById } from '@/lib/topics/queries'
import { getTopicIcon } from '@/lib/topics/icons'
import { getResourceIcon as getResIcon } from '@/lib/resources/icons'
import { db } from '@/lib/db'
import { resources } from '@/lib/db/schema'

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const topic = await getTopicById(Number(id))
  if (!topic) notFound()

  const TopicIcon = getTopicIcon(topic.icon)

  const topicResources = await db
    .select()
    .from(resources)
    .where(eq(resources.topicId, Number(id)))
    .then((rows) => rows.filter((r) => r.deletedAt == null))

  return (
    <div>
      <TopBar
        title={topic.name}
        description={topic.description ?? undefined}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/topics/${topic.id}/edit`} className="btn btn-ghost btn-sm">
              <Pencil size={15} />
              Edit
            </Link>
            <DeleteTopicButton id={topic.id} />
          </div>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: (topic.color ?? '#4a7c59') + '22',
            border: `1.5px solid ${(topic.color ?? '#4a7c59')}44`,
            color: topic.color ?? '#4a7c59',
          }}
        >
          <TopicIcon size={18} />
        </span>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {topicResources.length} resource{topicResources.length !== 1 ? 's' : ''}
        </span>
      </div>

      {topicResources.length === 0 ? (
        <div className="empty-state">
          <p>No resources in this topic yet.</p>
          <Link href={`/resources/new?topicId=${topic.id}`} className="btn btn-ghost btn-sm">
            Add a resource
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {topicResources.map((r) => {
            const TypeIcon = getResIcon(r.type)
            return (
              <Link key={r.id} href={`/resources/${r.id}`} className="hf-card-link">
                <div className="hf-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <TypeIcon size={16} style={{ color: 'var(--bark)', flexShrink: 0, marginTop: '2px', opacity: 0.7 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </div>
                      {r.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {r.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <span className="hf-badge">{r.type}</span>
                        {r.transcriptStatus === 'done' && (
                          <span className="hf-badge hf-badge-leaf">transcript</span>
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

      <div style={{ marginTop: '24px' }}>
        <Link href={`/resources/new?topicId=${topic.id}`} className="btn btn-ghost btn-sm">
          <Plus size={14} />
          Add resource to topic
        </Link>
      </div>
    </div>
  )
}
