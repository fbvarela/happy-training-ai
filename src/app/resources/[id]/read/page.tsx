import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getResourceById } from '@/lib/resources/queries'
import { extractArticle } from '@/lib/resources/articleExtract'

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
      <div className="mb-6">
        <Link href={`/resources/${resource.id}`}>
          <Button variant="ghost" size="sm" className="pl-0">
            <ArrowLeft size={16} />
            Back
          </Button>
        </Link>
      </div>

      <article className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">{resource.title}</h1>
        {resource.description && (
          <p className="text-muted-foreground mb-6">{resource.description}</p>
        )}

        {resource.type === 'video' && resource.url && (
          <div className="mb-8">
            <div className="aspect-video rounded overflow-hidden bg-black mb-6">
              <iframe
                src={`https://www.youtube.com/embed/${resource.url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]}`}
                className="w-full h-full"
                allowFullScreen
                title={resource.title}
              />
            </div>

            {resource.aiSummary && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">AI Summary</p>
                <p className="text-sm leading-relaxed">{resource.aiSummary}</p>
              </div>
            )}

            {transcript ? (
              <div>
                <h2 className="text-lg font-semibold mb-4">Transcript</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {transcript.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm leading-7 mb-4 text-foreground/90">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="text-sm mb-3">No transcript yet.</p>
                <Link href={`/resources/${resource.id}`}>
                  <Button size="sm" variant="outline">Go back to transcribe</Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {resource.type === 'article' && (
          <div>
            {articleContent ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none [&_img]:rounded [&_a]:text-primary leading-7"
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                <p className="text-sm mb-3">Could not extract article content.</p>
                {resource.url && (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">Open original</Button>
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  )
}
