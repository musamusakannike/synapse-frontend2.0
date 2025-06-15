"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function Providers({ children }: { children: React.ReactNode }) {
  const { initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
