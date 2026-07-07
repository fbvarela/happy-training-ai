import { notFound } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { getCurrentUser } from '@/lib/auth/session'
import { getConnectedRepoById } from '@/lib/repos/queries'
import { RepoDetail } from '@/components/repos/RepoDetail'

export default async function RepoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) notFound()

  const repo = await getConnectedRepoById(user.id, Number(id))
  if (!repo) notFound()

  return (
    <div>
      <TopBar
        title={repo.fullName}
        description={`${repo.defaultBranch}${repo.private ? ' · Private' : ''}`}
      />
      <RepoDetail repo={repo} />
    </div>
  )
}
