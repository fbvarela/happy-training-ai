import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TopBar } from '@/components/layout/TopBar'
import { getTopicWithResourceCount } from '@/lib/topics/queries'

export default async function TopicsPage() {
  const topics = await getTopicWithResourceCount()

  return (
    <div>
      <TopBar
        title="Topics"
        description="Organize your resources by topic"
        actions={
          <Link href="/topics/new">
            <Button size="sm">
              <Plus size={16} />
              New Topic
            </Button>
          </Link>
        }
      />

      {topics.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-3">No topics yet.</p>
          <Link href="/topics/new">
            <Button variant="outline" size="sm">Create your first topic</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Link key={topic.id} href={`/topics/${topic.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-lg text-xl shrink-0"
                      style={{ backgroundColor: topic.color + '22' }}
                    >
                      {topic.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{topic.name}</p>
                      {topic.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{topic.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {topic.resourceCount} resource{topic.resourceCount !== 1 ? 's' : ''}
                      </p>
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
