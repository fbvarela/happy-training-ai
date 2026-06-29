import { TopBar } from '@/components/layout/TopBar'

export default function AIPage() {
  return (
    <div>
      <TopBar
        title="AI Suggestions"
        description="Topic synthesis, related resources, and snippet explanations"
      />
      <p className="text-muted-foreground text-sm">AI features coming soon…</p>
    </div>
  )
}
