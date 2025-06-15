import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "@/lib/api"
import { toast } from "react-hot-toast"

interface User {
  id: string
  email: string
  isEmailVerified: boolean
  createdAt: string
  lastLogin?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => void
  verifyEmail: (token: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, password: string) => Promise<boolean>
  initialize: () => Promise<void>
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          const response = await api.post("/auth/login", { email, password })
          const { token, user } = response.data

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })

          // Set token for future requests
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          toast.success("Login successful!")
          return true
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.response?.data?.error || "Login failed")
          return false
        }
      },

      register: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          await api.post("/auth/register", { email, password })
          set({ isLoading: false })
          toast.success("Registration successful! Please check your email to verify your account.")
          return true
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.response?.data?.error || "Registration failed")
          return false
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        delete api.defaults.headers.common["Authorization"]
        toast.success("Logged out successfully")
      },

      verifyEmail: async (token: string) => {
        try {
          set({ isLoading: true })
          const response = await api.post("/auth/verify-email", { token })
          const { token: authToken, user } = response.data

          set({
            user,
            token: authToken,
            isAuthenticated: true,
            isLoading: false,
          })

          api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`
          toast.success("Email verified successfully!")
          return true
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.response?.data?.error || "Email verification failed")
          return false
        }
      },

      forgotPassword: async (email: string) => {
        try {
          await api.post("/auth/forgot-password", { email })
          toast.success("Password reset link sent to your email")
          return true
        } catch (error: any) {
          toast.error(error.response?.data?.error || "Failed to send reset email")
          return false
        }
      },

      resetPassword: async (token: string, password: string) => {
        try {
          await api.post("/auth/reset-password", { token, password })
          toast.success("Password reset successful! Please login with your new password.")
          return true
        } catch (error: any) {
          toast.error(error.response?.data?.error || "Password reset failed")
          return false
        }
      },

      initialize: async () => {
        const { token } = get()
        if (token) {
          try {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`
            const response = await api.get("/auth/me")
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            })
          } catch (error) {
            // Token is invalid, clear auth state
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            })
            delete api.defaults.headers.common["Authorization"]
          }
        } else {
          set({ isLoading: false })
        }
      },

      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
)
