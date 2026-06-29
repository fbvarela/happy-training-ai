'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use CDN worker to avoid bundling issues
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface PDFViewerProps {
  url: string
  title?: string
}

export function PDFViewer({ url, title }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [containerWidth, setContainerWidth] = useState(700)

  useEffect(() => {
    const el = document.getElementById('pdf-container')
    if (el) setContainerWidth(el.offsetWidth)
  }, [])

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm px-2 min-w-[80px] text-center">
            {pageNumber} / {numPages || '…'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-xs text-muted-foreground px-2 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
          >
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>

      <div
        id="pdf-container"
        className="border border-border rounded overflow-auto bg-muted/30"
        style={{ maxHeight: '80vh' }}
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="p-8 text-center text-muted-foreground text-sm">Loading PDF…</div>}
          error={<div className="p-8 text-center text-destructive text-sm">Failed to load PDF.</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            width={Math.min(containerWidth - 32, 900)}
          />
        </Document>
      </div>

      {title && <p className="text-xs text-muted-foreground mt-2 text-center">{title}</p>}
    </div>
  )
}
