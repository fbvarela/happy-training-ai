import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/TopBar'

export default function SnippetsPage() {
  return (
    <div>
      <TopBar
        title="Snippets"
        description="Code snippets with syntax highlighting"
        actions={
          <Link href="/snippets/new">
            <Button size="sm">
              <Plus size={16} />
              New Snippet
            </Button>
          </Link>
        }
      />
      <p className="text-muted-foreground text-sm">Snippets coming soon…</p>
    </div>
  )
}
