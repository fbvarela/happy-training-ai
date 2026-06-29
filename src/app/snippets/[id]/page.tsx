import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil } from 'lucide-react'
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/snippets/${snippet.id}/edit`} className="btn btn-ghost btn-sm">
              <Pencil size={15} />
              Edit
            </Link>
            <DeleteSnippetButton id={snippet.id} />
          </div>
        }
      />

      <div style={{ marginBottom: '16px' }}>
        <span className="hf-badge">{snippet.language}</span>
      </div>

      <div style={{ maxWidth: '720px' }}>
        <CodeView code={snippet.code} language={snippet.language} />
        <ExplainSnippet code={snippet.code} language={snippet.language} />
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '24px' }}>
        Created {new Date(snippet.createdAt).toLocaleDateString()}
      </p>
    </div>
  )
}
