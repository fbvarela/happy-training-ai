import { notFound } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { SnippetForm } from '@/components/snippets/SnippetForm'
import { getSnippetById } from '@/lib/snippets/queries'

export default async function EditSnippetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const snippet = await getSnippetById(Number(id))
  if (!snippet) notFound()

  return (
    <div>
      <TopBar title="Edit Snippet" description={`Editing "${snippet.title}"`} />
      <SnippetForm snippet={snippet} />
    </div>
  )
}
