import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="mb-4 flex items-center gap-3">
        <Link href={`/resources/${resource.id}`}>
          <Button variant="ghost" size="sm" className="pl-0">
            <ArrowLeft size={16} />
            Back
          </Button>
        </Link>
        <h1 className="font-semibold truncate">{resource.title}</h1>
      </div>

      <PDFViewer url={pdfUrl} title={resource.title} />
    </div>
  )
}
