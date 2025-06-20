"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app"
import { chatsApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate, truncateText } from "@/lib/utils"
import { MessageSquare, Plus, Trash2, Brain, FileText, Globe, User, Bot } from "lucide-react"
import toast from "react-hot-toast"

export default function ChatsPage() {
  const router = useRouter()
  const { chats, setChats, isLoadingChats, setLoadingChats } = useAppStore()
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async (page = 1) => {
    try {
      setLoadingChats(true)
      const response = await chatsApi.getAll({ page, limit: 12 })
      setChats(response.data.chats || [])
      setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 })
    } catch (error) {
      toast.error("Failed to fetch chats")
    } finally {
      setLoadingChats(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      await chatsApi.delete(id)
      toast.success("Chat deleted successfully")
      fetchChats()
    } catch (error) {
      toast.error("Failed to delete chat")
    }
  }

  const handleCreateChat = async () => {
    try {
      const response = await chatsApi.create("New Chat")
      router.push(`/dashboard/chats/${response.data.chat._id}`)
    } catch (error) {
      toast.error("Failed to create chat")
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "topic":
        return Brain
      case "document":
        return FileText
      case "website":
        return Globe
      default:
        return MessageSquare
    }
  }

  const getSourceColor = (type: string) => {
    switch (type) {
      case "topic":
        return "text-blue-600 bg-blue-100"
      case "document":
        return "text-green-600 bg-green-100"
      case "website":
        return "text-purple-600 bg-purple-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  if (isLoadingChats) {
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
            <h1 className="text-3xl font-bold text-gray-900">Chats</h1>
            <p className="text-gray-600 mt-1">Continue conversations with AI about your topics and documents</p>
          </div>
          <Button onClick={handleCreateChat}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chats Grid */}
        {chats.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No chats yet</CardTitle>
              <CardDescription className="mb-6">
                Start a conversation or create topics and documents to begin chatting
              </CardDescription>
              <Button onClick={handleCreateChat}>
                <Plus className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chats.map((chat) => {
                const SourceIcon = getSourceIcon(chat.type)
                return (
                  <Card key={chat.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2 line-clamp-2 flex items-center">
                            <SourceIcon className="h-5 w-5 mr-2 text-primary" />
                            {chat.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary" className={getSourceColor(chat.type)}>
                              {chat.type}
                            </Badge>
                            <span className="text-sm text-gray-500">{chat.messageCount} messages</span>
                          </div>
                        </div>
                      </div>
                      {chat.lastMessage && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            {chat.lastMessage.role === "user" ? (
                              <User className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Bot className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-xs text-gray-500 capitalize">{chat.lastMessage.role}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {truncateText(chat.lastMessage.content, 100)}
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>Last activity {formatDate(chat.lastActivity)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/dashboard/chats/${chat.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Continue
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(chat.id || chat._id, chat.title)}>
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
                    onClick={() => fetchChats(page)}
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
