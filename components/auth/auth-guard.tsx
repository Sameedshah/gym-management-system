'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageLoading } from '@/components/ui/loading'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, userId, orgId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in')
    } else if (isLoaded && userId && !orgId) {
      router.push('/onboarding')
    }
  }, [isLoaded, userId, orgId, router])

  if (!isLoaded) {
    return <PageLoading />
  }

  if (!userId) {
    return null // Will redirect to sign-in
  }

  return <>{children}</>
}