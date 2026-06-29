import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/TopBar'
import { getSnippets } from '@/lib/snippets/queries'

export default async function SnippetsPage() {
  const snippets = await getSnippets()

  return (
    <div>
      <TopBar
        title="Snippets"
        description="Code snippets with syntax highlighting"
        actions={
          <Link href="/snippets/new">
            <Button size="sm">
              <Plus size={16} />
              New Snippet
            </Button>
          </Link>
        }
      />

      {snippets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-3">No snippets yet.</p>
          <Link href="/snippets/new">
            <Button variant="outline" size="sm">Create your first snippet</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {snippets.map((s) => (
            <Link key={s.id} href={`/snippets/${s.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0">💻</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{s.title}</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {s.language}
                    </Badge>
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
