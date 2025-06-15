"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app"
import { websitesApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate } from "@/lib/utils"
import { Globe, Plus, Eye, Trash2, MessageSquare, Trophy, Clock, CheckCircle, XCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function WebsitesPage() {
  const router = useRouter()
  const { websites, setWebsites, isLoadingWebsites, setLoadingWebsites } = useAppStore()
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })

  useEffect(() => {
    fetchWebsites()
  }, [])

  const fetchWebsites = async (page = 1) => {
    try {
      setLoadingWebsites(true)
      const response = await websitesApi.getAll({ page, limit: 12 })
      setWebsites(response.data.websites || [])
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 })
    } catch (error) {
      toast.error("Failed to fetch websites")
    } finally {
      setLoadingWebsites(false)
    }
  }

  const handleDelete = async (id: string, url: string) => {
    if (!confirm(`Are you sure you want to delete "${url}"?`)) return

    try {
      await websitesApi.delete(id)
      toast.success("Website deleted successfully")
      fetchWebsites()
    } catch (error) {
      toast.error("Failed to delete website")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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

  if (isLoadingWebsites) {
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
            <h1 className="text-3xl font-bold text-gray-900">Websites</h1>
            <p className="text-gray-600 mt-1">Analyze website content with AI-powered insights</p>
          </div>
          <Link href="/dashboard/websites/analyze">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Analyze Website
            </Button>
          </Link>
        </div>

        {/* Websites Grid */}
        {websites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No websites yet</CardTitle>
              <CardDescription className="mb-6">Analyze your first website to get AI-powered insights</CardDescription>
              <Link href="/dashboard/websites/analyze">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Analyze Website
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.map((website) => (
                <Card key={website._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 line-clamp-2 flex items-center">
                          <Globe className="h-5 w-5 mr-2 text-primary" />
                          {website.title || "Untitled Website"}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{website.url}</p>
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusIcon(website.processingStatus)}
                          <Badge variant="secondary" className={getStatusColor(website.processingStatus)}>
                            {website.processingStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Analyzed {formatDate(website.scrapedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/dashboard/websites/${website._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      {website.chatId && (
                        <Link href={`/dashboard/chats/${website.chatId}`}>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      {website.processingStatus === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/quizzes/new?websiteId=${website._id}`)}
                        >
                          <Trophy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDelete(website._id, website.url)}>
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
                    onClick={() => fetchWebsites(page)}
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
