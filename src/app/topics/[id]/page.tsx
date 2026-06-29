import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { eq, isNull } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/TopBar'
import { DeleteTopicButton } from '@/components/topics/DeleteTopicButton'
import { getTopicById } from '@/lib/topics/queries'
import { db } from '@/lib/db'
import { resources } from '@/lib/db/schema'

const TYPE_LABELS: Record<string, string> = {
  video: '🎥',
  pdf: '📄',
  article: '📰',
  snippet: '💻',
}

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const topic = await getTopicById(Number(id))
  if (!topic) notFound()

  const topicResources = await db
    .select()
    .from(resources)
    .where(eq(resources.topicId, Number(id)))
    // also filter out deleted
    .then((rows) => rows.filter((r) => r.deletedAt == null))

  return (
    <div>
      <TopBar
        title={`${topic.icon} ${topic.name}`}
        description={topic.description ?? undefined}
        actions={
          <div className="flex gap-2">
            <Link href={`/topics/${topic.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil size={16} />
                Edit
              </Button>
            </Link>
            <DeleteTopicButton id={topic.id} />
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-6">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ backgroundColor: topic.color ?? '#6366f1' }}
        />
        <span className="text-sm text-muted-foreground">
          {topicResources.length} resource{topicResources.length !== 1 ? 's' : ''}
        </span>
      </div>

      {topicResources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-3">No resources in this topic yet.</p>
          <Link href={`/resources/new?topicId=${topic.id}`}>
            <Button variant="outline" size="sm">Add a resource</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {topicResources.map((r) => (
            <Link key={r.id} href={`/resources/${r.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{TYPE_LABELS[r.type] ?? '📎'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-xs py-0">
                          {r.type}
                        </Badge>
                        {r.transcriptStatus === 'done' && (
                          <Badge variant="outline" className="text-xs py-0">transcript</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
