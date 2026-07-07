import Link from 'next/link'
import { Sparkles, Code2, GitBranch } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { TopicSynthesis } from '@/components/ai/TopicSynthesis'
import { getTopicIcon } from '@/lib/topics/icons'
import { getTopicById, getTopics } from '@/lib/topics/queries'
import { getResourcesByTopicId } from '@/lib/resources/queries'
import { getCurrentUser } from '@/lib/auth/session'
import { getConnectedRepos, getLatestSuggestion } from '@/lib/repos/queries'

export default async function AIPage() {
  const [topicList, user] = await Promise.all([getTopics(), getCurrentUser()])
  const connectedRepoList = user ? await getConnectedRepos(user.id) : []

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

        {user && (
          <div className="hf-card">
            <h2 className="hf-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={16} />
              From your code
            </h2>
            {connectedRepoList.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                No repos connected yet.{' '}
                <Link href="/repos" style={{ color: 'var(--bark)', textDecoration: 'underline' }}>Connect one</Link>
                {' '}to get resource suggestions based on your actual code.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {connectedRepoList.map((repo) => (
                  <RepoSuggestionLoader key={repo.id} repoId={repo.id} fullName={repo.fullName} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

async function RepoSuggestionLoader({ repoId, fullName }: { repoId: number; fullName: string }) {
  const latest = await getLatestSuggestion(repoId)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <GitBranch size={14} style={{ color: 'var(--bark)', opacity: 0.6 }} />
        <Link href={`/repos/${repoId}`} style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--bark)' }}>
          {fullName}
        </Link>
      </div>
      {!latest ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          No suggestions generated yet. <Link href={`/repos/${repoId}`} style={{ color: 'var(--bark)', textDecoration: 'underline' }}>Generate some →</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(latest.suggestions as { title: string; why: string }[]).slice(0, 3).map((s, i) => (
            <div key={i} style={{ fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--bark)' }}>{s.title}</span>
              <span style={{ color: 'var(--text-muted)' }}> — {s.why}</span>
            </div>
          ))}
        </div>
      )}
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
