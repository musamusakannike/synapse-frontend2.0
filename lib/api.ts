import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Token will be set by auth store
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // This will be handled by the auth store
    }
    return Promise.reject(error)
  },
)

// API functions
export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (email: string, password: string) => api.post("/auth/register", { email, password }),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) => api.post("/auth/reset-password", { token, password }),
  getMe: () => api.get("/auth/me"),
}

export const topicsApi = {
  create: (data: any) => api.post("/topics", data),
  getAll: (params?: any) => api.get("/topics", { params }),
  getById: (id: string) => api.get(`/topics/${id}`),
  update: (id: string, data: any) => api.put(`/topics/${id}`, data),
  delete: (id: string) => api.delete(`/topics/${id}`),
}

export const documentsApi = {
  upload: (formData: FormData) =>
    api.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: (params?: any) => api.get("/documents", { params }),
  getById: (id: string) => api.get(`/documents/${id}`),
  ask: (id: string, question: string) => api.post(`/documents/${id}/ask`, { question }),
  delete: (id: string) => api.delete(`/documents/${id}`),
}

export const quizzesApi = {
  fromTopic: (topicId: string, settings: any) => api.post(`/quizzes/from-topic/${topicId}`, { settings }),
  fromDocument: (documentId: string, settings: any) => api.post(`/quizzes/from-document/${documentId}`, { settings }),
  fromWebsite: (websiteId: string, settings: any) => api.post(`/quizzes/from-website/${websiteId}`, { settings }),
  getAll: (params?: any) => api.get("/quizzes", { params }),
  getById: (id: string) => api.get(`/quizzes/${id}`),
  start: (id: string) => api.post(`/quizzes/${id}/start`),
  submit: (id: string, answers: any[]) => api.post(`/quizzes/${id}/submit`, { answers }),
  getAttempts: (id: string) => api.get(`/quizzes/${id}/attempts`),
  delete: (id: string) => api.delete(`/quizzes/${id}`),
}

export const chatsApi = {
  getAll: (params?: any) => api.get("/chats", { params }),
  getById: (id: string) => api.get(`/chats/${id}`),
  sendMessage: (id: string, content: string) => api.post(`/chats/${id}/message`, { content }),
  create: (title?: string) => api.post("/chats/new", { title }),
  updateTitle: (id: string, title: string) => api.put(`/chats/${id}/title`, { title }),
  delete: (id: string) => api.delete(`/chats/${id}`),
  clearMessages: (id: string) => api.delete(`/chats/${id}/messages`),
}

export const websitesApi = {
  process: (url: string, prompt?: string) => api.post("/websites/process", { url, prompt }),
  getAll: (params?: any) => api.get("/websites", { params }),
  getById: (id: string) => api.get(`/websites/${id}`),
  ask: (id: string, question: string) => api.post(`/websites/${id}/ask`, { question }),
  delete: (id: string) => api.delete(`/websites/${id}`),
}
