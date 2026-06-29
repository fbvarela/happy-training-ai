import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PDFViewer } from '@/components/pdf/PDFViewer'
import { getResourceById } from '@/lib/resources/queries'

export default async function PDFPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resource = await getResourceById(Number(id))
  if (!resource || resource.type !== 'pdf') notFound()

  const pdfUrl = resource.fileUrl ?? resource.url
  if (!pdfUrl) notFound()

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/resources/${resource.id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} />
          Back
        </Link>
        <h1 style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.title}</h1>
      </div>

      <PDFViewer url={pdfUrl} title={resource.title} />
    </div>
  )
}
