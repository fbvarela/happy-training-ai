import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/layout/TopBar'
import { CodeView } from '@/components/snippets/CodeView'
import { ExplainSnippet } from '@/components/ai/ExplainSnippet'
import { getSnippetById } from '@/lib/snippets/queries'
import { DeleteSnippetButton } from '@/components/snippets/DeleteSnippetButton'

export default async function SnippetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const snippet = await getSnippetById(Number(id))
  if (!snippet) notFound()

  return (
    <div>
      <TopBar
        title={snippet.title}
        description={snippet.description ?? undefined}
        actions={
          <div className="flex gap-2">
            <Link href={`/snippets/${snippet.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil size={16} />
                Edit
              </Button>
            </Link>
            <DeleteSnippetButton id={snippet.id} />
          </div>
        }
      />

      <div className="mb-4">
        <Badge variant="secondary">{snippet.language}</Badge>
      </div>

      <div className="max-w-3xl">
        <CodeView code={snippet.code} language={snippet.language} />

        <ExplainSnippet code={snippet.code} language={snippet.language} />
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Created {new Date(snippet.createdAt).toLocaleDateString()}
      </p>
    </div>
  )
}
