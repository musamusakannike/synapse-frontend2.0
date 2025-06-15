"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app"
import { topicsApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate, getDifficultyColor } from "@/lib/utils"
import { Brain, Plus, Eye, Trash2, MessageSquare, Trophy } from "lucide-react"
import toast from "react-hot-toast"

export default function TopicsPage() {
  const router = useRouter()
  const { topics, setTopics, isLoadingTopics, setLoadingTopics } = useAppStore()
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async (page = 1) => {
    try {
      setLoadingTopics(true)
      const response = await topicsApi.getAll({ page, limit: 12 })
      setTopics(response.data.topics || [])
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 })
    } catch (error) {
      toast.error("Failed to fetch topics")
    } finally {
      setLoadingTopics(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      await topicsApi.delete(id)
      toast.success("Topic deleted successfully")
      fetchTopics()
    } catch (error) {
      toast.error("Failed to delete topic")
    }
  }

  if (isLoadingTopics) {
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
            <h1 className="text-3xl font-bold text-gray-900">Topics</h1>
            <p className="text-gray-600 mt-1">AI-powered explanations tailored to your learning level</p>
          </div>
          <Link href="/dashboard/topics/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Topic
            </Button>
          </Link>
        </div>

        {/* Topics Grid */}
        {topics.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No topics yet</CardTitle>
              <CardDescription className="mb-6">Create your first topic to get AI-powered explanations</CardDescription>
              <Link href="/dashboard/topics/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Topic
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => (
                <Card key={topic._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 line-clamp-2">{topic.title}</CardTitle>
                        {topic.description && (
                          <CardDescription className="line-clamp-2">{topic.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className={getDifficultyColor(topic.customizations.level)}>
                        {topic.customizations.level}
                      </Badge>
                      {topic.customizations.includeCalculations && <Badge variant="outline">Calculations</Badge>}
                      {topic.customizations.includePracticeQuestions && <Badge variant="outline">Practice</Badge>}
                      {topic.customizations.includeExamples && <Badge variant="outline">Examples</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Created {formatDate(topic.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/dashboard/topics/${topic._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      {topic.chatId && (
                        <Link href={`/dashboard/chats/${topic.chatId}`}>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/quizzes/new?topicId=${topic._id}`)}
                      >
                        <Trophy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(topic._id, topic.title)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === pagination.current ? "default" : "outline"}
                    size="sm"
                    onClick={() => fetchTopics(page)}
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
