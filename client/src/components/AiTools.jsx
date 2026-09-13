import React, { useState } from 'react'
import { AiToolsData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react'

const AiTools = () => {
  const navigate = useNavigate()
  const { user, openSignIn } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const toolCategories = {
    '/ai/write-article': 'writing',
    '/ai/summarize-article': 'writing',
    '/ai/quick-code': 'code',
    '/ai/generate-images': 'image',
    '/ai/photo-cleanup': 'image',
    '/ai/remove-background': 'image',
    '/ai/remove-object': 'image',
    '/ai/review-resume': 'code',
    '/ai/resume-builder': 'code',
  }

  const toolBadges = {
    '/ai/write-article': { text: 'Gemini 2.0 Flash', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    '/ai/generate-images': { text: 'FLUX.1 Diffusion', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    '/ai/quick-code': { text: 'Groq Llama 3.3', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    '/ai/review-resume': { text: 'ATS 100-Point Audit', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    '/ai/resume-builder': { text: '10 Executive Templates', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    '/ai/photo-cleanup': { text: 'Cutout & Inpaint', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    '/ai/remove-background': { text: '1-Click Cutout', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    '/ai/remove-object': { text: 'Magic Inpaint', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    '/ai/summarize-article': { text: 'Executive Digest', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  }

  const handleToolClick = (path) => {
    if (user) {
      navigate(path)
    } else {
      openSignIn ? openSignIn() : navigate('/ai')
    }
  }

  const filteredTools = AiToolsData.filter((tool) => {
    if (selectedCategory === 'all') return true
    return toolCategories[tool.path] === selectedCategory
  })

  const categories = [
    { id: 'all', label: 'All Engines' },
    { id: 'writing', label: 'Writing & Research' },
    { id: 'image', label: 'Visual & Inpainting' },
    { id: 'code', label: 'Code & Career' },
  ]

  return (
    <section id='tools' className='px-4 sm:px-12 xl:px-24 py-28 scroll-mt-20'>
      {/* Section Header */}
      <div className='text-center max-w-3xl mx-auto'>
        <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-4'>
          <Wand2 className='w-3.5 h-3.5' /> Unified Multi-Modal Suite
        </div>
        <h2 className='text-3xl sm:text-5xl font-extrabold tracking-tight text-white'>
          Enterprise AI Engines. <span className='text-gradient'>One Platform.</span>
        </h2>
        <p className='mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto'>
          Eliminate fragmented subscriptions. Synthesize, edit, code, and evaluate from a single centralized creative hub.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className='flex flex-wrap items-center justify-center gap-2 mt-10 mb-14'>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Bento Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
        {filteredTools.map((tool, index) => {
          const badge = toolBadges[tool.path]
          return (
            <div
              key={index}
              onClick={() => handleToolClick(tool.path)}
              className='group relative p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl hover:border-slate-700/80 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden backdrop-blur-xl'
            >
              {/* Subtle top hover glow border */}
              <div
                className='absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                style={{ background: `linear-gradient(to right, ${tool.bg.from}, ${tool.bg.to})` }}
              />

              <div>
                <div className='flex items-center justify-between mb-5'>
                  <div
                    className='w-12 h-12 p-2.5 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300 flex items-center justify-center'
                    style={{ background: `linear-gradient(135deg, ${tool.bg.from}, ${tool.bg.to})` }}
                  >
                    <tool.Icon className='w-6 h-6' />
                  </div>

                  {badge && (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.text}
                    </span>
                  )}
                </div>

                <h3 className='text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mb-2'>
                  {tool.title}
                </h3>
                <p className='text-slate-400 text-sm leading-relaxed mb-6 font-normal'>
                  {tool.description}
                </p>
              </div>

              {/* Card Footer CTA */}
              <div className='pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-300 transition-colors'>
                <span>Launch Tool</span>
                <span className='flex items-center gap-1 group-hover:translate-x-1 transition-transform'>
                  Open Canvas <ArrowRight className='w-3.5 h-3.5' />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default AiTools
