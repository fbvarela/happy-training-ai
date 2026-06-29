'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
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

  const ps = { padding: '4px 8px' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn btn-ghost btn-sm" style={ps} onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: '0.85rem', padding: '0 8px', minWidth: '80px', textAlign: 'center', color: 'var(--bark)' }}>
            {pageNumber} / {numPages || '…'}
          </span>
          <button className="btn btn-ghost btn-sm" style={ps} onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>
            <ChevronRight size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn btn-ghost btn-sm" style={ps} onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
            <ZoomOut size={15} />
          </button>
          <span style={{ fontSize: '0.8rem', padding: '0 8px', minWidth: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {Math.round(scale * 100)}%
          </span>
          <button className="btn btn-ghost btn-sm" style={ps} onClick={() => setScale(s => Math.min(2.5, s + 0.2))}>
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      <div
        id="pdf-container"
        style={{ border: '1px solid var(--line)', borderRadius: '10px', overflow: 'auto', maxHeight: '80vh', background: 'var(--cream)' }}
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading PDF…</div>}
          error={<div style={{ padding: '32px', textAlign: 'center', color: 'var(--rose)', fontSize: '0.875rem' }}>Failed to load PDF.</div>}
        >
          <Page pageNumber={pageNumber} scale={scale} width={Math.min(containerWidth - 32, 900)} />
        </Document>
      </div>

      {title && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>{title}</p>}
    </div>
  )
}
