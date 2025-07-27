'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectUser } from '@/lib/redux/slices/currentUserSlice'

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const pathname = usePathname()
  const currentUser = useSelector(selectUser)
  
  useEffect(() => {
    // On autorise l'accès à /login et /signup sans redirection
    if (!currentUser && pathname !== '/login' && pathname !== '/signup') {
      router.replace('/login')
    }
  }, [currentUser, pathname, router])

  return <>{children}</>
}
