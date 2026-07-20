// Client-side helper for direct browser-to-R2 uploads via a presigned URL
// (see /api/resources/upload-url), used for anything too large for the
// old FormData-through-our-function route to survive Vercel's serverless
// body-size limit.

export interface UploadedFile {
  fileUrl: string
  type: string
  title: string
}

export async function uploadFileDirect(file: File, title?: string | null): Promise<UploadedFile> {
  const urlRes = await fetch('/api/resources/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream', size: file.size }),
  })
  if (!urlRes.ok) {
    const data = await urlRes.json().catch(() => null)
    throw new Error(data?.error ?? 'Upload failed')
  }
  const { uploadUrl, fileUrl, type } = await urlRes.json()

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!putRes.ok) throw new Error('Upload failed')

  return { fileUrl, type, title: title ?? file.name.replace(/\.[^.]+$/, '') }
}
