import React from 'react'
import { Zap, ShieldCheck, Cpu, Users, Award, Sparkles } from 'lucide-react'

const Features = () => {
  const features = [
    {
      title: 'State-of-the-Art Intelligence',
      description: 'Powered directly by Google Gemini LLM and Clipdrop diffusion APIs for unmatched output quality and accuracy.',
      icon: Cpu,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Ultra-Fast Sub-3s Responses',
      description: 'Optimized serverless pipelines deliver instant articles, high-resolution visuals, and code snippets without queue delays.',
      icon: Zap,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: '100% Commercial Usage Rights',
      description: 'Everything you generate—from graphics to marketing copy—is completely yours for client projects and commercial use.',
      icon: Award,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Built-in Creator Community',
      description: 'Publish your best creations directly to the community feed, discover trending prompts, and exchange creative ideas.',
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Secure & Private Cloud',
      description: 'Enterprise Clerk authentication and secure Neon PostgreSQL cloud ensure your account and data are protected.',
      icon: ShieldCheck,
      gradient: 'from-indigo-500 to-cyan-600',
    },
    {
      title: 'Multi-Modal Versatility',
      description: 'Eliminate 5+ fragmented subscriptions. Write, code, design, edit, and evaluate all in one streamlined dashboard.',
      icon: Sparkles,
      gradient: 'from-rose-500 to-red-600',
    },
  ]

  return (
    <section id='features' className='py-24 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20'>
      <div className='text-center max-w-3xl mx-auto mb-16'>
        <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 mb-4'>
          <Zap className='w-3.5 h-3.5' /> Why Choose Visionary AI
        </div>
        <h2 className='text-3xl sm:text-5xl font-bold tracking-tight text-gray-900'>
          Engineered for Quality, Speed & Scale
        </h2>
        <p className='mt-4 text-base sm:text-lg text-gray-500'>
          Built to give creators, founders, and teams an unfair advantage in productivity and visual storytelling.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {features.map((feat, idx) => {
          const Icon = feat.icon
          return (
            <div
              key={idx}
              className='p-7 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300'
            >
              <div
                className={`w-12 h-12 rounded-xl text-white flex items-center justify-center bg-gradient-to-br ${feat.gradient} shadow-sm mb-5`}
              >
                <Icon className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-gray-900 mb-2'>
                {feat.title}
              </h3>
              <p className='text-gray-500 text-sm leading-relaxed'>
                {feat.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Features
