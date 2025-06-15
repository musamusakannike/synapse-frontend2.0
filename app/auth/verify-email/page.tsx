"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { CheckCircle, XCircle, Brain } from "lucide-react"

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const { verifyEmail } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setVerificationStatus("error")
      setErrorMessage("Invalid verification link")
      return
    }

    const handleVerification = async () => {
      try {
        const success = await verifyEmail(token)
        if (success) {
          setVerificationStatus("success")
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        } else {
          setVerificationStatus("error")
          setErrorMessage("Verification failed")
        }
      } catch (error) {
        setVerificationStatus("error")
        setErrorMessage("An error occurred during verification")
      }
    }

    handleVerification()
  }, [searchParams, verifyEmail, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Synapse AI</span>
          </div>

          {verificationStatus === "loading" && (
            <>
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <CardTitle>Verifying Email</CardTitle>
              <CardDescription>Please wait while we verify your email address...</CardDescription>
            </>
          )}

          {verificationStatus === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle>Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. You will be redirected to your dashboard shortly.
              </CardDescription>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>{errorMessage || "We could not verify your email address."}</CardDescription>
            </>
          )}
        </CardHeader>

        {verificationStatus === "error" && (
          <CardContent>
            <div className="space-y-4">
              <Link href="/auth/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full">
                  Create New Account
                </Button>
              </Link>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
