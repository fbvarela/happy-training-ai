import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TopicSynthesis } from '@/components/ai/TopicSynthesis'
import { db } from '@/lib/db'
import { resources, topics } from '@/lib/db/schema'
import { isNull, eq } from 'drizzle-orm'

export default async function AIPage() {
  const topicList = await db.select().from(topics).orderBy(topics.name)

  return (
    <div>
      <TopBar
        title="AI Suggestions"
        description="Topic synthesis powered by Cohere · Snippet explanations powered by Groq"
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Topic Learning Maps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Select a topic to generate a learning map — what&apos;s covered, suggested order, and knowledge gaps.
            </p>
            {topicList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No topics yet. <Link href="/topics/new" className="underline">Create one</Link>
              </p>
            ) : (
              <div className="space-y-8">
                {topicList.map((topic) => (
                  <TopicLoader key={topic.id} topicId={topic.id} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Snippet Explanations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Open any snippet and click <strong>Explain with AI</strong> to get a step-by-step walkthrough powered by Groq.
            </p>
            <Link href="/snippets" className="text-sm text-primary underline mt-2 inline-block">
              Go to snippets →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function TopicLoader({ topicId }: { topicId: number }) {
  const [topic, topicResources] = await Promise.all([
    db.select().from(topics).where(eq(topics.id, topicId)).then((r) => r[0]),
    db.select().from(resources).where(
      eq(resources.topicId, topicId)
    ).then((rows) => rows.filter((r) => r.deletedAt == null)),
  ])

  if (!topic) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span>{topic.icon}</span>
        <span className="font-medium text-sm">{topic.name}</span>
        <span className="text-xs text-muted-foreground">({topicResources.length} resources)</span>
      </div>
      <TopicSynthesis topic={topic} resources={topicResources} />
    </div>
  )
}
