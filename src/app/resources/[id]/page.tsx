import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, ExternalLink, Pencil, Plus } from 'lucide-react'
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

  const readLink =
    resource.type === 'pdf'
      ? `/resources/${resource.id}/pdf`
      : `/resources/${resource.id}/read`

  return (
    <div>
      <TopBar
        title={resource.title}
        description={resource.description ?? undefined}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={readLink} className="btn btn-primary btn-sm">
              <BookOpen size={15} />
              Read
            </Link>
            <Link href={`/resources/${resource.id}/edit`} className="btn btn-ghost btn-sm">
              <Pencil size={15} />
              Edit
            </Link>
            <DeleteResourceButton id={resource.id} />
          </div>
        }
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
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
        {resource.transcriptStatus === 'done' && (
          <span className="hf-badge hf-badge-leaf">transcript ready</span>
        )}
        {resource.transcriptStatus === 'processing' && (
          <span className="hf-badge">transcribing…</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px' }}>
        {resource.url && (
          <div className="hf-card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>URL</div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.875rem', color: 'var(--bark)', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all', textDecoration: 'none' }}
            >
              {resource.url}
              <ExternalLink size={12} style={{ flexShrink: 0 }} />
            </a>
          </div>
        )}

        {resource.aiSummary && (
          <div className="hf-card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>AI Summary</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{resource.aiSummary}</p>
          </div>
        )}

        {resource.type === 'video' && resource.url && (
          <div className="hf-card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Preview</div>
            <div style={{ aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${resource.url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]}`}
                style={{ width: '100%', height: '100%' }}
                allowFullScreen
                title={resource.title}
              />
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <Link href={`/resources/${resource.id}/read`} className="btn btn-ghost btn-sm">
                View Transcript
              </Link>
              <TranscribeButton resourceId={resource.id} status={resource.transcriptStatus} />
            </div>
          </div>
        )}

        {resource.transcript && (
          <div className="hf-card" style={{ padding: '20px' }}>
            <TranscriptBlock transcript={resource.transcript} resourceId={resource.id} inline />
          </div>
        )}

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Added {new Date(resource.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Elements */}
      <div style={{ marginTop: '32px', maxWidth: '680px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--bark)', fontFamily: '"Fraunces", serif' }}>
            Elements
          </h2>
          {elements.length > 0 && (
            <Link href={`/resources/${resource.id}/read`} className="btn btn-primary btn-sm">
              <BookOpen size={14} />
              Read all
            </Link>
          )}
        </div>
        <ElementsEditor resourceId={resource.id} initialElements={elements} />
      </div>
    </div>
  )
}
