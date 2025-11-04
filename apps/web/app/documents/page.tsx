"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { DocumentSearch } from "@/components/document-search"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Search, FileText } from "lucide-react"

export default function DocumentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("upload")

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/sign-in')
    }
  }, [router, session, isPending])

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (!session?.user) {
    return null
  }

  const userId = session.user.id || session.user.email || 'anonymous'

  return (
    <div className="@container/main flex flex-1 flex-col min-h-0 w-full">
      <div className="flex flex-1 flex-col px-4 py-4 md:px-6 md:py-6 min-h-0 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-gray-600 mt-2">
            Upload, search, and manage your documents with AI-powered analysis
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload Documents</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Search & Manage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-1 min-h-0 mt-6">
            <div className="max-w-4xl mx-auto">
              <FileUpload
                userId={userId}
                onUploadComplete={(file) => {
                  // Switch to search tab when upload is complete
                  setActiveTab("search")
                }}
              />

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>How It Works</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">1. Upload Files</h4>
                      <p className="text-gray-600">
                        Upload PDF or Markdown files. We support files up to 50MB in size.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">2. AI Processing</h4>
                      <p className="text-gray-600">
                        Documents are automatically processed using AI to extract and understand content.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">3. Search & Discover</h4>
                      <p className="text-gray-600">
                        Search through your documents using natural language queries.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="search" className="flex-1 min-h-0 mt-6">
            <DocumentSearch userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}