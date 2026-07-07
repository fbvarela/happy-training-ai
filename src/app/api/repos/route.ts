import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getConnectedRepos, connectRepo } from '@/lib/repos/queries'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const repos = await getConnectedRepos(user.id)
  return NextResponse.json(repos)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { githubRepoId, owner, name, fullName, defaultBranch, private: isPrivate } = body
  if (!githubRepoId || !owner || !name || !fullName || !defaultBranch) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const repo = await connectRepo({
    userId: user.id,
    githubRepoId: String(githubRepoId),
    owner,
    name,
    fullName,
    defaultBranch,
    private: !!isPrivate,
  })
  return NextResponse.json(repo)
}
