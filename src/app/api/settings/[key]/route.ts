import { NextRequest, NextResponse } from 'next/server'
import { getSetting, setSetting } from '@/lib/settings/queries'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const value = await getSetting(key)
  return NextResponse.json({ key, value: value ?? null })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const { value } = await req.json()
  if (typeof value !== 'string') return NextResponse.json({ error: 'Missing value' }, { status: 400 })
  await setSetting(key, value)
  return NextResponse.json({ key, value })
}
