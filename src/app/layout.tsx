import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import './globals.css'

const themeScript = `(function(){try{var t=localStorage.getItem('hf-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`

export const metadata: Metadata = {
  title: 'Happy Training AI',
  description: 'Personal training knowledge base — videos, PDFs, snippets, and AI suggestions',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&family=Caveat:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Sidebar />
        <div className="app">
          <main className="page">{children}</main>
        </div>
        <BottomNav />
        <Toaster richColors />
      </body>
    </html>
  )
}
