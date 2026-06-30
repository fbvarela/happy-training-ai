import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getResourceById } from '@/lib/resources/queries'
import { getElementsByResourceId } from '@/lib/resources/elementQueries'
import { extractArticle } from '@/lib/resources/articleExtract'
import { ReaderView } from '@/components/resources/ReaderView'
import { TranscribeButton } from '@/components/resources/TranscribeButton'
import { TranscriptBlock } from '@/components/resources/TranscriptBlock'
import { proxyImageUrl } from '@/lib/r2'
import type { ResourceElement } from '@/lib/db/schema'

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [resource, elements] = await Promise.all([
    getResourceById(Number(id)),
    getElementsByResourceId(Number(id)),
  ])
  if (!resource) notFound()

  // Fallback: if no elements, synthesise one from the resource itself
  const items: ResourceElement[] = elements.length > 0
    ? elements
    : resource.url
      ? [{ id: -1, resourceId: resource.id, type: resource.type, url: resource.url, fileUrl: resource.fileUrl, title: null, order: 0, transcript: resource.transcript, transcriptStatus: resource.transcriptStatus, createdAt: resource.createdAt }]
      : []

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/resources/${resource.id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} />
          Back
        </Link>
        {resource.url && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <ExternalLink size={14} />
            Open original
          </a>
        )}
      </div>

      <ReaderView title={resource.title} description={resource.description ?? undefined}>

        {/* AI Summary */}
        {resource.aiSummary && (
          <div style={{
            background: 'var(--cream)',
            border: '1px solid var(--line)',
            borderLeft: '3px solid var(--sun)',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '32px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              AI Summary
            </div>
            <p style={{ margin: 0, lineHeight: 1.65 }}>{resource.aiSummary}</p>
          </div>
        )}

        {/* Elements rendered in order */}
        {items.map((el, idx) => (
          <ElementBlock key={el.id} element={el} index={idx} total={items.length} />
        ))}

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', border: '1.5px dashed var(--line)', borderRadius: '10px', color: 'var(--text-muted)' }}>
            <p style={{ margin: '0 0 12px' }}>No elements yet. Add videos, PDFs or articles on the resource page.</p>
            <Link href={`/resources/${resource.id}`} className="btn btn-ghost btn-sm">
              Go back
            </Link>
          </div>
        )}

      </ReaderView>
    </div>
  )
}

async function ElementBlock({ element, index, total }: { element: ResourceElement; index: number; total: number }) {
  const showDivider = index > 0

  if (element.type === 'video') {
    const ytId = element.url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]
    return (
      <div style={{ marginBottom: index < total - 1 ? '40px' : 0 }}>
        {showDivider && <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 32px' }} />}
        {element.title && (
          <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: '1.15em', color: 'var(--bark)', marginBottom: '14px' }}>
            {element.title}
          </h2>
        )}
        {ytId && (
          <div style={{ aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', background: '#000', marginBottom: '16px' }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              style={{ width: '100%', height: '100%' }}
              allowFullScreen
              title={element.title ?? 'Video'}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {element.url && (
            <a href={element.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              <ExternalLink size={13} />
              Open on YouTube
            </a>
          )}
          {element.id > 0 && (
            <TranscribeButton resourceId={element.id} status={element.transcriptStatus} isElement />
          )}
        </div>
        <TranscriptBlock
          transcript={element.transcript}
          elementId={element.id > 0 ? element.id : undefined}
          resourceId={element.id <= 0 ? element.resourceId : undefined}
        />
      </div>
    )
  }

  if (element.type === 'pdf') {
    return (
      <div style={{ marginBottom: index < total - 1 ? '40px' : 0 }}>
        {showDivider && <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 32px' }} />}
        {element.title && (
          <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: '1.15em', color: 'var(--bark)', marginBottom: '14px' }}>
            {element.title}
          </h2>
        )}
        <iframe
          src={proxyImageUrl(element.fileUrl ?? element.url)}
          style={{ width: '100%', height: '780px', border: '1px solid var(--line)', borderRadius: '10px' }}
          title={element.title ?? 'PDF'}
        />
      </div>
    )
  }

  if (element.type === 'image') {
    const src = proxyImageUrl(element.fileUrl ?? element.url)
    if (!src) return null
    return (
      <div style={{ marginBottom: index < total - 1 ? '40px' : 0 }}>
        {showDivider && <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 32px' }} />}
        {element.title && (
          <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: '1.15em', color: 'var(--bark)', marginBottom: '14px' }}>
            {element.title}
          </h2>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={element.title ?? 'Image'}
          style={{ width: '100%', maxHeight: '720px', objectFit: 'contain', borderRadius: '10px', border: '1px solid var(--line)' }}
        />
      </div>
    )
  }

  if (element.type === 'article') {
    let html: string | null = null
    if (element.url) {
      const article = await extractArticle(element.url)
      html = article?.content ?? null
    }
    return (
      <div style={{ marginBottom: index < total - 1 ? '40px' : 0 }}>
        {showDivider && <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 32px' }} />}
        {element.title && (
          <h2 style={{ fontFamily: '"Fraunces", serif', fontSize: '1.15em', color: 'var(--bark)', marginBottom: '14px' }}>
            {element.title}
          </h2>
        )}
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', border: '1.5px dashed var(--line)', borderRadius: '10px', color: 'var(--text-muted)' }}>
            <p style={{ margin: '0 0 10px' }}>Could not extract article.</p>
            {element.url && (
              <a href={element.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <ExternalLink size={13} />
                Open original
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  // generic file
  return (
    <div style={{ marginBottom: index < total - 1 ? '40px' : 0 }}>
      {showDivider && <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 32px' }} />}
      {element.url && (
        <a href={proxyImageUrl(element.fileUrl ?? element.url)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
          <ExternalLink size={13} />
          {element.title ?? 'Open file'}
        </a>
      )}
    </div>
  )
}
