import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Clock,
  Crown,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Plan = () => {
  const { user, isSignedIn, openSignIn, upgradeToPro, plan } = useAuth()
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'
  const [upgrading, setUpgrading] = useState(false)
  const navigate = useNavigate()

  const isPro = plan === 'premium'

  const handleProAction = async () => {
    if (!isSignedIn) {
      openSignIn('sign-in')
      return
    }

    if (isPro) {
      navigate('/ai')
      return
    }

    setUpgrading(true)
    await upgradeToPro()
    setUpgrading(false)
  }

  const freeFeatures = [
    '10 Free AI Generations across tools',
    'Full-Length AI Article Writer (600-1800 words)',
    'Intelligent Text & Article Summarizer',
    'High-Speed Quick Code Snippet Generator',
    'Community Creations Gallery & Likes',
    'Standard Server Processing Queue',
  ]

  const proFeatures = [
    'Unlimited AI Generations — Zero Caps',
    'Photorealistic Text-to-Image AI (Clipdrop)',
    '1-Click AI Image Background Removal',
    'AI Object & Watermark Removal',
    'ATS Executive Resume Review & Scoring (5MB)',
    'Ultra-Fast Groq & Gemini 2.0 Flash Processing',
    'Export to Markdown, Code, & HD Images',
    'Priority Support & Early Feature Access',
  ]

  return (
    <section id='pricing' className='max-w-6xl mx-auto z-20 my-24 px-4 sm:px-8 scroll-mt-20'>
      {/* Section Header */}
      <div className='text-center'>
        <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-primary mb-4'>
          <Sparkles className='w-3.5 h-3.5' /> Transparent & Predictable
        </div>
        <h2 className='text-3xl sm:text-5xl font-bold tracking-tight text-gray-900'>
          Choose the Perfect Creative Plan
        </h2>
        <p className='mt-4 text-base sm:text-lg text-gray-500 max-w-xl mx-auto'>
          Start for free today with 10 credits. Upgrade anytime to unlock unlimited power and premium visual tools.
        </p>

        {/* Billing toggle */}
        <div className='mt-8 inline-flex items-center p-1 bg-gray-100/80 rounded-full border border-gray-200/80'>
          <button
            type='button'
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type='button'
            onClick={() => setBillingCycle('annual')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Annual Billing
            <span className='bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full'>
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className='mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch'>
        {/* Free Starter Card */}
        <div className='rounded-3xl p-8 bg-white border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition'>
          <div>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-bold text-gray-900'>Starter Free</h3>
              <span className='text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600'>
                Forever Free
              </span>
            </div>
            <p className='text-sm text-gray-500 mb-6'>
              Ideal for students, hobbyists, and exploring our AI capabilities.
            </p>

            <div className='flex items-baseline gap-1 mb-8'>
              <span className='text-4xl sm:text-5xl font-extrabold text-gray-900'>$0</span>
              <span className='text-sm font-medium text-gray-400'>/ month</span>
            </div>

            <div className='space-y-3.5 mb-8'>
              {freeFeatures.map((item, idx) => (
                <div key={idx} className='flex items-start gap-2.5 text-xs sm:text-sm text-gray-600'>
                  <Check className='w-4 h-4 text-emerald-500 shrink-0 mt-0.5' />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type='button'
            disabled={!isPro && isSignedIn}
            onClick={() => {
              if (!isSignedIn) openSignIn('sign-up')
              else navigate('/ai')
            }}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer text-center ${
              !isPro && isSignedIn
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}
          >
            {!isPro && isSignedIn ? 'Current Active Plan' : 'Get Started for Free'}
          </button>
        </div>

        {/* Pro Plan Card */}
        <div className='relative rounded-3xl p-8 bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 flex flex-col justify-between'>
          {/* Top highlight badge */}
          <div className='absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-[11px] font-bold tracking-wide uppercase px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5'>
            <Crown className='w-3 h-3 fill-current' /> Most Popular Choice
          </div>

          <div>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                Pro Unlimited <Zap className='w-4 h-4 text-amber-400 fill-current' />
              </h3>
              <span className='text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'>
                All Features
              </span>
            </div>
            <p className='text-sm text-indigo-200/80 mb-6'>
              For creators, founders, developers, and professionals who create at scale.
            </p>

            <div className='flex items-baseline gap-1 mb-8'>
              <span className='text-4xl sm:text-5xl font-extrabold text-white'>
                {billingCycle === 'monthly' ? '$19' : '$15'}
              </span>
              <span className='text-sm font-medium text-indigo-300'>
                / month {billingCycle === 'annual' && '(billed annually)'}
              </span>
            </div>

            <div className='space-y-3.5 mb-8'>
              {proFeatures.map((item, idx) => (
                <div key={idx} className='flex items-start gap-2.5 text-xs sm:text-sm text-indigo-100'>
                  <div className='w-4 h-4 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300'>
                    <Check className='w-3 h-3 text-indigo-300 stroke-[3]' />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type='button'
            disabled={upgrading}
            onClick={handleProAction}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer ${
              isPro
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-95'
            }`}
          >
            {upgrading ? (
              <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
            ) : isPro ? (
              <>
                <Crown className='w-4 h-4 fill-current' /> Active Pro Member
              </>
            ) : (
              <>
                <Zap className='w-4 h-4 fill-current' /> Upgrade to Pro ⚡
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security footer */}
      <div className='mt-12 text-center flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500'>
        <div className='flex items-center gap-1.5'>
          <ShieldCheck className='w-4 h-4 text-emerald-500' />
          <span>256-Bit SSL Encrypted & Protected</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <Clock className='w-4 h-4 text-indigo-500' />
          <span>Cancel or switch anytime</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <HelpCircle className='w-4 h-4 text-purple-500' />
          <span>24/7 dedicated support</span>
        </div>
      </div>
    </section>
  )
}

export default Plan
