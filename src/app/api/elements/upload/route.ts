import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'

function typeFromExt(ext: string): string {
  if (ext === '.pdf') return 'pdf'
  if (['.mp4', '.mov', '.webm', '.mkv', '.avi'].includes(ext)) return 'video'
  return 'file'
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = extname(file.name).toLowerCase()
  const filename = `${randomUUID()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), buffer)

  return NextResponse.json({
    fileUrl: `/uploads/${filename}`,
    type: typeFromExt(ext),
    originalName: file.name,
  })
}
