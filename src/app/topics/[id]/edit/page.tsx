import { notFound } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { TopicForm } from '@/components/topics/TopicForm'
import { getTopicById } from '@/lib/topics/queries'

export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const topic = await getTopicById(Number(id))
  if (!topic) notFound()

  return (
    <div>
      <TopBar title="Edit Topic" description={`Editing "${topic.name}"`} />
      <TopicForm topic={topic} />
    </div>
  )
}
