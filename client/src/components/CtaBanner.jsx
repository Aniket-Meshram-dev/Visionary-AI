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
      openSignIn ? openSignIn('sign-up') : navigate('/ai')
    }
  }

  return (
    <section className='py-24 px-4 sm:px-8 max-w-7xl mx-auto'>
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-8 sm:p-16 text-center text-white shadow-2xl shadow-indigo-500/10'>
        {/* Decorative background blurs */}
        <div className='absolute -top-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none' />
        <div className='absolute -bottom-24 -right-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none' />

        <div className='relative z-10 max-w-3xl mx-auto'>
          <div className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs sm:text-sm font-semibold text-indigo-300 mb-6'>
            <Sparkles className='w-4 h-4 text-amber-300' /> Start Creating in 30 Seconds
          </div>

          <h2 className='text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6'>
            Ready to Supercharge Your <span className='text-gradient'>Creative Output?</span>
          </h2>

          <p className='text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed font-normal'>
            Experience Google Gemini 2.0 and FLUX.1 Diffusion in one high-velocity studio. 10 free generations on us, no card required.
          </p>

          <div className='flex flex-wrap items-center justify-center gap-4 mb-8'>
            <button
              onClick={handleCtaClick}
              className='flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer'
            >
              Get Started for Free <ArrowRight className='w-4 h-4' />
            </button>
          </div>

          <div className='flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400'>
            <div className='flex items-center gap-1.5'>
              <CheckCircle2 className='w-4 h-4 text-emerald-400' /> No credit card required
            </div>
            <div className='flex items-center gap-1.5'>
              <CheckCircle2 className='w-4 h-4 text-emerald-400' /> 10 Free credits instantly
            </div>
            <div className='flex items-center gap-1.5'>
              <CheckCircle2 className='w-4 h-4 text-emerald-400' /> Commercial usage rights
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaBanner
