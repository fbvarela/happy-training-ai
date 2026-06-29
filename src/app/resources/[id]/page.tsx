import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookOpen, ExternalLink, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TopBar } from '@/components/layout/TopBar'
import { DeleteResourceButton } from '@/components/resources/DeleteResourceButton'
import { TranscribeButton } from '@/components/resources/TranscribeButton'
import { getResourceById } from '@/lib/resources/queries'

const TYPE_ICON: Record<string, string> = {
  video: '🎥',
  pdf: '📄',
  article: '📰',
  snippet: '💻',
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resource = await getResourceById(Number(id))
  if (!resource) notFound()

  const readLink =
    resource.type === 'pdf'
      ? `/resources/${resource.id}/pdf`
      : `/resources/${resource.id}/read`

  return (
    <div>
      <TopBar
        title={`${TYPE_ICON[resource.type] ?? '📎'} ${resource.title}`}
        description={resource.description ?? undefined}
        actions={
          <div className="flex gap-2">
            <Link href={readLink}>
              <Button size="sm">
                <BookOpen size={16} />
                Read
              </Button>
            </Link>
            <Link href={`/resources/${resource.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil size={16} />
                Edit
              </Button>
            </Link>
            <DeleteResourceButton id={resource.id} />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary">{resource.type}</Badge>
        {resource.topicName && (
          <Badge variant="outline">
            {resource.topicIcon} {resource.topicName}
          </Badge>
        )}
        {resource.transcriptStatus === 'done' && (
          <Badge variant="outline">transcript ready</Badge>
        )}
        {resource.transcriptStatus === 'processing' && (
          <Badge variant="outline">transcribing…</Badge>
        )}
      </div>

      <div className="grid gap-4 max-w-2xl">
        {resource.url && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">URL</p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline break-all"
              >
                {resource.url}
                <ExternalLink size={12} className="shrink-0" />
              </a>
            </CardContent>
          </Card>
        )}

        {resource.aiSummary && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-2">AI Summary</p>
              <p className="text-sm leading-relaxed">{resource.aiSummary}</p>
            </CardContent>
          </Card>
        )}

        {resource.type === 'video' && resource.url && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="aspect-video rounded overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${resource.url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]}`}
                  className="w-full h-full"
                  allowFullScreen
                  title={resource.title}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/resources/${resource.id}/read`}>
                  <Button size="sm" variant="outline">View Transcript</Button>
                </Link>
                <TranscribeButton resourceId={resource.id} status={resource.transcriptStatus} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          Added {new Date(resource.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
