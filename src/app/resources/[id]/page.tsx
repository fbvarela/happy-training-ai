import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Pencil } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { DeleteResourceButton } from '@/components/resources/DeleteResourceButton'
import { ElementsContent } from '@/components/resources/ElementsContent'
import { getResourceById } from '@/lib/resources/queries'
import { getElementsByResourceId } from '@/lib/resources/elementQueries'
import { extractArticle } from '@/lib/resources/articleExtract'
import { TranscriptBlock } from '@/components/resources/TranscriptBlock'
import { getResourceIcon } from '@/lib/resources/icons'
import { getTopicIcon } from '@/lib/topics/icons'
import type { ElementWithContent } from '@/components/resources/ElementsContent'

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [resource, elements] = await Promise.all([
    getResourceById(Number(id)),
    getElementsByResourceId(Number(id)),
  ])
  if (!resource) notFound()

  // Pre-extract article content server-side so it renders inline
  const elementsWithContent: ElementWithContent[] = await Promise.all(
    elements.map(async el => {
      if (el.type === 'article' && el.url) {
        const article = await extractArticle(el.url)
        return { ...el, extractedHtml: article?.content ?? null }
      }
      return { ...el, extractedHtml: null }
    })
  )

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
              <Pencil size={15} /> Edit
            </Link>
            <DeleteResourceButton id={resource.id} />
          </div>
        }
      />

      <div className="resource-detail-layout">
        {/* ── Left: full inline content ── */}
        <div>
          <ElementsContent resourceId={resource.id} initialElements={elementsWithContent} />
        </div>

        {/* ── Right: metadata sidebar ── */}
        <aside className="resource-detail-sidebar">

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span className="hf-badge" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <TypeIcon size={12} /> {resource.type}
            </span>
            {resource.topicName && TopicIcon && (
              <span className="hf-badge" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <TopicIcon size={12} /> {resource.topicName}
              </span>
            )}
          </div>

          {resource.aiSummary && (
            <div className="hf-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                AI Summary
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.65, margin: 0, color: 'var(--bark)' }}>{resource.aiSummary}</p>
            </div>
          )}

          {resource.transcript && (
            <div className="hf-card" style={{ padding: '14px 16px' }}>
              <TranscriptBlock transcript={resource.transcript} resourceId={resource.id} inline />
            </div>
          )}

          {resource.url && (
            <div className="hf-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Source
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.82rem', color: 'var(--bark)', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all', textDecoration: 'none' }}
              >
                {resource.url} <ExternalLink size={11} style={{ flexShrink: 0 }} />
              </a>
            </div>
          )}

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '2px' }}>
            Added {new Date(resource.createdAt).toLocaleDateString()}
          </div>
        </aside>
      </div>
    </div>
  )
}
