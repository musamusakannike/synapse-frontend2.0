"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { chatsApi } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { formatDate } from "@/lib/utils"
import { ArrowLeft, Send, User, Bot, Trash2, Edit2, MessageSquare } from "lucide-react"
import toast from "react-hot-toast"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
  metadata?: any
}

interface Chat {
  _id: string
  title: string
  type: "topic" | "document" | "website" | "general"
  sourceId?: string
  sourceModel?: string
  messages: Message[]
  lastActivity: string
  createdAt: string
}

export default function ChatDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [chat, setChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (params.id) {
      fetchChat()
    }
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [chat?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChat = async () => {
    try {
      setIsLoading(true)
      const response = await chatsApi.getById(params.id as string)
      setChat(response.data.chat)
      setNewTitle(response.data.chat.title)
    } catch (error) {
      toast.error("Failed to fetch chat")
      router.push("/dashboard/chats")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chat || !message.trim()) return

    const userMessage = message.trim()
    setMessage("")

    try {
      setIsSending(true)

      // Optimistically add user message
      const tempUserMessage: Message = {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      }

      setChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, tempUserMessage],
            }
          : null,
      )

      const response = await chatsApi.sendMessage(chat._id, userMessage)

      // Replace with actual response
      setChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages.slice(0, -1), // Remove temp message
                response.data.userMessage,
                response.data.aiResponse,
              ],
            }
          : null,
      )

      toast.success("Message sent!")
    } catch (error) {
      toast.error("Failed to send message")
      // Remove the optimistic message on error
      setChat((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.slice(0, -1),
            }
          : null,
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleUpdateTitle = async () => {
    if (!chat || !newTitle.trim()) return

    try {
      await chatsApi.updateTitle(chat._id, newTitle.trim())
      setChat((prev) => (prev ? { ...prev, title: newTitle.trim() } : null))
      setIsEditingTitle(false)
      toast.success("Title updated!")
    } catch (error) {
      toast.error("Failed to update title")
    }
  }

  const handleClearMessages = async () => {
    if (!chat || !confirm("Are you sure you want to clear all messages?")) return

    try {
      await chatsApi.clearMessages(chat._id)
      setChat((prev) => (prev ? { ...prev, messages: [] } : null))
      toast.success("Messages cleared!")
    } catch (error) {
      toast.error("Failed to clear messages")
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!chat) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Chat not found</h3>
          <Button onClick={() => router.push("/dashboard/chats")}>Back to Chats</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        {/* Header */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  {isEditingTitle ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleUpdateTitle()}
                        className="text-lg font-semibold"
                      />
                      <Button size="sm" onClick={handleUpdateTitle}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingTitle(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-gray-900">{chat.title}</h1>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditingTitle(true)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className={getSourceColor(chat.type)}>
                      {chat.type}
                    </Badge>
                    <span className="text-sm text-gray-500">{chat.messages.length} messages</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">Created {formatDate(chat.createdAt)}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={handleClearMessages}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {chat.messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600">Start the conversation by sending a message below</p>
              </div>
            ) : (
              chat.messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      <span className="text-xs opacity-75 capitalize">{msg.role}</span>
                      <span className="text-xs opacity-75">{formatDate(msg.timestamp)}</span>
                    </div>
                    {msg.role === "assistant" ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <LoadingSpinner size="sm" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                disabled={isSending}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!message.trim() || isSending}>
                {isSending ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
