"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { websitesApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Globe } from "lucide-react"
import toast from "react-hot-toast"

const websiteSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  prompt: z.string().min(1, "Analysis prompt is required"),
})

type WebsiteForm = z.infer<typeof websiteSchema>

export default function AnalyzeWebsitePage() {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WebsiteForm>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      prompt:
        "Please provide a comprehensive analysis and summary of this website's content, including key topics, main points, and insights.",
    },
  })

  const watchedUrl = watch("url")

  const onSubmit = async (data: WebsiteForm) => {
    try {
      setIsAnalyzing(true)
      const response = await websitesApi.process(data.url, data.prompt)
      toast.success("Website analysis started!")
      router.push(`/dashboard/websites/${response.data.website.id}`)
    } catch (error) {
      toast.error("Failed to analyze website")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUrlChange = (url: string) => {
    setValue("url", url)

    // Auto-generate a more specific prompt based on the URL
    if (url) {
      try {
        const domain = new URL(url).hostname
        const specificPrompt = `Please analyze the content from ${domain} and provide insights about the main topics, key information, and important details covered on this website.`
        setValue("prompt", specificPrompt)
      } catch (error) {
        // Invalid URL, keep default prompt
      }
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
            <h1 className="text-3xl font-bold text-gray-900">Analyze Website</h1>
            <p className="text-gray-600 mt-1">Extract insights from any website using AI</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Website Analysis
            </CardTitle>
            <CardDescription>Enter a website URL and specify what you'd like to learn from it</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* URL Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Website URL</label>
                <Input
                  placeholder="https://example.com"
                  {...register("url")}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={errors.url ? "border-red-500" : ""}
                  disabled={isAnalyzing}
                />
                {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url.message}</p>}
                <p className="text-xs text-gray-500 mt-1">Enter the full URL including https://</p>
              </div>

              {/* Analysis Prompt */}
              <div>
                <label className="text-sm font-medium mb-2 block">Analysis Prompt</label>
                <Textarea
                  placeholder="What would you like to know about this website?"
                  {...register("prompt")}
                  rows={4}
                  className={errors.prompt ? "border-red-500" : ""}
                  disabled={isAnalyzing}
                />
                {errors.prompt && <p className="text-sm text-red-500 mt-1">{errors.prompt.message}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Describe what kind of analysis or information you want from the website
                </p>
              </div>

              {/* URL Preview */}
              {watchedUrl && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">URL Preview:</h4>
                  <p className="text-sm text-gray-600 break-all">{watchedUrl}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-4">
                <Button variant="outline" onClick={() => router.back()} disabled={isAnalyzing}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Website"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Website Analysis Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• AI extracts and analyzes the main content from the website</li>
              <li>• Generates comprehensive summaries and insights</li>
              <li>• Creates interactive Q&A sessions about the content</li>
              <li>• Enables quiz generation from website material</li>
              <li>• Maintains chat history for continued learning</li>
              <li>• Works with most public websites and articles</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
