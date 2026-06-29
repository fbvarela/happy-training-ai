import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/TopBar'
import { getResources } from '@/lib/resources/queries'

const TYPE_ICON: Record<string, string> = {
  video: '🎥',
  pdf: '📄',
  article: '📰',
  snippet: '💻',
}

export default async function ResourcesPage() {
  const resources = await getResources()

  return (
    <div>
      <TopBar
        title="Resources"
        description="Videos, PDFs, articles, and more"
        actions={
          <Link href="/resources/new">
            <Button size="sm">
              <Plus size={16} />
              Add Resource
            </Button>
          </Link>
        }
      />

      {resources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-3">No resources yet.</p>
          <Link href="/resources/new">
            <Button variant="outline" size="sm">Add your first resource</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map((r) => (
            <Link key={r.id} href={`/resources/${r.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0">{TYPE_ICON[r.type] ?? '📎'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.topicName && (
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {r.topicIcon} {r.topicName}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {r.type}
                      </Badge>
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
