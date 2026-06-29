import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/TopBar'

export default function ResourcesPage() {
  return (
    <div>
      <TopBar
        title="Resources"
        description="Videos, PDFs, articles, and more"
        actions={
          <Link href="/resources/new">
            <Button size="sm">
              <Plus size={16} />
              Add Resource
            </Button>
          </Link>
        }
      />
      <p className="text-muted-foreground text-sm">Resources coming soon…</p>
    </div>
  )
}
