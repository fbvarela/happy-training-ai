import { Suspense } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { NewResourceTabs } from '@/components/resources/NewResourceTabs'
import { getTopics } from '@/lib/topics/queries'

export default async function NewResourcePage() {
  const topics = await getTopics()

  return (
    <div>
      <TopBar title="Add Resource" description="Add a video, article, PDF, or snippet" />
      <Suspense>
        <NewResourceTabs topics={topics} />
      </Suspense>
    </div>
  )
}
