import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { supabase } from '../configs/supabase'
import toast from 'react-hot-toast'
import axios from 'axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('sign-in') // 'sign-in' | 'sign-up'

  // Format Supabase user into consistent user shape
  const formatUser = (sbUser) => {
    if (!sbUser) return null

    const meta = sbUser.user_metadata || {}
    const fullName =
      meta.full_name ||
      meta.name ||
      meta.fullName ||
      (sbUser.email ? sbUser.email.split('@')[0] : 'User')

    const avatarUrl =
      meta.avatar_url ||
      meta.picture ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        fullName
      )}&backgroundColor=4f46e5,7c3aed,06b6d4`

    const plan = meta.plan === 'premium' ? 'premium' : 'free'
    const usage = typeof meta.free_usage === 'number' ? meta.free_usage : 0

    return {
      id: sbUser.id,
      email: sbUser.email,
      fullName,
      imageUrl: avatarUrl,
      plan,
      usage,
      user_metadata: meta,
      // Compatibility with previous Clerk publicMetadata shape:
      publicMetadata: {
        plan,
        usage,
      },
      // Reload function
      reload: async () => {
        const { data, error } = await supabase.auth.getUser()
        if (!error && data?.user) {
          setUser(formatUser(data.user))
        }
      },
    }
  }

  // Initial session load & auth listener
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted) {
          setSession(initialSession)
          setUser(formatUser(initialSession?.user || null))
          setLoading(false)
        }
      } catch (err) {
        console.error('Error initializing Supabase session:', err)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setUser(formatUser(newSession?.user || null))
      setLoading(false)

      if (event === 'SIGNED_IN') {
        setIsSignInOpen(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Retrieve valid access token (auto-refreshes session if expired)
  const getToken = async () => {
    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession()

      if (error || !currentSession) {
        return null
      }
      return currentSession.access_token
    } catch (err) {
      console.error('Failed to get Supabase auth token:', err)
      return null
    }
  }

  // Sign In with Email & Password
  const signInWithPassword = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Welcome back!')
      setIsSignInOpen(false)
      return { success: true, data }
    } catch (error) {
      const msg = error.message || 'Failed to sign in'
      toast.error(msg)
      return { success: false, message: msg }
    }
  }

  // Sign Up with Email, Password & Full Name
  const signUpWithPassword = async (email, password, fullName = '') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            plan: 'free',
            free_usage: 0,
          },
        },
      })

      if (error) throw error

      if (data.session) {
        toast.success('Account created successfully! Welcome to Visionary.ai')
        setIsSignInOpen(false)
      } else {
        toast.success('Registration successful! Please check your email inbox to verify your account.')
      }

      return { success: true, data }
    } catch (error) {
      const msg = error.message || 'Failed to sign up'
      toast.error(msg)
      return { success: false, message: msg }
    }
  }

  // Sign In with OAuth (Google, GitHub)
  const signInWithOAuth = async (provider = 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/ai`,
        },
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      const msg = error.message || `Failed to sign in with ${provider}`
      toast.error(msg)
      return { success: false, message: msg }
    }
  }

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      toast.success('Signed out safely')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error(error.message || 'Error signing out')
    }
  }

  // Upgrade user plan to Pro
  const upgradeToPro = async () => {
    try {
      const token = await getToken()
      if (!token) {
        openSignIn('sign-in')
        return false
      }

      const { data } = await axios.post(
        `${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/api/user/upgrade-plan`,
        { plan: 'premium' },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success('Congratulations! You are now a Pro Member with Unlimited Access ⚡')
        if (user?.reload) {
          await user.reload()
        }
        return true
      } else {
        toast.error(data.message || 'Upgrade failed')
        return false
      }
    } catch (err) {
      console.error('Upgrade plan error:', err)
      toast.error(err.message || 'Failed to upgrade plan')
      return false
    }
  }

  const openSignIn = (mode = 'sign-in') => {
    setAuthModalMode(mode)
    setIsSignInOpen(true)
  }

  const closeSignIn = () => {
    setIsSignInOpen(false)
  }

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isSignedIn: !!user,
      isSignInOpen,
      authModalMode,
      openSignIn,
      closeSignIn,
      setAuthModalMode,
      signInWithPassword,
      signUpWithPassword,
      signInWithOAuth,
      signOut,
      getToken,
      upgradeToPro,
      plan: user?.plan || 'free',
      usage: user?.usage || 0,
    }),
    [user, session, loading, isSignInOpen, authModalMode]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook: useAuth
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook: useUser (Drop-in compatibility with previous Clerk calls)
export const useUser = () => {
  const { user, isSignedIn, loading } = useAuth()
  return {
    user,
    isSignedIn,
    isLoaded: !loading,
  }
}

// Hook: useClerk (Drop-in compatibility with previous Clerk calls)
export const useClerk = () => {
  const { openSignIn, closeSignIn, signOut } = useAuth()
  return {
    openSignIn,
    closeSignIn,
    signOut,
    openUserProfile: () => openSignIn('sign-in'),
  }
}

// Component: Protect (Drop-in compatibility with Clerk <Protect plan="premium" fallback={...}>)
export const Protect = ({ plan, fallback = null, children }) => {
  const { user, loading } = useAuth()

  if (loading) return null

  if (plan === 'premium') {
    if (user?.plan === 'premium') {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}
