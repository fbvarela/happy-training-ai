import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getConnectedRepoById } from '@/lib/repos/queries'
import { getOctokitForUser } from '@/lib/github/client'
import { syncRepoFiles } from '@/lib/github/repoSync'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { repoId } = await req.json()
  const repo = await getConnectedRepoById(user.id, Number(repoId))
  if (!repo) return NextResponse.json({ error: 'Repo not found' }, { status: 404 })

  const octokit = await getOctokitForUser(user.id)
  const count = await syncRepoFiles(octokit, repo.id, repo.owner, repo.name, repo.defaultBranch)

  return NextResponse.json({ synced: count })
}
