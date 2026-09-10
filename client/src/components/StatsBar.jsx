import React from 'react'
import { Users, FileText, Image, Zap } from 'lucide-react'

const StatsBar = () => {
  const stats = [
    {
      label: 'Active Creators',
      value: '10,000+',
      description: 'Writing, designing & coding daily',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Words Generated',
      value: '1.5M+',
      description: 'High-converting articles & summaries',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Images Synthesized',
      value: '500,000+',
      description: 'Ultra HD anime & photorealistic renders',
      icon: Image,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Generation Speed',
      value: '< 2.5s',
      description: 'Average AI response latency',
      icon: Zap,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ]

  return (
    <section className='relative z-10 -mt-8 max-w-6xl mx-auto px-4 sm:px-6'>
      <div className='bg-white/90 backdrop-blur-xl border border-gray-200/90 rounded-2xl shadow-xl p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className='flex items-center gap-4'>
              <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} shrink-0`}>
                <Icon className='w-6 h-6' />
              </div>
              <div>
                <div className='text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight'>
                  {stat.value}
                </div>
                <div className='text-xs sm:text-sm font-semibold text-gray-700 mt-0.5'>
                  {stat.label}
                </div>
                <div className='text-[11px] text-gray-400 hidden sm:block mt-0.5'>
                  {stat.description}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default StatsBar
