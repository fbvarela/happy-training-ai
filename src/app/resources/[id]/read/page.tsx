import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getResourceById } from '@/lib/resources/queries'
import { extractArticle } from '@/lib/resources/articleExtract'
import { ReaderView } from '@/components/resources/ReaderView'

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resource = await getResourceById(Number(id))
  if (!resource) notFound()

  let articleContent: string | null = null
  if (resource.type === 'article' && resource.url) {
    const article = await extractArticle(resource.url)
    articleContent = article?.content ?? null
  }

  const transcript = resource.transcript

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href={`/resources/${resource.id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} />
          Back
        </Link>
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <ExternalLink size={14} />
            Open original
          </a>
        )}
      </div>

      <ReaderView title={resource.title} description={resource.description ?? undefined}>

        {/* Video embed */}
        {resource.type === 'video' && resource.url && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', background: '#000', marginBottom: '20px' }}>
              <iframe
                src={`https://www.youtube.com/embed/${resource.url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]}`}
                style={{ width: '100%', height: '100%' }}
                allowFullScreen
                title={resource.title}
              />
            </div>
          </div>
        )}

        {/* AI Summary */}
        {resource.aiSummary && (
          <div style={{
            background: 'var(--cream)',
            border: '1px solid var(--line)',
            borderLeft: '3px solid var(--sun)',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '28px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              AI Summary
            </div>
            <p style={{ margin: 0, lineHeight: 1.65 }}>{resource.aiSummary}</p>
          </div>
        )}

        {/* Transcript (video) */}
        {resource.type === 'video' && (
          transcript ? (
            <div className="reader-transcript-section">
              <div className="reader-transcript-label">Transcript</div>
              {transcript.split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 24px', border: '1.5px dashed var(--line)', borderRadius: '10px', color: 'var(--text-muted)' }}>
              <p style={{ margin: '0 0 12px' }}>No transcript yet.</p>
              <Link href={`/resources/${resource.id}`} className="btn btn-ghost btn-sm">
                Go back to transcribe
              </Link>
            </div>
          )
        )}

        {/* Article content */}
        {resource.type === 'article' && (
          articleContent ? (
            <div dangerouslySetInnerHTML={{ __html: articleContent }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 24px', border: '1.5px dashed var(--line)', borderRadius: '10px', color: 'var(--text-muted)' }}>
              <p style={{ margin: '0 0 12px' }}>Could not extract article content.</p>
              {resource.url && (
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={14} />
                  Open original
                </a>
              )}
            </div>
          )
        )}

      </ReaderView>
    </div>
  )
}
