import Link from 'next/link'
import { BookOpen, Brain, Code, LayoutList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TopBar } from '@/components/layout/TopBar'
import { db } from '@/lib/db'
import { resources, snippets, topics } from '@/lib/db/schema'
import { isNull, desc } from 'drizzle-orm'

export default async function HomePage() {
  const [topicList, recentResources, snippetList] = await Promise.all([
    db.select().from(topics).orderBy(desc(topics.createdAt)).limit(6),
    db.select().from(resources).where(isNull(resources.deletedAt)).orderBy(desc(resources.createdAt)).limit(5),
    db.select().from(snippets).orderBy(desc(snippets.createdAt)).limit(5),
  ])

  const stats = [
    { label: 'Topics', value: topicList.length, icon: LayoutList, href: '/topics' },
    { label: 'Resources', value: recentResources.length, icon: BookOpen, href: '/resources' },
    { label: 'Snippets', value: snippetList.length, icon: Code, href: '/snippets' },
  ]

  return (
    <div>
      <TopBar
        title="Happy Training AI"
        description="Your personal learning knowledge base"
        actions={
          <Link href="/resources/new">
            <Button size="sm">
              <Plus size={16} />
              Add Resource
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Resources</CardTitle>
            <Link href="/resources" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {recentResources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No resources yet.{' '}
                <Link href="/resources/new" className="underline">Add one</Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {recentResources.map((r) => (
                  <li key={r.id}>
                    <Link href={`/resources/${r.id}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <span className="text-muted-foreground text-xs uppercase w-12 shrink-0">{r.type}</span>
                      <span className="truncate">{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Topics</CardTitle>
            <Link href="/topics" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {topicList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No topics yet.{' '}
                <Link href="/topics/new" className="underline">Create one</Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {topicList.map((t) => (
                  <li key={t.id}>
                    <Link href={`/topics/${t.id}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <span>{t.icon}</span>
                      <span className="truncate">{t.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain size={16} />
              AI Suggestions
            </CardTitle>
            <Link href="/ai" className="text-xs text-muted-foreground hover:text-foreground">
              Open →
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get topic synthesis, related resource suggestions, and snippet explanations powered by Groq and Cohere.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
