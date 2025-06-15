"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/store/app"
import { topicsApi, documentsApi, quizzesApi, chatsApi, websitesApi } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate } from "@/lib/utils"
import { Brain, FileText, Trophy, MessageSquare, Globe, TrendingUp, Clock, Target } from "lucide-react"

export function DashboardOverview() {
  const [stats, setStats] = useState({
    topics: 0,
    documents: 0,
    quizzes: 0,
    chats: 0,
    websites: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { topics, documents, quizzes, chats, websites, setTopics, setDocuments, setQuizzes, setChats, setWebsites } =
    useAppStore()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        // Fetch all data in parallel
        const [topicsRes, documentsRes, quizzesRes, chatsRes, websitesRes] = await Promise.all([
          topicsApi.getAll({ limit: 5 }),
          documentsApi.getAll({ limit: 5 }),
          quizzesApi.getAll({ limit: 5 }),
          chatsApi.getAll({ limit: 5 }),
          websitesApi.getAll({ limit: 5 }),
        ])

        // Update store
        setTopics(topicsRes.data.topics || [])
        setDocuments(documentsRes.data.documents || [])
        setQuizzes(quizzesRes.data.quizzes || [])
        setChats(chatsRes.data.chats || [])
        setWebsites(websitesRes.data.websites || [])

        // Update stats
        setStats({
          topics: topicsRes.data.pagination?.total || 0,
          documents: documentsRes.data.pagination?.total || 0,
          quizzes: quizzesRes.data.pagination?.total || 0,
          chats: chatsRes.data.pagination?.total || 0,
          websites: websitesRes.data.pagination?.total || 0,
        })

        // Combine recent activity
        const activity = [
          ...topicsRes.data.topics.map((item: any) => ({
            type: "topic",
            title: item.title,
            date: item.createdAt,
            id: item.id,
          })),
          ...documentsRes.data.documents.map((item: any) => ({
            type: "document",
            title: item.originalName,
            date: item.createdAt,
            id: item.id,
          })),
          ...quizzesRes.data.quizzes.map((item: any) => ({
            type: "quiz",
            title: item.title,
            date: item.createdAt,
            id: item.id,
          })),
          ...websitesRes.data.websites.map((item: any) => ({
            type: "website",
            title: item.title || item.url,
            date: item.scrapedAt,
            id: item.id,
          })),
        ]

        // Sort by date and take the 5 most recent
        activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setRecentActivity(activity.slice(0, 5))
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [setTopics, setDocuments, setQuizzes, setChats, setWebsites])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      title: "Topics Explained",
      value: stats.topics,
      icon: Brain,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/dashboard/topics",
    },
    {
      title: "Documents Processed",
      value: stats.documents,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/dashboard/documents",
    },
    {
      title: "Quizzes Generated",
      value: stats.quizzes,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      href: "/dashboard/quizzes",
    },
    {
      title: "Active Chats",
      value: stats.chats,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/dashboard/chats",
    },
    {
      title: "Websites Analyzed",
      value: stats.websites,
      icon: Globe,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      href: "/dashboard/websites",
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "topic":
        return Brain
      case "document":
        return FileText
      case "quiz":
        return Trophy
      case "website":
        return Globe
      default:
        return Clock
    }
  }

  const getActivityHref = (type: string, id: string) => {
    switch (type) {
      case "topic":
        return `/dashboard/topics/${id}`
      case "document":
        return `/dashboard/documents/${id}`
      case "quiz":
        return `/dashboard/quizzes/${id}`
      case "website":
        return `/dashboard/websites/${id}`
      default:
        return "#"
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your learning journey today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>Get started with these common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/topics/new">
              <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                <Brain className="h-6 w-6" />
                <span>Explain Topic</span>
              </Button>
            </Link>
            <Link href="/dashboard/documents/upload">
              <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span>Upload Document</span>
              </Button>
            </Link>
            <Link href="/dashboard/websites/analyze">
              <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                <Globe className="h-6 w-6" />
                <span>Analyze Website</span>
              </Button>
            </Link>
            <Link href="/dashboard/chats/new">
              <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                <MessageSquare className="h-6 w-6" />
                <span>Start Chat</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Your latest learning activities</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">Start by creating a topic or uploading a document</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <Link
                    key={index}
                    href={getActivityHref(activity.type, activity.id)}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {activity.type} • {formatDate(activity.date)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
