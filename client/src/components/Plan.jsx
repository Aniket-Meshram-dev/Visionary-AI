import React, { useState, useEffect } from 'react'
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
  CreditCard,
  Ticket,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PRICING_CONFIG } from '../configs/pricing'
import axios from 'axios'
import toast from 'react-hot-toast'

const Plan = () => {
  const { user, isSignedIn, openSignIn, getToken, plan } = useAuth()
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'
  const [currency, setCurrency] = useState('usd') // 'usd' | 'inr'
  const [processing, setProcessing] = useState(false)
  const [showPromoInput, setShowPromoInput] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [highlightPro, setHighlightPro] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#pro-plan') {
      setHighlightPro(true)
      const timer = setTimeout(() => {
        setHighlightPro(false)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [location.hash])

  const isPro = plan === 'premium'
  const freePlan = PRICING_CONFIG.plans.free
  const proPlan = PRICING_CONFIG.plans.pro

  // Dynamic price calculation from single source of truth
  const isAnnual = billingCycle === 'annual'
  const priceDisplay =
    currency === 'usd'
      ? {
          symbol: '$',
          amount: isAnnual ? proPlan.pricing.usd.annualMonthly : proPlan.pricing.usd.monthly,
          subtext: isAnnual ? '/ month ($180 billed annually)' : '/ month billed monthly',
        }
      : {
          symbol: '₹',
          amount: isAnnual ? proPlan.pricing.inr.annualMonthly : proPlan.pricing.inr.monthly,
          subtext: isAnnual ? '/ month (₹14,999 billed annually)' : '/ month billed monthly',
        }

  // Load Razorpay SDK on-demand
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Handle Pro Action (Stripe or Razorpay)
  const handleCheckout = async () => {
    if (!isSignedIn) {
      openSignIn('sign-in')
      return
    }

    if (isPro) {
      navigate('/ai')
      return
    }

    setProcessing(true)
    try {
      const token = await getToken()
      const baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

      if (currency === 'usd') {
        // Stripe Checkout
        const { data } = await axios.post(
          `${baseURL}/api/payment/stripe/create-session`,
          { billingCycle },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (data.success && data.url) {
          window.location.href = data.url
        } else {
          toast.error(data.message || 'Unable to initiate Stripe checkout')
        }
      } else {
        // Razorpay Checkout
        const scriptLoaded = await loadRazorpayScript()
        if (!scriptLoaded) {
          toast.error('Failed to load Razorpay SDK. Please check your internet connection.')
          setProcessing(false)
          return
        }

        const { data } = await axios.post(
          `${baseURL}/api/payment/razorpay/create-order`,
          { billingCycle },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (!data.success || !data.order) {
          toast.error(data.message || 'Failed to create payment order')
          setProcessing(false)
          return
        }

        const options = {
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'Visionary.ai',
          description: `Visionary Pro (${billingCycle})`,
          order_id: data.order.id,
          prefill: {
            name: user?.fullName || '',
            email: user?.email || '',
          },
          theme: { color: '#4f46e5' },
          handler: async (response) => {
            try {
              const verifyRes = await axios.post(
                `${baseURL}/api/payment/razorpay/verify-payment`,
                response,
                { headers: { Authorization: `Bearer ${token}` } }
              )

              if (verifyRes.data.success) {
                toast.success('Congratulations! Upgraded to Pro Plan ⚡')
                if (user?.reload) await user.reload()
                navigate('/ai')
              } else {
                toast.error(verifyRes.data.message || 'Payment verification failed')
              }
            } catch (err) {
              toast.error('Payment verification failed on server')
            }
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment initiation failed')
    } finally {
      setProcessing(false)
    }
  }

  // Handle Promo Code Upgrade (VIP / Test)
  const handlePromoUpgrade = async (e) => {
    e.preventDefault()
    if (!promoCode.trim()) return

    setProcessing(true)
    try {
      const token = await getToken()
      const baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

      const { data } = await axios.post(
        `${baseURL}/api/user/upgrade-plan`,
        { plan: 'premium', promoCode: promoCode.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success('VIP Promo Code activated! You are now a Pro member ⚡')
        if (user?.reload) await user.reload()
        setShowPromoInput(false)
        navigate('/ai')
      } else {
        toast.error(data.message || 'Invalid promotional code')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate promotional code')
    } finally {
      setProcessing(false)
    }
  }

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

        {/* Currency & Billing Toggles */}
        <div className='mt-8 flex flex-wrap items-center justify-center gap-4'>
          {/* Billing toggle */}
          <div className='inline-flex items-center p-1 bg-gray-100/90 rounded-full border border-gray-200/80'>
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

          {/* Currency toggle */}
          <div className='inline-flex items-center p-1 bg-gray-100/90 rounded-full border border-gray-200/80 text-xs font-semibold'>
            <button
              type='button'
              onClick={() => setCurrency('usd')}
              className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                currency === 'usd' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              USD ($)
            </button>
            <button
              type='button'
              onClick={() => setCurrency('inr')}
              className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                currency === 'inr' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              INR (₹)
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className='mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch'>
        {/* Free Starter Card */}
        <div className='rounded-3xl p-8 bg-white border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition'>
          <div>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-bold text-gray-900'>{freePlan.name}</h3>
              <span className='text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600'>
                {freePlan.badge}
              </span>
            </div>
            <p className='text-sm text-gray-500 mb-6'>{freePlan.tagline}</p>

            <div className='flex items-baseline gap-1 mb-8'>
              <span className='text-4xl sm:text-5xl font-extrabold text-gray-900'>$0</span>
              <span className='text-sm font-medium text-gray-400'>/ forever</span>
            </div>

            <div className='space-y-3.5 mb-8'>
              {freePlan.features.map((item, idx) => (
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
            {!isPro && isSignedIn ? 'Current Active Plan' : freePlan.buttonText}
          </button>
        </div>

        {/* Pro Plan Card */}
        <div
          id='pro-plan'
          className={`relative rounded-3xl p-8 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 flex flex-col justify-between scroll-mt-28 transition-all duration-700 ${
            highlightPro
              ? 'ring-4 ring-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.6)] scale-[1.02]'
              : ''
          }`}
        >
          {/* Top highlight badge */}
          <div className='absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-[11px] font-bold tracking-wide uppercase px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5'>
            <Crown className='w-3 h-3 fill-current' /> {proPlan.badge}
          </div>

          <div>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                {proPlan.name} <Zap className='w-4 h-4 text-amber-400 fill-current' />
              </h3>
              <span className='text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'>
                All 7 AI Tools
              </span>
            </div>
            <p className='text-sm text-indigo-200/80 mb-6'>{proPlan.tagline}</p>

            <div className='flex items-baseline gap-1 mb-8'>
              <span className='text-4xl sm:text-5xl font-extrabold text-white'>
                {priceDisplay.symbol}
                {priceDisplay.amount}
              </span>
              <span className='text-sm font-medium text-indigo-300'>{priceDisplay.subtext}</span>
            </div>

            <div className='space-y-3.5 mb-8'>
              {proPlan.features.map((item, idx) => (
                <div key={idx} className='flex items-start gap-2.5 text-xs sm:text-sm text-indigo-100'>
                  <div className='w-4 h-4 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300'>
                    <Check className='w-3 h-3 text-indigo-300 stroke-[3]' />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <button
              type='button'
              disabled={processing}
              onClick={handleCheckout}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer ${
                isPro
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-95'
              }`}
            >
              {processing ? (
                <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
              ) : isPro ? (
                <>
                  <Crown className='w-4 h-4 fill-current' /> Active Pro Member
                </>
              ) : (
                <>
                  <CreditCard className='w-4 h-4' /> Pay via {currency === 'usd' ? 'Stripe ($)' : 'Razorpay (₹)'} ⚡
                </>
              )}
            </button>

            {/* Promo Code Trigger */}
            {!isPro && (
              <div className='text-center'>
                {showPromoInput ? (
                  <form onSubmit={handlePromoUpgrade} className='flex items-center gap-2 pt-2'>
                    <input
                      type='text'
                      placeholder='Enter Promo / VIP Code'
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className='flex-1 bg-slate-800 border border-indigo-400/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-400'
                    />
                    <button
                      type='submit'
                      disabled={processing}
                      className='px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer'
                    >
                      Apply
                    </button>
                  </form>
                ) : (
                  <button
                    type='button'
                    onClick={() => setShowPromoInput(true)}
                    className='text-[11px] text-indigo-300 hover:text-white inline-flex items-center gap-1 transition cursor-pointer'
                  >
                    <Ticket className='w-3 h-3' /> Have a VIP promo pass?
                  </button>
                )}
              </div>
            )}
          </div>
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
