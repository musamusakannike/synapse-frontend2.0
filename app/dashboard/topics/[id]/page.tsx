"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { topicsApi, quizzesApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { formatDate, getDifficultyColor } from "@/lib/utils"
import { ArrowLeft, MessageSquare, Trophy, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

interface Topic {
  id: string
  title: string
  description?: string
  content: string
  customizations: {
    level: string
    includeCalculations: boolean
    includePracticeQuestions: boolean
    includeExamples: boolean
    includeApplications: boolean
    focusAreas: string[]
    additionalRequirements?: string
  }
  generatedContent?: string
  chatId?: string
  createdAt: string
}

export default function TopicDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTopic()
    }
  }, [params.id])

  const fetchTopic = async () => {
    try {
      setIsLoading(true)
      const response = await topicsApi.getById(params.id as string)
      setTopic(response.data.topic)
    } catch (error) {
      toast.error("Failed to fetch topic")
      router.push("/dashboard/topics")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!topic) return

    try {
      setIsGeneratingQuiz(true)
      const response = await quizzesApi.fromTopic(topic.id, {
        numberOfQuestions: 10,
        difficulty: "mixed",
        includeCalculations: topic.customizations.includeCalculations,
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
    if (!topic || !confirm(`Are you sure you want to delete "${topic.title}"?`)) return

    try {
      await topicsApi.delete(topic.id)
      toast.success("Topic deleted successfully")
      router.push("/dashboard/topics")
    } catch (error) {
      toast.error("Failed to delete topic")
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

  if (!topic) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Topic not found</h3>
          <Link href="/dashboard/topics">
            <Button>Back to Topics</Button>
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
              <h1 className="text-3xl font-bold text-gray-900">{topic.title}</h1>
              {topic.description && <p className="text-gray-600 mt-1">{topic.description}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {topic.chatId && (
              <Link href={`/dashboard/chats/${topic.chatId}`}>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>
            )}
            <Button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz}>
              {isGeneratingQuiz ? <LoadingSpinner size="sm" className="mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
              Generate Quiz
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Topic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Topic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className={getDifficultyColor(topic.customizations.level)}>{topic.customizations.level}</Badge>
              {topic.customizations.includeCalculations && <Badge variant="outline">Calculations</Badge>}
              {topic.customizations.includePracticeQuestions && <Badge variant="outline">Practice Questions</Badge>}
              {topic.customizations.includeExamples && <Badge variant="outline">Examples</Badge>}
              {topic.customizations.includeApplications && <Badge variant="outline">Applications</Badge>}
            </div>

            {topic.customizations.focusAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Focus Areas:</h4>
                <div className="flex flex-wrap gap-2">
                  {topic.customizations.focusAreas.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original Request:</h4>
              <p className="text-sm text-gray-600">{topic.content}</p>
            </div>

            {topic.customizations.additionalRequirements && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Requirements:</h4>
                <p className="text-sm text-gray-600">{topic.customizations.additionalRequirements}</p>
              </div>
            )}

            <div className="text-sm text-gray-500">Created {formatDate(topic.createdAt)}</div>
          </CardContent>
        </Card>

        {/* Generated Content */}
        {topic.generatedContent && (
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Explanation</CardTitle>
              <CardDescription>Personalized explanation based on your requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={topic.generatedContent} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
