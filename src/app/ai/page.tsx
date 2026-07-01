import Link from 'next/link'
import { Sparkles, Code2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { TopicSynthesis } from '@/components/ai/TopicSynthesis'
import { getTopicIcon } from '@/lib/topics/icons'
import { getTopicById, getTopics } from '@/lib/topics/queries'
import { getResourcesByTopicId } from '@/lib/resources/queries'

export default async function AIPage() {
  const topicList = await getTopics()

  return (
    <div>
      <TopBar
        title="AI Suggestions"
        description="Topic synthesis powered by Cohere · Snippet explanations powered by Groq"
      />

      <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="hf-card">
          <h2 className="hf-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            Topic Learning Maps
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Select a topic to generate a learning map — what&apos;s covered, suggested order, and knowledge gaps.
          </p>
          {topicList.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              No topics yet.{' '}
              <Link href="/topics/new" style={{ color: 'var(--bark)', textDecoration: 'underline' }}>Create one</Link>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {topicList.map((topic) => (
                <TopicLoader key={topic.id} topicId={topic.id} />
              ))}
            </div>
          )}
        </div>

        <div className="hf-card">
          <h2 className="hf-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={16} />
            Snippet Explanations
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Open any snippet and click <strong>Explain with AI</strong> to get a step-by-step walkthrough powered by Groq.
          </p>
          <Link href="/snippets" className="btn btn-ghost btn-sm">
            Go to snippets →
          </Link>
        </div>
      </div>
    </div>
  )
}

async function TopicLoader({ topicId }: { topicId: number }) {
  const [topic, topicResources] = await Promise.all([
    getTopicById(topicId),
    getResourcesByTopicId(topicId),
  ])

  if (!topic) return null

  const TopicIcon = getTopicIcon(topic.icon)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <TopicIcon size={15} style={{ color: 'var(--bark)', opacity: 0.7 }} />
        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{topic.name}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({topicResources.length} resources)</span>
      </div>
      <TopicSynthesis topic={topic} resources={topicResources} />
    </div>
  )
}
