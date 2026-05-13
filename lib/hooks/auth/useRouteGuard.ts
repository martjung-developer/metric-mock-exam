// lib/hooks/auth/useRouteGuard.ts
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/context/AuthContext'
import type { UserRole } from '@/lib/types/auth/'
import { getDashboardByRole } from '@/lib/types/auth'

interface UseRouteGuardOptions {
  allowedRoles?: UserRole[]
  redirectUnauthedTo?: string
  redirectUnauthorizedTo?: string
}

export interface UseRouteGuardResult {
  isReady: boolean
  authLoading: boolean
}

export function useRouteGuard(options: UseRouteGuardOptions = {}): UseRouteGuardResult {
  const {
    allowedRoles,
    redirectUnauthedTo      = '/login',
    redirectUnauthorizedTo  = '/unauthorized',
  } = options

  const router = useRouter()
  const { user, profile, loading: authLoading } = useUser()

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      router.replace(redirectUnauthedTo)
      return
    }

    if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
      if (profile) {
        router.replace(getDashboardByRole(profile.role))
        return
      }
      router.replace(redirectUnauthorizedTo)
    }
  }, [allowedRoles, authLoading, profile, redirectUnauthedTo, redirectUnauthorizedTo, router, user])

  const isReady =
    !authLoading &&
    !!user &&
    (!allowedRoles || (!!profile && allowedRoles.includes(profile.role)))

  return { isReady, authLoading }
}
