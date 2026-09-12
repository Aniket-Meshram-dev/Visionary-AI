import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Github, Twitter, Linkedin, Sparkles, Shield } from 'lucide-react'

const Footer = () => {
  const navigate = useNavigate()

  return (
    <footer className='w-full bg-[#05070B] text-slate-400 pt-20 pb-12 border-t border-slate-800/80 font-sans'>
      <div className='max-w-7xl mx-auto px-6 sm:px-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-slate-800/80'>
          {/* Brand Col */}
          <div className='lg:col-span-2 space-y-4'>
            <div className='flex items-center gap-3 cursor-pointer' onClick={() => navigate('/')}>
              <img alt='Visionary.ai' className='h-8 object-contain' src={assets.logoLight} />
            </div>
            <p className='text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed'>
              Next-generation generative AI studio empowering founders, engineers, and creators worldwide with multi-modal intelligence.
            </p>
            <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400'>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
              All AI Models Operational (Gemini & Groq)
            </div>
          </div>

          {/* Tools Col */}
          <div>
            <h4 className='text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono'>
              AI Engines
            </h4>
            <ul className='space-y-2.5 text-xs sm:text-sm'>
              <li>
                <a href='#tools' className='hover:text-white transition'>AI Article Studio</a>
              </li>
              <li>
                <a href='#tools' className='hover:text-white transition'>Diffusion Image Studio</a>
              </li>
              <li>
                <a href='#tools' className='hover:text-white transition'>Quick Code Synthesizer</a>
              </li>
              <li>
                <a href='#tools' className='hover:text-white transition'>Background Isolator</a>
              </li>
              <li>
                <a href='#tools' className='hover:text-white transition'>ATS Resume Reviewer</a>
              </li>
            </ul>
          </div>

          {/* Navigation Col */}
          <div>
            <h4 className='text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono'>
              Navigation
            </h4>
            <ul className='space-y-2.5 text-xs sm:text-sm'>
              <li>
                <button
                  onClick={() => navigate('/ai/community')}
                  className='hover:text-white transition cursor-pointer flex items-center gap-1'
                >
                  Community Showcase <ArrowUpRight className='w-3.5 h-3.5' />
                </button>
              </li>
              <li>
                <a href='#how-it-works' className='hover:text-white transition'>How It Operates</a>
              </li>
              <li>
                <a href='#features' className='hover:text-white transition'>Platform Features</a>
              </li>
              <li>
                <a href='#pricing' className='hover:text-white transition'>Pricing & Plans</a>
              </li>
              <li>
                <button onClick={() => navigate('/ai')} className='hover:text-white transition cursor-pointer'>
                  Creator Workspace
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture Stack */}
          <div>
            <h4 className='text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono'>
              Architecture
            </h4>
            <ul className='space-y-2.5 text-xs text-slate-400'>
              <li className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-indigo-400' /> Google Gemini 2.0
              </li>
              <li className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-indigo-400' /> Groq Llama 3.3 70B
              </li>
              <li className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-indigo-400' /> FLUX.1 Diffusion
              </li>
              <li className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-indigo-400' /> Supabase PostgreSQL
              </li>
              <li className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-indigo-400' /> Cloudinary CDN
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className='pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500'>
          <p>© {new Date().getFullYear()} Visionary AI Suite. All rights reserved.</p>
          <div className='flex items-center gap-6'>
            <span className='hover:text-slate-400 transition cursor-pointer'>Privacy Policy</span>
            <span className='hover:text-slate-400 transition cursor-pointer'>Terms of Service</span>
            <span className='hover:text-slate-400 transition cursor-pointer'>Security & Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
