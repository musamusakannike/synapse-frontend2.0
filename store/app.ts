import { create } from "zustand"

interface Topic {
  _id: string
  title: string
  description?: string
  content: string
  customizations: {
    level: "beginner" | "intermediate" | "expert"
    includeCalculations: boolean
    includePracticeQuestions: boolean
    includeExamples: boolean
    includeApplications: boolean
    focusAreas: string[]
    additionalRequirements?: string
  }
  generatedContent?: string
  chatId?: string
  createdAt: string
}

interface Document {
  id: string
  originalName: string
  size: number
  summary?: string
  chatId?: string
  processingStatus: "pending" | "processing" | "completed" | "failed"
  createdAt: string
}

interface Quiz {
  id: string
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

interface Chat {
  id: string
  title: string
  type: "topic" | "document" | "website" | "general"
  sourceId?: string
  sourceModel?: string
  messageCount: number
  lastMessage?: {
    role: "user" | "assistant"
    content: string
    timestamp: string
  }
  lastActivity: string
  createdAt: string
}

interface Website {
  id: string
  url: string
  title?: string
  summary?: string
  chatId?: string
  processingStatus: "pending" | "processing" | "completed" | "failed"
  scrapedAt: string
}

interface AppState {
  // Data
  topics: Topic[]
  documents: Document[]
  quizzes: Quiz[]
  chats: Chat[]
  websites: Website[]

  // Loading states
  isLoadingTopics: boolean
  isLoadingDocuments: boolean
  isLoadingQuizzes: boolean
  isLoadingChats: boolean
  isLoadingWebsites: boolean

  // Actions
  setTopics: (topics: Topic[]) => void
  addTopic: (topic: Topic) => void
  updateTopic: (id: string, topic: Partial<Topic>) => void
  removeTopic: (id: string) => void

  setDocuments: (documents: Document[]) => void
  addDocument: (document: Document) => void
  updateDocument: (id: string, document: Partial<Document>) => void
  removeDocument: (id: string) => void

  setQuizzes: (quizzes: Quiz[]) => void
  addQuiz: (quiz: Quiz) => void
  removeQuiz: (id: string) => void

  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  updateChat: (id: string, chat: Partial<Chat>) => void
  removeChat: (id: string) => void

  setWebsites: (websites: Website[]) => void
  addWebsite: (website: Website) => void
  updateWebsite: (id: string, website: Partial<Website>) => void
  removeWebsite: (id: string) => void

  // Loading actions
  setLoadingTopics: (loading: boolean) => void
  setLoadingDocuments: (loading: boolean) => void
  setLoadingQuizzes: (loading: boolean) => void
  setLoadingChats: (loading: boolean) => void
  setLoadingWebsites: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  topics: [],
  documents: [],
  quizzes: [],
  chats: [],
  websites: [],

  isLoadingTopics: false,
  isLoadingDocuments: false,
  isLoadingQuizzes: false,
  isLoadingChats: false,
  isLoadingWebsites: false,

  // Topic actions
  setTopics: (topics) => set({ topics }),
  addTopic: (topic) => set((state) => ({ topics: [topic, ...state.topics] })),
  updateTopic: (id, updatedTopic) =>
    set((state) => ({
      topics: state.topics.map((topic) => (topic._id === id ? { ...topic, ...updatedTopic } : topic)),
    })),
  removeTopic: (id) =>
    set((state) => ({
      topics: state.topics.filter((topic) => topic._id !== id),
    })),

  // Document actions
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => set((state) => ({ documents: [document, ...state.documents] })),
  updateDocument: (id, updatedDocument) =>
    set((state) => ({
      documents: state.documents.map((doc) => (doc.id === id ? { ...doc, ...updatedDocument } : doc)),
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    })),

  // Quiz actions
  setQuizzes: (quizzes) => set({ quizzes }),
  addQuiz: (quiz) => set((state) => ({ quizzes: [quiz, ...state.quizzes] })),
  removeQuiz: (id) =>
    set((state) => ({
      quizzes: state.quizzes.filter((quiz) => quiz.id !== id),
    })),

  // Chat actions
  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  updateChat: (id, updatedChat) =>
    set((state) => ({
      chats: state.chats.map((chat) => (chat.id === id ? { ...chat, ...updatedChat } : chat)),
    })),
  removeChat: (id) =>
    set((state) => ({
      chats: state.chats.filter((chat) => chat.id !== id),
    })),

  // Website actions
  setWebsites: (websites) => set({ websites }),
  addWebsite: (website) => set((state) => ({ websites: [website, ...state.websites] })),
  updateWebsite: (id, updatedWebsite) =>
    set((state) => ({
      websites: state.websites.map((site) => (site.id === id ? { ...site, ...updatedWebsite } : site)),
    })),
  removeWebsite: (id) =>
    set((state) => ({
      websites: state.websites.filter((site) => site.id !== id),
    })),

  // Loading actions
  setLoadingTopics: (loading) => set({ isLoadingTopics: loading }),
  setLoadingDocuments: (loading) => set({ isLoadingDocuments: loading }),
  setLoadingQuizzes: (loading) => set({ isLoadingQuizzes: loading }),
  setLoadingChats: (loading) => set({ isLoadingChats: loading }),
  setLoadingWebsites: (loading) => set({ isLoadingWebsites: loading }),
}))
