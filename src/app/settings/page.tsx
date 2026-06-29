import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  return (
    <div>
      <TopBar title="Settings" description="Configure API keys and preferences" />

      <div className="max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="groq">Groq API Key</Label>
              <Input id="groq" type="password" placeholder="gsk_..." disabled value="Set in .env.local" />
              <p className="text-xs text-muted-foreground">Used for transcription, snippet explain, and Q&A.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cohere">Cohere API Key</Label>
              <Input id="cohere" type="password" placeholder="..." disabled value="Set in .env.local" />
              <p className="text-xs text-muted-foreground">Used for semantic search and topic synthesis.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Using local SQLite database at <code className="text-xs bg-muted px-1 py-0.5 rounded">local.db</code>.
              Configure <code className="text-xs bg-muted px-1 py-0.5 rounded">TURSO_DATABASE_URL</code> in{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> to use a remote Turso database.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
