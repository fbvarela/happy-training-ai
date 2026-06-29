import { Suspense } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { ResourceForm } from '@/components/resources/ResourceForm'
import { getTopics } from '@/lib/topics/queries'

export default async function NewResourcePage() {
  const topics = await getTopics()

  return (
    <div>
      <TopBar title="Add Resource" description="Add a video, article, PDF, or snippet" />
      <Suspense>
        <ResourceForm topics={topics} />
      </Suspense>
    </div>
  )
}
