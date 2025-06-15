"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { topicsApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Plus, X } from "lucide-react"
import toast from "react-hot-toast"

const topicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  level: z.enum(["beginner", "intermediate", "expert"]),
  includeCalculations: z.boolean(),
  includePracticeQuestions: z.boolean(),
  includeExamples: z.boolean(),
  includeApplications: z.boolean(),
  additionalRequirements: z.string().optional(),
})

type TopicForm = z.infer<typeof topicSchema>

export default function NewTopicPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [newFocusArea, setNewFocusArea] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TopicForm>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      level: "intermediate",
      includeCalculations: false,
      includePracticeQuestions: false,
      includeExamples: true,
      includeApplications: false,
    },
  })

  const watchedLevel = watch("level")

  const onSubmit = async (data: TopicForm) => {
    try {
      setIsLoading(true)
      const response = await topicsApi.create({
        ...data,
        customizations: {
          level: data.level,
          includeCalculations: data.includeCalculations,
          includePracticeQuestions: data.includePracticeQuestions,
          includeExamples: data.includeExamples,
          includeApplications: data.includeApplications,
          focusAreas,
          additionalRequirements: data.additionalRequirements,
        },
      })

      toast.success("Topic created successfully!")
      router.push(`/dashboard/topics/${response.data.topic.id}`)
    } catch (error) {
      toast.error("Failed to create topic")
    } finally {
      setIsLoading(false)
    }
  }

  const addFocusArea = () => {
    if (newFocusArea.trim() && !focusAreas.includes(newFocusArea.trim())) {
      setFocusAreas([...focusAreas, newFocusArea.trim()])
      setNewFocusArea("")
    }
  }

  const removeFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter((a) => a !== area))
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Topic</h1>
            <p className="text-gray-600 mt-1">Get AI-powered explanations tailored to your needs</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Topic Details</CardTitle>
            <CardDescription>Provide information about the topic you want to learn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    placeholder="e.g., Machine Learning Fundamentals"
                    {...register("title")}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                  <Input placeholder="Brief description of what you want to learn" {...register("description")} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    placeholder="Describe what you want to learn about this topic in detail..."
                    rows={4}
                    {...register("content")}
                    className={errors.content ? "border-red-500" : ""}
                  />
                  {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>}
                </div>
              </div>

              {/* Customization Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customization Options</h3>

                <div>
                  <label className="text-sm font-medium mb-2 block">Learning Level</label>
                  <Select value={watchedLevel} onValueChange={(value) => setValue("level", value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Include in Explanation</label>
                  <div className="space-y-2">
                    {[
                      { key: "includeCalculations", label: "Mathematical calculations and formulas" },
                      { key: "includePracticeQuestions", label: "Practice questions and exercises" },
                      { key: "includeExamples", label: "Real-world examples" },
                      { key: "includeApplications", label: "Practical applications" },
                    ].map((option) => (
                      <div key={option.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.key}
                          {...register(option.key as keyof TopicForm)}
                          onCheckedChange={(checked) => setValue(option.key as keyof TopicForm, checked as boolean)}
                        />
                        <label htmlFor={option.key} className="text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Focus Areas</label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      placeholder="Add a specific area to focus on"
                      value={newFocusArea}
                      onChange={(e) => setNewFocusArea(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFocusArea())}
                    />
                    <Button type="button" variant="outline" onClick={addFocusArea}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {focusAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {focusAreas.map((area) => (
                        <div
                          key={area}
                          className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                        >
                          <span>{area}</span>
                          <button
                            type="button"
                            onClick={() => removeFocusArea(area)}
                            className="text-primary hover:text-primary/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Additional Requirements</label>
                  <Textarea
                    placeholder="Any specific requirements or preferences for the explanation..."
                    rows={3}
                    {...register("additionalRequirements")}
                  />
                </div>
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
                      Creating...
                    </>
                  ) : (
                    "Create Topic"
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
