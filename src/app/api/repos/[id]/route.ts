import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { disconnectRepo, getConnectedRepoById } from '@/lib/repos/queries'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const repo = await getConnectedRepoById(user.id, Number(id))
  if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(repo)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await disconnectRepo(user.id, Number(id))
  return new NextResponse(null, { status: 204 })
}
