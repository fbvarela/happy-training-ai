import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getOctokitForUser } from '@/lib/github/client'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const octokit = await getOctokitForUser(user.id)
  const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: 'updated',
  })

  return NextResponse.json(repos.map((r) => ({
    githubRepoId: r.id,
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    defaultBranch: r.default_branch,
    private: r.private,
    updatedAt: r.updated_at,
  })))
}
