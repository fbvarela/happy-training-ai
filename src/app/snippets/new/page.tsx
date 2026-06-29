import { TopBar } from '@/components/layout/TopBar'
import { SnippetForm } from '@/components/snippets/SnippetForm'

export default function NewSnippetPage() {
  return (
    <div>
      <TopBar title="New Snippet" description="Create a syntax-highlighted code snippet" />
      <SnippetForm />
    </div>
  )
}
