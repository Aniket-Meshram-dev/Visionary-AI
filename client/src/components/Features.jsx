import React from 'react'
import { Zap, ShieldCheck, Cpu, Users, Award, Sparkles } from 'lucide-react'

const Features = () => {
  const features = [
    {
      title: 'State-of-the-Art Neural Engines',
      description: 'Powered by Google Gemini 2.0 Flash and Groq Llama 3.3 for unmatched reasoning depth and code synthesis quality.',
      icon: Cpu,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Ultra-Fast Sub-2s Latency',
      description: 'Streamlined inference pipelines deliver full articles, high-resolution visuals, and algorithms with zero queue delays.',
      icon: Zap,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: '100% Commercial Usage Rights',
      description: 'Everything you create—from brand marketing visuals to production code—is completely yours for client and commercial work.',
      icon: Award,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Global Creator Community',
      description: 'Publish your best creations directly to the public showcase, discover trending prompts, and remix community ideas.',
      icon: Users,
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Enterprise-Grade Security',
      description: 'PostgreSQL row-level isolation and Supabase tokenized authentication ensure your assets and data remain 100% private.',
      icon: ShieldCheck,
      gradient: 'from-indigo-500 to-cyan-600',
    },
    {
      title: 'Multi-Modal Synergy',
      description: 'Eliminate 5+ disparate subscriptions. Write, code, design, inpaint, and evaluate all in one unified, high-speed dashboard.',
      icon: Sparkles,
      gradient: 'from-rose-500 to-red-600',
    },
  ]

  return (
    <section id='features' className='py-28 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20'>
      <div className='text-center max-w-3xl mx-auto mb-16'>
        <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-4'>
          <Zap className='w-3.5 h-3.5' /> Why Choose Visionary AI
        </div>
        <h2 className='text-3xl sm:text-5xl font-extrabold tracking-tight text-white'>
          Architected for Speed, Scale & Precision
        </h2>
        <p className='mt-4 text-sm sm:text-base text-slate-400'>
          Engineered to give founders, creators, and developers an unfair advantage in productivity and visual storytelling.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {features.map((feat, idx) => {
          const Icon = feat.icon
          return (
            <div
              key={idx}
              className='p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl hover:border-slate-700/80 hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl'
            >
              <div
                className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center bg-gradient-to-br ${feat.gradient} shadow-lg mb-6`}
              >
                <Icon className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-white mb-2.5'>
                {feat.title}
              </h3>
              <p className='text-slate-400 text-sm leading-relaxed'>
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
