import React from 'react'
import { PricingTable } from '@clerk/clerk-react'
import { ShieldCheck, Sparkles } from 'lucide-react'

const Plan = () => {
  return (
    <section id='pricing' className='max-w-4xl mx-auto z-20 my-24 px-4 sm:px-8 scroll-mt-20'>
      <div className='text-center'>
        <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-primary mb-4'>
          <Sparkles className='w-3.5 h-3.5' /> Simple & Transparent
        </div>
        <h2 className='text-3xl sm:text-5xl font-bold tracking-tight text-gray-900'>
          Choose Your Plan
        </h2>
        <p className='mt-4 text-base sm:text-lg text-gray-500 max-w-lg mx-auto'>
          Start for free and scale up as your creative needs expand. Zero hidden fees.
        </p>
      </div>

      <div className='mt-12 max-sm:mx-4'>
        <PricingTable />
      </div>

      <div className='mt-8 text-center flex items-center justify-center gap-2 text-xs text-gray-400'>
        <ShieldCheck className='w-4 h-4 text-emerald-500' />
        <span>Secure 256-Bit SSL Encrypted Checkout powered by Stripe & Clerk</span>
      </div>
    </section>
  )
}

export default Plan

