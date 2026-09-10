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
    '/ai/remove-background': 'image',
    '/ai/remove-object': 'image',
    '/ai/review-resume': 'code',
  }

  const toolBadges = {
    '/ai/write-article': { text: 'Most Popular', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    '/ai/generate-images': { text: 'Clipdrop AI', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    '/ai/quick-code': { text: 'Fast & Clean', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    '/ai/review-resume': { text: 'ATS Scored', color: 'bg-teal-100 text-teal-700 border-teal-200' },
    '/ai/remove-background': { text: '1-Click', color: 'bg-orange-100 text-orange-700 border-orange-200' },
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
    { id: 'all', label: 'All 7 Tools' },
    { id: 'writing', label: 'Writing & Articles' },
    { id: 'image', label: 'Image & Design' },
    { id: 'code', label: 'Code & Career' },
  ]

  return (
    <section id='tools' className='px-4 sm:px-12 xl:px-24 py-24 scroll-mt-20'>
      {/* Section Header */}
      <div className='text-center max-w-3xl mx-auto'>
        <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-primary mb-4'>
          <Wand2 className='w-3.5 h-3.5' /> Suite of Powerful Creators
        </div>
        <h2 className='text-3xl sm:text-5xl font-bold tracking-tight text-gray-900'>
          Everything You Need to Create with AI
        </h2>
        <p className='mt-4 text-base sm:text-lg text-gray-500 max-w-xl mx-auto'>
          Purpose-built AI tools engineered to accelerate your creative workflow from ideation to final delivery.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className='flex flex-wrap items-center justify-center gap-2 mt-10 mb-12'>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-primary text-white shadow-sm shadow-indigo-500/20'
                : 'bg-gray-100 hover:bg-gray-200/70 text-gray-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 max-w-6xl mx-auto'>
        {filteredTools.map((tool, index) => {
          const badge = toolBadges[tool.path]
          return (
            <div
              key={index}
              onClick={() => handleToolClick(tool.path)}
              className='group relative p-7 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden'
            >
              {/* Subtle top hover glow border */}
              <div
                className='absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                style={{ background: `linear-gradient(to right, ${tool.bg.from}, ${tool.bg.to})` }}
              />

              <div>
                <div className='flex items-center justify-between mb-5'>
                  <div
                    className='w-12 h-12 p-2.5 rounded-xl text-white shadow-sm group-hover:scale-110 transition-transform duration-300 flex items-center justify-center'
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

                <h3 className='text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-2'>
                  {tool.title}
                </h3>
                <p className='text-gray-500 text-sm leading-relaxed mb-6'>
                  {tool.description}
                </p>
              </div>

              {/* Card Footer CTA */}
              <div className='pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600 group-hover:text-primary transition-colors'>
                <span>Launch Tool</span>
                <span className='flex items-center gap-1 group-hover:translate-x-1 transition-transform'>
                  Try now <ArrowRight className='w-3.5 h-3.5' />
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

