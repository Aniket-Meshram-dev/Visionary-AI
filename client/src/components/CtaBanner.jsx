import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

const CtaBanner = () => {
  const navigate = useNavigate()
  const { user, openSignIn } = useAuth()

  const handleCtaClick = () => {
    if (user) {
      navigate('/ai')
    } else {
      openSignIn ? openSignIn() : navigate('/ai')
    }
  }

  return (
    <section className='py-20 px-4 sm:px-8 max-w-7xl mx-auto'>
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 sm:p-16 text-center text-white shadow-2xl'>
        {/* Decorative background blurs */}
        <div className='absolute -top-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none' />
        <div className='absolute -bottom-24 -right-24 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none' />

        <div className='relative z-10 max-w-3xl mx-auto'>
          <div className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium text-indigo-200 mb-6'>
            <Sparkles className='w-4 h-4 text-amber-300' /> Start for free today
          </div>

          <h2 className='text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6'>
            Ready to Supercharge Your Content Workflow?
          </h2>

          <p className='text-base sm:text-xl text-indigo-200 mb-8 max-w-2xl mx-auto leading-relaxed font-normal'>
            Experience the combined power of Google Gemini and Clipdrop in one seamless dashboard. Create higher quality content in minutes.
          </p>

          <div className='flex flex-wrap items-center justify-center gap-4 mb-8'>
            <button
              onClick={handleCtaClick}
              className='flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary hover:bg-gray-100 font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer'
            >
              Get Started for Free <ArrowRight className='w-4 h-4 text-primary' />
            </button>
          </div>

          <div className='flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-indigo-200/90'>
            <div className='flex items-center gap-1.5'>
              <CheckCircle2 className='w-4 h-4 text-emerald-400' /> No credit card required
            </div>
            <div className='flex items-center gap-1.5'>
              <CheckCircle2 className='w-4 h-4 text-emerald-400' /> Free monthly credits
            </div>
            <div className='flex items-center gap-1.5'>
              <CheckCircle2 className='w-4 h-4 text-emerald-400' /> Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaBanner
