import Link from 'next/link'
import { ArrowUpDown, BookOpen, Filter, Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getResources } from '@/lib/resources/queries'
import { getTopics } from '@/lib/topics/queries'
import { getResourceIcon } from '@/lib/resources/icons'
import { getTopicIcon } from '@/lib/topics/icons'
import { SortSelect } from '@/components/resources/SortSelect'
import { TopicFilter } from '@/components/resources/TopicFilter'
import { ResourceSearch } from '@/components/resources/ResourceSearch'
import type { ResourceWithTopics } from '@/lib/resources/queries'

function sortResources(resources: ResourceWithTopics[], sort: string): ResourceWithTopics[] {
  const sorted = [...resources]
  if (sort === 'date-asc') {
    sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else if (sort === 'topic') {
    sorted.sort((a, b) => {
      const topicA = a.topics[0]?.name ?? ''
      const topicB = b.topics[0]?.name ?? ''
      if (!topicA && !topicB) return 0
      if (!topicA) return 1
      if (!topicB) return -1
      return topicA.localeCompare(topicB)
    })
  }
  return sorted
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; topic?: string; search?: string }>
}) {
  const { sort = 'date-desc', topic, search } = await searchParams
  const topicId = topic ? Number(topic) : undefined
  const [resources, topics] = await Promise.all([
    getResources({ topicId, search, topicSearch: true }).then((r) => sortResources(r, sort)),
    getTopics(),
  ])

  return (
    <div>
      <TopBar
        title="Materials"
        description="Course materials — videos, PDFs, articles, and more"
        actions={
          <Link href="/resources/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            Add Material
          </Link>
        }
      />

      {resources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={24} />
          </div>
          <p>{search ? 'No materials match your search.' : 'No materials yet. Add videos, PDFs, articles, or files.'}</p>
          <Link href="/resources/new" className="btn btn-primary btn-sm">Add your first material</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <ResourceSearch current={search ?? ''} />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <TopicFilter current={topicId} topics={topics} />
              <SortSelect current={sort} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {resources.map((r) => {
              const TypeIcon = getResourceIcon(r.type)
              return (
                <Link key={r.id} href={`/resources/${r.id}`} className="hf-card-link">
                  <div className="hf-card" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '13px' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--cream)',
                        border: '1px solid var(--line)',
                        color: 'var(--bark)',
                        flexShrink: 0,
                      }}
                    >
                      <TypeIcon size={17} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </div>
                      {r.description && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {r.topics.slice(0, 2).map((t) => {
                        const TopicIcon = getTopicIcon(t.icon)
                        return (
                          <span key={t.id} className="hf-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <TopicIcon size={11} /> {t.name}
                          </span>
                        )
                      })}
                      <span className="hf-badge hf-badge-leaf">{r.type}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}