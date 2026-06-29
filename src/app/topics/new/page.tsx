import { TopBar } from '@/components/layout/TopBar'
import { TopicForm } from '@/components/topics/TopicForm'

export default function NewTopicPage() {
  return (
    <div>
      <TopBar title="New Topic" description="Create a topic to organize your resources" />
      <TopicForm />
    </div>
  )
}
