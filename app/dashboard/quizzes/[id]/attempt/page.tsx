"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { quizzesApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { getDifficultyColor, getScoreColor } from "@/lib/utils"
import { Clock, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react"
import toast from "react-hot-toast"

interface QuizQuestion {
  index: number
  questionText: string
  options: string[]
  difficulty: "easy" | "medium" | "hard"
  includesCalculation: boolean
}

interface QuizAttempt {
  quizId: string
  title: string
  description?: string
  settings: {
    numberOfQuestions: number
    difficulty: string
    timeLimit?: number
  }
  questions: QuizQuestion[]
  totalQuestions: number
}

interface QuizResult {
  score: number
  correctAnswers: number
  totalQuestions: number
  percentage: number
  detailedResults: Array<{
    questionIndex: number
    selectedOption: number
    correctOption: number
    isCorrect: boolean
    timeSpent: number
    explanation: string
  }>
  attemptId: string
}

export default function QuizAttemptPage() {
  const router = useRouter()
  const params = useParams()
  const [quiz, setQuiz] = useState<QuizAttempt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (params.id) {
      startQuiz()
    }
  }, [params.id])

  useEffect(() => {
    if (quiz?.settings.timeLimit && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev !== null && prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev !== null ? prev - 1 : null
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quiz, timeLeft])

  const startQuiz = async () => {
    try {
      setIsLoading(true)
      const response = await quizzesApi.start(params.id as string)
      setQuiz(response.data)

      if (response.data.settings.timeLimit) {
        setTimeLeft(response.data.settings.timeLimit * 60) // Convert minutes to seconds
      }

      setStartTime(Date.now())
      setQuestionStartTime(Date.now())
    } catch (error) {
      toast.error("Failed to start quiz")
      router.push("/dashboard/quizzes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex })
  }

  const handleNextQuestion = () => {
    if (!quiz) return

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handleSubmit = async () => {
    if (!quiz) return

    try {
      setIsSubmitting(true)

      const submissionAnswers = quiz.questions.map((question, index) => ({
        questionIndex: index,
        selectedOption: answers[index] ?? 0,
        timeSpent: Math.floor((Date.now() - startTime) / quiz.questions.length / 1000),
      }))

      const response = await quizzesApi.submit(quiz.quizId, submissionAnswers)
      setResult(response.data.results)
      setShowResults(true)
      toast.success("Quiz submitted successfully!")
    } catch (error) {
      toast.error("Failed to submit quiz")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    if (!quiz) return 0
    return ((currentQuestion + 1) / quiz.questions.length) * 100
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
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
          <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
        </div>
      </DashboardLayout>
    )
  }

  if (showResults && result) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Results Header */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="h-16 w-16 text-yellow-500" />
              </div>
              <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              <CardDescription>Here are your results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className={`text-4xl font-bold ${getScoreColor(result.percentage)}`}>{result.percentage}%</div>
                  <div className="text-gray-600">Final Score</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-gray-900">
                    {result.correctAnswers}/{result.totalQuestions}
                  </div>
                  <div className="text-gray-600">Correct Answers</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-gray-900">
                    {result.score >= 80 ? "🎉" : result.score >= 60 ? "👍" : "📚"}
                  </div>
                  <div className="text-gray-600">
                    {result.score >= 80 ? "Excellent!" : result.score >= 60 ? "Good Job!" : "Keep Learning!"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 mt-6">
                <Button onClick={() => router.push(`/dashboard/quizzes/${quiz.quizId}`)}>View Quiz Details</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>Review your answers and explanations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {result.detailedResults.map((detail, index) => {
                  const question = quiz.questions[detail.questionIndex]
                  return (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">Question {index + 1}</span>
                        <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        {detail.isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 mb-3">{question.questionText}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded text-sm ${
                              optionIndex === detail.correctOption
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : optionIndex === detail.selectedOption && !detail.isCorrect
                                  ? "bg-red-100 text-red-800 border border-red-300"
                                  : "bg-gray-50"
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
                            {optionIndex === detail.correctOption && " ✓"}
                            {optionIndex === detail.selectedOption && !detail.isCorrect && " ✗"}
                          </div>
                        ))}
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <h5 className="font-medium text-blue-900 mb-1">Explanation:</h5>
                        <MarkdownRenderer content={detail.explanation} className="text-blue-800 text-sm" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const currentQ = quiz.questions[currentQuestion]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quiz Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                {timeLeft !== null && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className={`font-mono ${timeLeft < 300 ? "text-red-600" : "text-gray-600"}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  {getAnsweredCount()}/{quiz.questions.length} answered
                </div>
              </div>
            </div>
            <Progress value={getProgressPercentage()} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Current Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="outline" className={getDifficultyColor(currentQ.difficulty)}>
                {currentQ.difficulty}
              </Badge>
              {currentQ.includesCalculation && <Badge variant="outline">Calculation</Badge>}
            </div>
            <CardTitle className="text-xl">{currentQ.questionText}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    answers[currentQuestion] === index
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestion] === index ? "border-primary bg-primary text-white" : "border-gray-300"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestion === 0}>
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {currentQuestion === quiz.questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Quiz"
                  )}
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} disabled={currentQuestion === quiz.questions.length - 1}>
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Navigator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-colors ${
                    index === currentQuestion
                      ? "border-primary bg-primary text-white"
                      : answers[index] !== undefined
                        ? "border-green-500 bg-green-100 text-green-700"
                        : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
