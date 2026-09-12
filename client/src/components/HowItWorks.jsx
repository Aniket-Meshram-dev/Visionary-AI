import React from 'react'
import { MousePointerClick, MessageSquareText, Sparkles, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const HowItWorks = () => {
  const navigate = useNavigate()

  const steps = [
    {
      step: '01',
      title: 'Pick Your Creative Engine',
      description: 'Select from 7 specialized AI tools tailored for long-form writing, code generation, resume auditing, or image design.',
      icon: MousePointerClick,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      step: '02',
      title: 'Prompt, Tune or Upload',
      description: 'Describe your vision in plain English, choose custom tones or styles, or upload raw PDFs and images for automated processing.',
      icon: MessageSquareText,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      step: '03',
      title: 'Instant Delivery & Export',
      description: 'Receive production-ready output in sub-2 seconds. Copy code, export Markdown, download 8K assets, or share with the community.',
      icon: Sparkles,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  ]

  return (
    <section id='how-it-works' className='py-28 bg-[#07090E] border-y border-slate-800/80 scroll-mt-20 relative'>
      <div className='max-w-7xl mx-auto px-4 sm:px-8'>
        {/* Section Header */}
        <div className='text-center max-w-2xl mx-auto mb-16'>
          <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-4'>
            <Sparkles className='w-3.5 h-3.5' /> Effortless Velocity
          </div>
          <h2 className='text-3xl sm:text-5xl font-extrabold tracking-tight text-white'>
            How Visionary AI Operates
          </h2>
          <p className='mt-4 text-sm sm:text-base text-slate-400'>
            From raw spark of an idea to publication-ready asset in under 30 seconds. Zero learning curve.
          </p>
        </div>

        {/* Steps Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 relative'>
          {/* Connector line for desktop */}
          <div className='hidden md:block absolute top-1/3 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 -z-0' />

          {steps.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className='relative z-10 p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl hover:border-slate-700 transition-all duration-300 flex flex-col items-start group backdrop-blur-xl'
              >
                <div className='flex items-center justify-between w-full mb-6'>
                  <div className={`p-4 rounded-2xl ${item.bg} ${item.color} ${item.border} border group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                    <Icon className='w-6 h-6' />
                  </div>
                  <span className='text-4xl font-extrabold text-slate-800 group-hover:text-indigo-500/30 transition-colors font-mono'>
                    {item.step}
                  </span>
                </div>

                <h3 className='text-xl font-bold text-white mb-3'>
                  {item.title}
                </h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Mini CTA */}
        <div className='mt-14 text-center'>
          <button
            onClick={() => navigate('/ai')}
            className='inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer'
          >
            Experience the workspace workflow yourself <ArrowRight className='w-4 h-4' />
          </button>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
