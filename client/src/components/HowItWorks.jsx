import React from 'react'
import { MousePointerClick, MessageSquareText, Sparkles, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const HowItWorks = () => {
  const navigate = useNavigate()

  const steps = [
    {
      step: '01',
      title: 'Pick Your AI Tool',
      description: 'Choose from 7 dedicated tools designed specifically for writing, code synthesis, resume screening, or image design.',
      icon: MousePointerClick,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      step: '02',
      title: 'Prompt or Upload',
      description: 'Describe your requirements in plain English, select creative styles, or upload your media assets for instant processing.',
      icon: MessageSquareText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      step: '03',
      title: 'Instant Magic & Export',
      description: 'Get production-ready results in seconds powered by Google Gemini & Clipdrop. Copy, download, or publish with 1-click.',
      icon: Sparkles,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
  ]

  return (
    <section id='how-it-works' className='py-24 bg-gradient-to-b from-gray-50/60 via-white to-gray-50/60 scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-8'>
        {/* Section Header */}
        <div className='text-center max-w-2xl mx-auto mb-16'>
          <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-semibold text-purple-700 mb-4'>
            <Sparkles className='w-3.5 h-3.5' /> Effortless Workflow
          </div>
          <h2 className='text-3xl sm:text-5xl font-bold tracking-tight text-gray-900'>
            How Visionary AI Works
          </h2>
          <p className='mt-4 text-base sm:text-lg text-gray-500'>
            From raw idea to publication-ready asset in under 30 seconds. No steep learning curve.
          </p>
        </div>

        {/* Steps Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 relative'>
          {/* Connector line for desktop */}
          <div className='hidden md:block absolute top-1/3 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-emerald-200 -z-0' />

          {steps.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className='relative z-10 p-8 rounded-2xl bg-white border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start group'
              >
                <div className='flex items-center justify-between w-full mb-6'>
                  <div className={`p-4 rounded-2xl ${item.bg} ${item.color} ${item.border} border group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className='w-7 h-7' />
                  </div>
                  <span className='text-4xl font-extrabold text-gray-200 group-hover:text-primary/30 transition-colors font-mono'>
                    {item.step}
                  </span>
                </div>

                <h3 className='text-xl font-bold text-gray-900 mb-3'>
                  {item.title}
                </h3>
                <p className='text-gray-500 text-sm leading-relaxed'>
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
            className='inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-indigo-700 transition cursor-pointer'
          >
            Experience the workflow yourself <ArrowRight className='w-4 h-4' />
          </button>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
