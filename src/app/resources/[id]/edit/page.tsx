import { notFound } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { ResourceForm } from '@/components/resources/ResourceForm'
import { getResourceById } from '@/lib/resources/queries'
import { getTopics } from '@/lib/topics/queries'
import { Suspense } from 'react'

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [resource, topics] = await Promise.all([
    getResourceById(Number(id)),
    getTopics(),
  ])
  if (!resource) notFound()

  return (
    <div>
      <TopBar title="Edit Resource" description={`Editing "${resource.title}"`} />
      <Suspense>
        <ResourceForm resource={resource} topics={topics} />
      </Suspense>
    </div>
  )
}
