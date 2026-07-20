import { TopBar } from '@/components/layout/TopBar'
import { SnippetForm } from '@/components/snippets/SnippetForm'

export default function NewSnippetPage() {
  return (
    <div>
      <TopBar title="New Note" description="Write a note, or add a code snippet with syntax highlighting" />
      <SnippetForm />
    </div>
  )
}
