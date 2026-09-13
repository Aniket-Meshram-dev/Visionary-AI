import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, X, ArrowLeft, Sparkles, ExternalLink } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import MobileBottomNav from '../components/MobileBottomNav'
import InstallPwaBanner from '../components/InstallPwaBanner'
import { useAuth } from '../context/AuthContext'
import UserDropdown from '../components/UserDropdown'
import { AuthCard } from '../components/AuthModal'
import axios from 'axios'
import toast from 'react-hot-toast'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [sidebar, setSidebar] = useState(false)
  const { user, loading, getToken } = useAuth()
  const verifiedRef = useRef(false)

  // Listen for Stripe payment redirect (?payment=success&session_id=...)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus === 'success' && sessionId && !verifiedRef.current && user) {
      verifiedRef.current = true
      const verifyPayment = async () => {
        const toastId = toast.loading('Verifying your Pro subscription...')
        try {
          const token = await getToken()
          const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'

          const { data } = await axios.post(
            `${baseURL}/api/payment/stripe/verify-payment`,
            { sessionId },
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (data.success) {
            toast.success('Congratulations! Welcome to Visionary Pro ⚡', {
              id: toastId,
              duration: 5000,
            })
            if (user?.reload) {
              await user.reload()
            }
          } else {
            toast.error(data.message || 'Payment verification failed', { id: toastId })
          }
        } catch (err) {
          console.error('Stripe payment verification error:', err)
          toast.error(err.response?.data?.message || 'Failed to verify payment', { id: toastId })
        } finally {
          navigate('/ai', { replace: true })
        }
      }

      verifyPayment()
    } else if (paymentStatus === 'cancelled') {
      toast('Payment was cancelled', { icon: 'ℹ️' })
      navigate('/ai', { replace: true })
    }
  }, [searchParams, user, getToken, navigate])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#F8FAFC]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-xs font-medium text-slate-500'>Loading Visionary.ai Workspace...</p>
        </div>
      </div>
    )
  }

  const isCommunityRoute = location.pathname === '/ai/community'

  if (!user && !isCommunityRoute) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-12 relative overflow-hidden'>
        {/* Background ambient lighting */}
        <div className='absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none' />

        {/* Centered Brand Logo */}
        <div className='mb-8 text-center cursor-pointer' onClick={() => navigate('/')}>
          <div className='inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl mb-3'>
            <img src={assets.logoLight} alt="Visionary.ai" className='h-9 object-contain' />
          </div>
          <p className='text-xs sm:text-sm text-indigo-200/80 font-medium'>
            Next-Gen AI Content & Creation Suite
          </p>
        </div>

        <div className='w-full max-w-md'>
          <AuthCard />
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-start justify-start h-screen bg-[#F8FAFC] text-slate-900'>
      {/* Top App Navbar */}
      <nav className='w-full px-4 sm:px-6 h-16 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-gray-200/80 z-30 shrink-0'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => setSidebar(!sidebar)}
            className='p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 md:hidden cursor-pointer'
            aria-label='Toggle Sidebar'
          >
            {sidebar ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
          </button>
          
          <img
            className='cursor-pointer h-7 sm:h-8 object-contain'
            src={assets.logo}
            alt="Visionary.ai"
            onClick={() => navigate('/')}
          />
        </div>

        {/* Right Action Icons */}
        <div className='flex items-center gap-3'>
          <button
            onClick={() => navigate('/')}
            className='hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary transition py-1.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer'
          >
            <ArrowLeft className='w-3.5 h-3.5' /> Landing Page
          </button>
          <div className='h-4 w-[1px] bg-gray-200 hidden md:block' />
          {user ? (
            <UserDropdown />
          ) : (
            <button
              onClick={() => openSignIn && openSignIn('sign-in')}
              className='px-4 py-2 rounded-full text-xs font-semibold text-white bg-primary hover:bg-indigo-700 transition cursor-pointer'
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Main Workspace Area */}
      <div className='flex-1 w-full flex overflow-hidden'>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <main className='flex-1 bg-[#F8FAFC] overflow-y-auto relative pb-16 md:pb-0'>
          <Outlet />
        </main>
      </div>

      {/* Docked Mobile Bottom Navigation (< 768px) */}
      <MobileBottomNav onOpenSidebar={() => setSidebar(true)} isSidebarOpen={sidebar} />

      {/* In-App PWA Install Prompt Banner */}
      <InstallPwaBanner />
    </div>
  )
}

export default Layout
