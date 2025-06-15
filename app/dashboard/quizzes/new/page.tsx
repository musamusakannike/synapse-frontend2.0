"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { topicsApi, documentsApi, websitesApi, quizzesApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Brain, FileText, Globe } from "lucide-react"
import toast from "react-hot-toast"

const quizSchema = z.object({
  sourceType: z.enum(["topic", "document", "website"]),
  sourceId: z.string().min(1, "Please select a source"),
  numberOfQuestions: z.number().min(1).max(50),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  includeCalculations: z.boolean(),
  timeLimit: z.number().optional(),
})

type QuizForm = z.infer<typeof quizSchema>

export default function NewQuizPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [sources, setSources] = useState<any[]>([])
  const [loadingSources, setLoadingSources] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<QuizForm>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      sourceType: "topic",
      numberOfQuestions: 10,
      difficulty: "mixed",
      includeCalculations: false,
    },
  })

  const watchedSourceType = watch("sourceType")
  const watchedSourceId = watch("sourceId")

  useEffect(() => {
    // Check for pre-selected source from URL params
    const topicId = searchParams.get("topicId")
    const documentId = searchParams.get("documentId")
    const websiteId = searchParams.get("websiteId")

    if (topicId) {
      setValue("sourceType", "topic")
      setValue("sourceId", topicId)
    } else if (documentId) {
      setValue("sourceType", "document")
      setValue("sourceId", documentId)
    } else if (websiteId) {
      setValue("sourceType", "website")
      setValue("sourceId", websiteId)
    }
  }, [searchParams, setValue])

  useEffect(() => {
    fetchSources()
  }, [watchedSourceType])

  const fetchSources = async () => {
    try {
      setLoadingSources(true)
      let response

      switch (watchedSourceType) {
        case "topic":
          response = await topicsApi.getAll({ limit: 100 })
          setSources(response.data.topics || [])
          break
        case "document":
          response = await documentsApi.getAll({ limit: 100 })
          setSources((response.data.documents || []).filter((doc: any) => doc.processingStatus === "completed"))
          break
        case "website":
          response = await websitesApi.getAll({ limit: 100 })
          setSources((response.data.websites || []).filter((site: any) => site.processingStatus === "completed"))
          break
      }
    } catch (error) {
      toast.error("Failed to fetch sources")
    } finally {
      setLoadingSources(false)
    }
  }

  const onSubmit = async (data: QuizForm) => {
    try {
      setIsLoading(true)
      let response

      const settings = {
        numberOfQuestions: data.numberOfQuestions,
        difficulty: data.difficulty,
        includeCalculations: data.includeCalculations,
        timeLimit: data.timeLimit,
      }

      switch (data.sourceType) {
        case "topic":
          response = await quizzesApi.fromTopic(data.sourceId, settings)
          break
        case "document":
          response = await quizzesApi.fromDocument(data.sourceId, settings)
          break
        case "website":
          response = await quizzesApi.fromWebsite(data.sourceId, settings)
          break
      }

      toast.success("Quiz generated successfully!")
      router.push(`/dashboard/quizzes/${response.data.quiz.id}`)
    } catch (error) {
      toast.error("Failed to generate quiz")
    } finally {
      setIsLoading(false)
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
        return Brain
    }
  }

  const getSourceName = (source: any, sourceType: string) => {
    switch (sourceType) {
      case "topic":
        return source.title
      case "document":
        return source.originalName
      case "website":
        return source.title || source.url
      default:
        return "Unknown"
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
            <h1 className="text-3xl font-bold text-gray-900">Generate Quiz</h1>
            <p className="text-gray-600 mt-1">Create a quiz from your topics, documents, or websites</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
            <CardDescription>Configure your quiz parameters and select a source</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Source Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Source Type</label>
                <Select value={watchedSourceType} onValueChange={(value) => setValue("sourceType", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topic">
                      <div className="flex items-center">
                        <Brain className="h-4 w-4 mr-2" />
                        Topic
                      </div>
                    </SelectItem>
                    <SelectItem value="document">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Document
                      </div>
                    </SelectItem>
                    <SelectItem value="website">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Source</label>
                {loadingSources ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <Select value={watchedSourceId} onValueChange={(value) => setValue("sourceId", value)}>
                    <SelectTrigger className={errors.sourceId ? "border-red-500" : ""}>
                      <SelectValue placeholder={`Select a ${watchedSourceType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => {
                        const Icon = getSourceIcon(watchedSourceType)
                        return (
                          <SelectItem key={source.id} value={source.id}>
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {getSourceName(source, watchedSourceType)}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
                {errors.sourceId && <p className="text-sm text-red-500 mt-1">{errors.sourceId.message}</p>}
              </div>

              {/* Quiz Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Number of Questions</label>
                  <Select
                    value={watch("numberOfQuestions")?.toString()}
                    onValueChange={(value) => setValue("numberOfQuestions", Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={watch("difficulty")} onValueChange={(value) => setValue("difficulty", value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Additional Options</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCalculations"
                    {...register("includeCalculations")}
                    onCheckedChange={(checked) => setValue("includeCalculations", checked as boolean)}
                  />
                  <label htmlFor="includeCalculations" className="text-sm text-gray-700">
                    Include mathematical calculations
                  </label>
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <label className="text-sm font-medium mb-2 block">Time Limit (Optional)</label>
                <Select
                  value={watch("timeLimit")?.toString() || ""}
                  onValueChange={(value) => setValue("timeLimit", value ? Number.parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No time limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-time-limit">No time limit</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate Quiz"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
