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
  Zap,
} from 'lucide-react'

export const AuthCard = ({ initialMode = 'sign-in', onSuccess, onClose }) => {
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

  const switchMode = (newMode) => {
    setMode(newMode)
    if (setAuthModalMode) setAuthModalMode(newMode)
  }

  return (
    <div className='w-full max-w-[440px] bg-[#0B0F19]/95 backdrop-blur-2xl border border-white/12 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(124,58,237,0.18)] relative overflow-hidden text-white'>
      {/* Radiant ambient glow spheres */}
      <div className='absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-violet-600/30 to-indigo-600/0 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-fuchsia-600/20 to-purple-600/0 rounded-full blur-3xl pointer-events-none' />

      {/* Top Close Button (if onClose provided) */}
      {onClose && (
        <button
          type='button'
          onClick={onClose}
          className='absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all duration-200 cursor-pointer'
          aria-label='Close modal'
        >
          <X className='w-4 h-4' />
        </button>
      )}

      {/* Brand Header */}
      <div className='text-center mb-6'>
        <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3 shadow-inner'>
          <Sparkles className='w-3.5 h-3.5 text-violet-400' />
          <span>Visionary.ai Cloud Suite</span>
        </div>
        <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-white'>
          {mode === 'sign-in' ? 'Welcome Back' : 'Create Free Account'}
        </h2>
        <p className='text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xs mx-auto'>
          {mode === 'sign-in'
            ? 'Sign in to access your AI studio, creations, and dashboard'
            : 'Get instant access with 10 free AI generations across all tools'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className='grid grid-cols-2 p-1.5 bg-[#121826] border border-white/10 rounded-2xl mb-5 shadow-inner'>
        <button
          type='button'
          onClick={() => switchMode('sign-in')}
          className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
            mode === 'sign-in'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type='button'
          onClick={() => switchMode('sign-up')}
          className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
            mode === 'sign-up'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Social Google OAuth Button */}
      <div>
        <button
          type='button'
          onClick={() => signInWithOAuth('google')}
          className='w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-sm cursor-pointer group'
        >
          <svg className='w-4 h-4 transition-transform group-hover:scale-110' viewBox='0 0 24 24'>
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
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Visual Divider */}
      <div className='relative flex items-center justify-center my-5'>
        <div className='border-t border-white/10 w-full' />
        <span className='bg-[#0B0F19] px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest relative'>
          Or with Email & Password
        </span>
      </div>

      {/* Auth Credentials Form */}
      <form onSubmit={handleSubmit} className='space-y-4'>
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
                placeholder='e.g. Alex Morgan'
                className='w-full bg-[#121826]/90 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-hidden transition shadow-inner'
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
              placeholder='you@domain.com'
              className='w-full bg-[#121826]/90 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-hidden transition shadow-inner'
            />
          </div>
        </div>

        <div>
          <div className='flex items-center justify-between mb-1.5'>
            <label className='block text-xs font-medium text-slate-300'>
              Password
            </label>
            {mode === 'sign-in' && (
              <span
                onClick={() => {
                  switchMode('sign-up')
                }}
                className='text-[11px] text-violet-400 hover:text-violet-300 cursor-pointer transition'
              >
                Need an account?
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
              className='w-full bg-[#121826]/90 border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-hidden transition shadow-inner'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
            </button>
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.99]'
        >
          {loading ? (
            <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
          ) : (
            <>
              <span>{mode === 'sign-in' ? 'Sign In to Account' : 'Create Free Account'}</span>
              <ArrowRight className='w-4 h-4' />
            </>
          )}
        </button>
      </form>

      {/* Mode toggle prompt */}
      <div className='mt-5 text-center'>
        <button
          type='button'
          onClick={() => switchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className='text-xs text-slate-400 hover:text-white transition cursor-pointer'
        >
          {mode === 'sign-in' ? (
            <>
              Don't have an account?{' '}
              <span className='text-violet-400 font-semibold underline underline-offset-2'>
                Sign up free
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span className='text-violet-400 font-semibold underline underline-offset-2'>
                Sign in here
              </span>
            </>
          )}
        </button>
      </div>

      {/* Security badge */}
      <div className='mt-5 pt-4 border-t border-white/8 flex items-center justify-center gap-2 text-[11px] text-slate-400'>
        <ShieldCheck className='w-3.5 h-3.5 text-emerald-400 shrink-0' />
        <span>Secured by Supabase Auth with 256-bit encryption</span>
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
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200'>
      {/* Backdrop click dismiss */}
      <div
        className='fixed inset-0'
        onClick={closeSignIn}
        aria-label='Close background backdrop'
      />
      <div className='relative z-10 w-full max-w-[440px]'>
        <AuthCard onSuccess={closeSignIn} onClose={closeSignIn} />
      </div>
    </div>
  )
}

export default AuthModal
