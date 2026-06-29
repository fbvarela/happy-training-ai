import { Suspense } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { ResourceForm } from '@/components/resources/ResourceForm'
import { PDFUpload } from '@/components/resources/PDFUpload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTopics } from '@/lib/topics/queries'

export default async function NewResourcePage() {
  const topics = await getTopics()

  return (
    <div>
      <TopBar title="Add Resource" description="Add a video, article, PDF, or snippet" />
      <Tabs defaultValue="url" className="max-w-lg">
        <TabsList className="mb-5">
          <TabsTrigger value="url">URL / Manual</TabsTrigger>
          <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
        </TabsList>
        <TabsContent value="url">
          <Suspense>
            <ResourceForm topics={topics} />
          </Suspense>
        </TabsContent>
        <TabsContent value="pdf">
          <PDFUpload topics={topics} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
