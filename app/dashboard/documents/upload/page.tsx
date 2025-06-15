"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { documentsApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/ui/file-upload"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"

export default function UploadDocumentPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState("Please provide a comprehensive summary and analysis of this document.")
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload")
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("document", selectedFile)
      formData.append("prompt", prompt)

      const response = await documentsApi.upload(formData)
      toast.success("Document uploaded successfully!")
      router.push(`/dashboard/documents/${response.data.document.id}`)
    } catch (error) {
      toast.error("Failed to upload document")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
            <p className="text-gray-600 mt-1">Upload PDF or DOCX files for AI analysis</p>
          </div>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>Upload your document and specify what you'd like to learn from it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Document</label>
              <FileUpload
                onFileSelect={setSelectedFile}
                onFileRemove={() => setSelectedFile(null)}
                selectedFile={selectedFile}
                disabled={isUploading}
              />
            </div>

            {/* Prompt */}
            <div>
              <label className="text-sm font-medium mb-2 block">Analysis Prompt</label>
              <Textarea
                placeholder="What would you like to know about this document?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe what kind of analysis or information you want from the document
              </p>
            </div>

            {/* Upload Button */}
            <div className="flex items-center justify-end space-x-4">
              <Button variant="outline" onClick={() => router.back()} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  "Upload & Analyze"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• PDF and DOCX file support</li>
              <li>• AI-powered document summarization</li>
              <li>• Interactive Q&A with document content</li>
              <li>• Quiz generation from document content</li>
              <li>• Persistent chat history</li>
              <li>• Maximum file size: 50MB</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
