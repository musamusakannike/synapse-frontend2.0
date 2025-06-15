"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { quizzesApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate, getDifficultyColor, getScoreColor } from "@/lib/utils"
import { ArrowLeft, Play, Trophy, Clock, Target, Brain, FileText, Globe } from "lucide-react"
import toast from "react-hot-toast"

interface Quiz {
  _id: string
  title: string
  description?: string
  sourceType: "topic" | "document" | "website"
  questions: Array<{
    questionText: string
    options: string[]
    correctOption: number
    explanation: string
    difficulty: "easy" | "medium" | "hard"
    includesCalculation: boolean
  }>
  settings: {
    numberOfQuestions: number
    difficulty: "easy" | "medium" | "hard" | "mixed"
    includeCalculations: boolean
    timeLimit?: number
  }
  attempts: Array<{
    id: string
    attemptedAt: string
    completedAt?: string
    score: number
    totalQuestions: number
  }>
  createdAt: string
}

export default function QuizDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attempts, setAttempts] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      fetchQuiz()
      fetchAttempts()
    }
  }, [params.id])

  const fetchQuiz = async () => {
    try {
      setIsLoading(true)
      const response = await quizzesApi.getById(params.id as string)
      setQuiz(response.data.quiz)
    } catch (error) {
      toast.error("Failed to fetch quiz")
      router.push("/dashboard/quizzes")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAttempts = async () => {
    try {
      const response = await quizzesApi.getAttempts(params.id as string)
      setAttempts(response.data.attempts || [])
    } catch (error) {
      console.error("Failed to fetch attempts:", error)
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

  const getBestScore = () => {
    if (attempts.length === 0) return null
    return Math.max(...attempts.map((a) => a.score))
  }

  const getAverageScore = () => {
    if (attempts.length === 0) return null
    return Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
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

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz not found</h3>
          <Link href="/dashboard/quizzes">
            <Button>Back to Quizzes</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const SourceIcon = getSourceIcon(quiz.sourceType)
  const bestScore = getBestScore()
  const averageScore = getAverageScore()

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
                <SourceIcon className="h-8 w-8 mr-3 text-primary" />
                {quiz.title}
              </h1>
              {quiz.description && <p className="text-gray-600 mt-1">{quiz.description}</p>}
            </div>
          </div>
          <Link href={`/dashboard/quizzes/${quiz._id}/attempt`}>
            <Button size="lg">
              <Play className="h-5 w-5 mr-2" />
              Take Quiz
            </Button>
          </Link>
        </div>

        {/* Quiz Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Quiz Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Questions:</span>
                <span className="font-medium">{quiz.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Difficulty:</span>
                <Badge className={getDifficultyColor(quiz.settings.difficulty)}>{quiz.settings.difficulty}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Source:</span>
                <span className="font-medium capitalize">{quiz.sourceType}</span>
              </div>
              {quiz.settings.timeLimit && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Limit:</span>
                  <span className="font-medium">{quiz.settings.timeLimit} min</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDate(quiz.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Attempts:</span>
                <span className="font-medium">{attempts.length}</span>
              </div>
              {bestScore !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Best Score:</span>
                  <span className={`font-medium ${getScoreColor(bestScore)}`}>{bestScore}%</span>
                </div>
              )}
              {averageScore !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Average:</span>
                  <span className={`font-medium ${getScoreColor(averageScore)}`}>{averageScore}%</span>
                </div>
              )}
              {attempts.length === 0 && <p className="text-gray-500 text-sm">No attempts yet</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Easy Questions:</span>
                <span className="font-medium">{quiz.questions.filter((q) => q.difficulty === "easy").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Medium Questions:</span>
                <span className="font-medium">{quiz.questions.filter((q) => q.difficulty === "medium").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hard Questions:</span>
                <span className="font-medium">{quiz.questions.filter((q) => q.difficulty === "hard").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">With Calculations:</span>
                <span className="font-medium">{quiz.questions.filter((q) => q.includesCalculation).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attempts */}
        {attempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Attempts</CardTitle>
              <CardDescription>Your quiz attempt history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attempts.slice(0, 5).map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium">Attempt #{attempts.length - index}</div>
                      <div className="text-sm text-gray-600">{formatDate(attempt.attemptedAt)}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`text-sm font-medium ${getScoreColor(attempt.score)}`}>{attempt.score}%</div>
                      <div className="text-sm text-gray-600">
                        {attempt.score === 100
                          ? "Perfect!"
                          : attempt.score >= 80
                            ? "Great!"
                            : attempt.score >= 60
                              ? "Good"
                              : "Keep trying!"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Questions Preview</CardTitle>
            <CardDescription>Sample questions from this quiz (answers hidden)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {quiz.questions.slice(0, 3).map((question, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium">Question {index + 1}</span>
                    <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                    {question.includesCalculation && <Badge variant="outline">Calculation</Badge>}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-3">{question.questionText}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="p-2 bg-gray-50 rounded text-sm">
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {quiz.questions.length > 3 && (
                <div className="text-center text-gray-500 text-sm">
                  ... and {quiz.questions.length - 3} more questions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
