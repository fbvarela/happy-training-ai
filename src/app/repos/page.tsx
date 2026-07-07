import { TopBar } from '@/components/layout/TopBar'
import { getCurrentUser } from '@/lib/auth/session'
import { getConnectedRepos } from '@/lib/repos/queries'
import { ReposWorkspace } from '@/components/repos/ReposWorkspace'

export default async function ReposPage() {
  const user = await getCurrentUser()
  const repos = user ? await getConnectedRepos(user.id) : []

  return (
    <div>
      <TopBar
        title="Repos"
        description="Connect GitHub repositories for AI resource suggestions and code Q&A"
      />
      <ReposWorkspace initialRepos={repos} />
    </div>
  )
}
