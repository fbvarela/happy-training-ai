import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/TopBar'

export default function TopicsPage() {
  return (
    <div>
      <TopBar
        title="Topics"
        description="Organize your resources by topic"
        actions={
          <Link href="/topics/new">
            <Button size="sm">
              <Plus size={16} />
              New Topic
            </Button>
          </Link>
        }
      />
      <p className="text-muted-foreground text-sm">Topics coming soon…</p>
    </div>
  )
}
