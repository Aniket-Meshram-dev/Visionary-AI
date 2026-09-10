import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { assets } from '../assets/assets'
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

export const AuthCard = ({ initialMode = 'sign-in', onSuccess }) => {
  const {
    signInWithPassword,
    signUpWithPassword,
    signInWithOAuth,
    authModalMode,
    setAuthModalMode,
  } = useAuth()

  const [mode, setMode] = useState(initialMode || authModalMode || 'sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode)
    }
  }, [authModalMode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)

    if (mode === 'sign-in') {
      const res = await signInWithPassword(email, password)
      if (res.success && onSuccess) onSuccess()
    } else {
      const res = await signUpWithPassword(email, password, fullName)
      if (res.success && onSuccess) onSuccess()
    }

    setLoading(false)
  }

  return (
    <div className='w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100'>
      {/* Ambient gradient top glow */}
      <div className='absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none' />

      {/* Brand Header */}
      <div className='text-center mb-6'>
        <div className='inline-flex items-center justify-center p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 mb-3 shadow-md'>
          <img src={assets.logoLight} alt='Visionary.ai' className='h-8 object-contain' />
        </div>
        <h2 className='text-xl sm:text-2xl font-bold tracking-tight text-white'>
          {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className='text-xs sm:text-sm text-slate-400 mt-1'>
          {mode === 'sign-in'
            ? 'Sign in to access your creations and AI suite'
            : 'Get started with 10 free generations instantly'}
        </p>
      </div>

      {/* Tab Selector */}
      <div className='grid grid-cols-2 p-1 bg-slate-800/80 border border-slate-700/80 rounded-xl mb-5'>
        <button
          type='button'
          onClick={() => {
            setMode('sign-in')
            if (setAuthModalMode) setAuthModalMode('sign-in')
          }}
          className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'sign-in'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type='button'
          onClick={() => {
            setMode('sign-up')
            if (setAuthModalMode) setAuthModalMode('sign-up')
          }}
          className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'sign-up'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Social Logins */}
      <button
        type='button'
        onClick={() => signInWithOAuth('google')}
        className='w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-xs sm:text-sm transition-all shadow-xs cursor-pointer hover:border-white/20'
      >
        <svg className='w-4 h-4' viewBox='0 0 24 24'>
          <path
            fill='#4285F4'
            d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
          />
          <path
            fill='#34A853'
            d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
          />
          <path
            fill='#FBBC05'
            d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
          />
          <path
            fill='#EA4335'
            d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
          />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className='relative flex items-center justify-center my-5'>
        <div className='border-t border-slate-700/80 w-full' />
        <span className='bg-slate-900 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider relative'>
          Or with email
        </span>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className='space-y-3.5'>
        {mode === 'sign-up' && (
          <div>
            <label className='block text-xs font-medium text-slate-300 mb-1.5'>
              Full Name
            </label>
            <div className='relative'>
              <User className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
              <input
                type='text'
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='Alex Morgan'
                className='w-full bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-hidden transition'
              />
            </div>
          </div>
        )}

        <div>
          <label className='block text-xs font-medium text-slate-300 mb-1.5'>
            Email Address
          </label>
          <div className='relative'>
            <Mail className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='alex@example.com'
              className='w-full bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-hidden transition'
            />
          </div>
        </div>

        <div>
          <div className='flex items-center justify-between mb-1.5'>
            <label className='block text-xs font-medium text-slate-300'>
              Password
            </label>
            {mode === 'sign-in' && (
              <span className='text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer'>
                Forgot password?
              </span>
            )}
          </div>
          <div className='relative'>
            <Lock className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              className='w-full bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-hidden transition'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition'
            >
              {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
            </button>
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50'
        >
          {loading ? (
            <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
          ) : (
            <>
              {mode === 'sign-in' ? 'Sign In to Account' : 'Create Free Account'}
              <ArrowRight className='w-4 h-4' />
            </>
          )}
        </button>
      </form>

      {/* Security badge */}
      <div className='mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center'>
        <ShieldCheck className='w-3.5 h-3.5 text-emerald-400' />
        <span>End-to-End Encrypted Authentication powered by Supabase</span>
      </div>
    </div>
  )
}

const AuthModal = () => {
  const { isSignInOpen, closeSignIn } = useAuth()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSignIn()
    }
    if (isSignInOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isSignInOpen, closeSignIn])

  if (!isSignInOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200'>
      <div
        className='fixed inset-0'
        onClick={closeSignIn}
        aria-label='Close background'
      />
      <div className='relative z-10 w-full max-w-md'>
        <button
          onClick={closeSignIn}
          className='absolute -top-3 -right-3 z-20 p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition shadow-lg cursor-pointer'
          aria-label='Close Modal'
        >
          <X className='w-4 h-4' />
        </button>
        <AuthCard onSuccess={closeSignIn} />
      </div>
    </div>
  )
}

export default AuthModal
