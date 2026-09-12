import React from 'react'
import { assets } from '../assets/assets'
import { Sparkles } from 'lucide-react'

const PageLoader = ({ text = 'Loading AI Workspace...' }) => {
  return (
    <div className='min-h-[60vh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden'>
      {/* Ambient background glow */}
      <div className='w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl absolute pointer-events-none animate-pulse' />

      <div className='relative z-10 flex flex-col items-center gap-4 text-center'>
        {/* Brand logo container */}
        <div className='relative p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl'>
          <img src={assets.logoIcon} alt='Visionary' className='w-8 h-8 object-contain animate-bounce' />
          <div className='absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-sm -z-10 animate-pulse' />
        </div>

        {/* Loading spinner with text */}
        <div className='flex items-center gap-2 text-xs font-semibold text-slate-400'>
          <div className='w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin' />
          <span>{text}</span>
        </div>
      </div>
    </div>
  )
}

export default PageLoader
