import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { getResources } from '@/lib/resources/queries'
import { getResourceIcon } from '@/lib/resources/icons'
import { getTopicIcon } from '@/lib/topics/icons'
import { SortSelect } from '@/components/resources/SortSelect'
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
  // date-desc is the default order already returned by getResources()
  return sorted
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const { sort = 'date-desc' } = await searchParams
  const resources = sortResources(await getResources(), sort)

  return (
    <div>
      <TopBar
        title="Resources"
        description="Videos, PDFs, articles, and more"
        actions={
          <Link href="/resources/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            Add Resource
          </Link>
        }
      />

      {resources.length === 0 ? (
        <div className="empty-state">
          <p>No resources yet.</p>
          <Link href="/resources/new" className="btn btn-ghost btn-sm">Add your first resource</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <SortSelect current={sort} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {resources.map((r) => {
              const TypeIcon = getResourceIcon(r.type)
              return (
                <Link key={r.id} href={`/resources/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div className="hf-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TypeIcon size={18} style={{ color: 'var(--bark)', flexShrink: 0, opacity: 0.7 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </div>
                      {r.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {r.topics.map((t) => {
                        const TopicIcon = getTopicIcon(t.icon)
                        return (
                          <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <TopicIcon size={12} />
                            {t.name}
                          </span>
                        )
                      })}
                      <span className="hf-badge">{r.type}</span>
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
