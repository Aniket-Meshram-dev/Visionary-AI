import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, X, ArrowLeft, Sparkles, ExternalLink } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { SignIn, useUser, UserButton } from '@clerk/clerk-react'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebar, setSidebar] = useState(false)
  const { user } = useUser()

  return user ? (
    <div className='flex flex-col items-start justify-start h-screen bg-[#F8FAFC] text-slate-900'>
      {/* Top App Navbar */}
      <nav className='w-full px-4 sm:px-6 h-16 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-gray-200/80 z-30 shrink-0'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => setSidebar(!sidebar)}
            className='p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 sm:hidden'
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
          <UserButton />
        </div>
      </nav>

      {/* Main Workspace Area */}
      <div className='flex-1 w-full flex overflow-hidden'>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <main className='flex-1 bg-[#F8FAFC] overflow-y-auto relative'>
          <Outlet />
        </main>
      </div>
    </div>
  ) : (
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
        <SignIn routing="hash" />
      </div>
    </div>
  )
}

export default Layout

