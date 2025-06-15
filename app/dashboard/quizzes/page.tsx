"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app"
import { quizzesApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate, getDifficultyColor, getScoreColor } from "@/lib/utils"
import { Trophy, Plus, Play, Eye, Trash2, Brain, FileText, Globe } from "lucide-react"
import toast from "react-hot-toast"

export default function QuizzesPage() {
  const router = useRouter()
  const { quizzes, setQuizzes, isLoadingQuizzes, setLoadingQuizzes } = useAppStore()
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async (page = 1) => {
    try {
      setLoadingQuizzes(true)
      const response = await quizzesApi.getAll({ page, limit: 12 })
      setQuizzes(response.data.quizzes || [])
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 })
    } catch (error) {
      toast.error("Failed to fetch quizzes")
    } finally {
      setLoadingQuizzes(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      await quizzesApi.delete(id)
      toast.success("Quiz deleted successfully")
      fetchQuizzes()
    } catch (error) {
      toast.error("Failed to delete quiz")
    }
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "topic":
        return Brain
      case "document":
        return FileText
      case "website":
        return Globe
      default:
        return Trophy
    }
  }

  const getBestScore = (attempts: any[]) => {
    if (!attempts || attempts.length === 0) return null
    return Math.max(...attempts.map((a) => a.score))
  }

  if (isLoadingQuizzes) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
            <p className="text-gray-600 mt-1">Test your knowledge with AI-generated quizzes</p>
          </div>
          <Link href="/dashboard/quizzes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Quiz
            </Button>
          </Link>
        </div>

        {/* Quizzes Grid */}
        {quizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No quizzes yet</CardTitle>
              <CardDescription className="mb-6">
                Generate your first quiz from topics, documents, or websites
              </CardDescription>
              <Link href="/dashboard/quizzes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => {
                const SourceIcon = getSourceIcon(quiz.sourceType)
                const bestScore = getBestScore(quiz.attempts)

                return (
                  <Card key={quiz._id} className="hover:shadow-lg transition-shadow quiz-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2 line-clamp-2 flex items-center">
                            <SourceIcon className="h-5 w-5 mr-2 text-primary" />
                            {quiz.title}
                          </CardTitle>
                          {quiz.description && (
                            <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary" className={getDifficultyColor(quiz.settings.difficulty)}>
                          {quiz.settings.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {quiz.questions?.length || quiz.settings.numberOfQuestions} questions
                        </Badge>
                        {quiz.settings.includeCalculations && <Badge variant="outline">Calculations</Badge>}
                        {bestScore !== null && <Badge className={getScoreColor(bestScore)}>Best: {bestScore}%</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>Created {formatDate(quiz.createdAt)}</span>
                        <span>{quiz.attempts?.length || 0} attempts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/dashboard/quizzes/${quiz._id}/attempt`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Play className="h-4 w-4 mr-2" />
                            Take Quiz
                          </Button>
                        </Link>
                        <Link href={`/dashboard/quizzes/${quiz._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(quiz._id, quiz.title)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === pagination.current ? "default" : "outline"}
                    size="sm"
                    onClick={() => fetchQuizzes(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
