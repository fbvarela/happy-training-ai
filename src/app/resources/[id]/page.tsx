import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, ExternalLink, Pencil } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { DeleteResourceButton } from '@/components/resources/DeleteResourceButton'
import { TranscribeButton } from '@/components/resources/TranscribeButton'
import { ElementsEditor } from '@/components/resources/ElementsEditor'
import { getResourceById } from '@/lib/resources/queries'
import { getElementsByResourceId } from '@/lib/resources/elementQueries'
import { TranscriptBlock } from '@/components/resources/TranscriptBlock'
import { getResourceIcon } from '@/lib/resources/icons'
import { getTopicIcon } from '@/lib/topics/icons'

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [resource, elements] = await Promise.all([
    getResourceById(Number(id)),
    getElementsByResourceId(Number(id)),
  ])
  if (!resource) notFound()

  const TypeIcon = getResourceIcon(resource.type)
  const TopicIcon = resource.topicIcon ? getTopicIcon(resource.topicIcon) : null

  return (
    <div>
      <TopBar
        title={resource.title}
        description={resource.description ?? undefined}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/resources/${resource.id}/edit`} className="btn btn-ghost btn-sm">
              <Pencil size={15} />
              Edit
            </Link>
            <DeleteResourceButton id={resource.id} />
          </div>
        }
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
        <span className="hf-badge" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <TypeIcon size={12} />
          {resource.type}
        </span>
        {resource.topicName && TopicIcon && (
          <span className="hf-badge" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TopicIcon size={12} />
            {resource.topicName}
          </span>
        )}
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          Added {new Date(resource.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Content elements — primary */}
      <div style={{ maxWidth: '680px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--bark)', fontFamily: '"Fraunces", serif' }}>
            Content
          </h2>
          {elements.length > 0 && (
            <Link href={`/resources/${resource.id}/read`} className="btn btn-primary btn-sm">
              <BookOpen size={14} />
              Read
            </Link>
          )}
        </div>
        <ElementsEditor resourceId={resource.id} initialElements={elements} />
      </div>

      {/* Secondary: resource-level metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '680px' }}>
        {resource.aiSummary && (
          <div className="hf-card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>AI Summary</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{resource.aiSummary}</p>
          </div>
        )}

        {resource.transcript && (
          <div className="hf-card" style={{ padding: '20px' }}>
            <TranscriptBlock transcript={resource.transcript} resourceId={resource.id} inline />
          </div>
        )}

        {resource.url && (
          <div className="hf-card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Source URL</div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.875rem', color: 'var(--bark)', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all', textDecoration: 'none' }}
            >
              {resource.url}
              <ExternalLink size={12} style={{ flexShrink: 0 }} />
            </a>
            {resource.type === 'video' && resource.url && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <TranscribeButton resourceId={resource.id} status={resource.transcriptStatus} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
