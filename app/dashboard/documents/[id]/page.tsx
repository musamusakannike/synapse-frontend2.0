"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { documentsApi, quizzesApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { formatDate, formatFileSize } from "@/lib/utils"
import { ArrowLeft, MessageSquare, Trophy, Send, FileText, Trash2, CheckCircle, XCircle, Clock } from "lucide-react"
import toast from "react-hot-toast"

interface Document {
  _id: string
  originalName: string
  size: number
  summary?: string
  chatId?: string
  processingStatus: "pending" | "processing" | "completed" | "failed"
  createdAt: string
}

export default function DocumentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [question, setQuestion] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [qaPairs, setQaPairs] = useState<Array<{ question: string; answer: string }>>([])

  useEffect(() => {
    if (params.id) {
      fetchDocument()
    }
  }, [params.id])

  const fetchDocument = async () => {
    try {
      setIsLoading(true)
      const response = await documentsApi.getById(params.id as string)
      setDocument(response.data.document)
    } catch (error) {
      toast.error("Failed to fetch document")
      router.push("/dashboard/documents")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!document || !question.trim()) return

    try {
      setIsAsking(true)
      const response = await documentsApi.ask(document._id, question.trim())
      setQaPairs([...qaPairs, { question: question.trim(), answer: response.data.answer }])
      setQuestion("")
      toast.success("Question answered!")
    } catch (error) {
      toast.error("Failed to get answer")
    } finally {
      setIsAsking(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!document) return

    try {
      setIsGeneratingQuiz(true)
      const response = await quizzesApi.fromDocument(document._id, {
        numberOfQuestions: 10,
        difficulty: "mixed",
        includeCalculations: false,
      })

      toast.success("Quiz generated successfully!")
      router.push(`/dashboard/quizzes/${response.data.quiz.id}`)
    } catch (error) {
      toast.error("Failed to generate quiz")
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const handleDelete = async () => {
    if (!document || !confirm(`Are you sure you want to delete "${document.originalName}"?`)) return

    try {
      await documentsApi.delete(document._id)
      toast.success("Document deleted successfully")
      router.push("/dashboard/documents")
    } catch (error) {
      toast.error("Failed to delete document")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100"
      case "processing":
        return "text-yellow-600 bg-yellow-100"
      case "failed":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!document) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Document not found</h3>
          <Link href="/dashboard/documents">
            <Button>Back to Documents</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 mr-3 text-primary" />
                {document.originalName}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon(document.processingStatus)}
                <Badge className={getStatusColor(document.processingStatus)}>{document.processingStatus}</Badge>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">{formatFileSize(document.size)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {document.chatId && (
              <Link href={`/dashboard/chats/${document.chatId}`}>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>
            )}
            {document.processingStatus === "completed" && (
              <Button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz}>
                {isGeneratingQuiz ? <LoadingSpinner size="sm" className="mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                Generate Quiz
              </Button>
            )}
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Document Info */}
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">Uploaded {formatDate(document.createdAt)}</div>
          </CardContent>
        </Card>

        {/* Summary */}
        {document.summary && (
          <Card>
            <CardHeader>
              <CardTitle>AI Summary</CardTitle>
              <CardDescription>AI-generated analysis of your document</CardDescription>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={document.summary} />
            </CardContent>
          </Card>
        )}

        {/* Q&A Section */}
        {document.processingStatus === "completed" && (
          <Card>
            <CardHeader>
              <CardTitle>Ask Questions</CardTitle>
              <CardDescription>Ask specific questions about the document content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask a question about this document..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
                  disabled={isAsking}
                />
                <Button onClick={handleAskQuestion} disabled={!question.trim() || isAsking}>
                  {isAsking ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {qaPairs.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h4 className="font-medium text-gray-900">Questions & Answers</h4>
                  {qaPairs.map((qa, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4 space-y-2">
                      <div className="font-medium text-gray-900">Q: {qa.question}</div>
                      <div className="text-gray-600">
                        <MarkdownRenderer content={qa.answer} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {document.processingStatus === "processing" && (
          <Card>
            <CardContent className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Document</h3>
              <p className="text-gray-600">Your document is being analyzed. This may take a few minutes.</p>
            </CardContent>
          </Card>
        )}

        {document.processingStatus === "failed" && (
          <Card>
            <CardContent className="text-center py-8">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Failed</h3>
              <p className="text-gray-600 mb-4">
                There was an error processing your document. Please try uploading again.
              </p>
              <Link href="/dashboard/documents/upload">
                <Button>Upload New Document</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
