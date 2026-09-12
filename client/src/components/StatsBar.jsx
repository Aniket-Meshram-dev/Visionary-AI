import React, { useEffect, useState } from 'react'
import { Users, FileText, Image, Layers } from 'lucide-react'
import axios from 'axios'

const StatsBar = () => {
  const [platformStats, setPlatformStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchStats = async () => {
      try {
        const baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
        const { data } = await axios.get(`${baseURL}/api/user/platform-stats`)
        if (data.success && isMounted) {
          setPlatformStats(data.stats)
        }
      } catch (err) {
        console.warn('Notice: live platform stats fetch:', err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchStats()
    return () => {
      isMounted = false
    }
  }, [])

  const formatCount = (val) => {
    if (val === undefined || val === null) return '0'
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
    return val.toLocaleString()
  }

  const stats = [
    {
      label: 'Registered Creators',
      value: loading ? '...' : (platformStats?.totalUsers ?? 0).toLocaleString(),
      description: 'Active across Visionary.ai workspace',
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border border-indigo-500/20',
    },
    {
      label: 'Assets Synthesized',
      value: loading ? '...' : (platformStats?.totalCreations ?? 0).toLocaleString(),
      description: 'Articles, code, images & resumes',
      icon: Layers,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border border-purple-500/20',
    },
    {
      label: 'Images Generated',
      value: loading ? '...' : (platformStats?.totalImages ?? 0).toLocaleString(),
      description: 'Zero watermark 4K studio renders',
      icon: Image,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border border-amber-500/20',
    },
    {
      label: 'Words Written',
      value: loading ? '...' : formatCount(platformStats?.totalWords ?? 0),
      description: 'AI drafts, code & summaries crafted',
      icon: FileText,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border border-emerald-500/20',
    },
  ]

  return (
    <section className='relative z-10 -mt-6 max-w-6xl mx-auto px-4 sm:px-6'>
      <div className='bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className='flex items-center gap-4'>
              <div className={`p-3.5 rounded-2xl ${stat.bgColor} ${stat.color} shrink-0 shadow-inner`}>
                <Icon className='w-6 h-6' />
              </div>
              <div>
                <div className='text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans'>
                  {stat.value}
                </div>
                <div className='text-xs sm:text-sm font-semibold text-slate-300 mt-0.5'>
                  {stat.label}
                </div>
                <div className='text-[11px] text-slate-500 hidden sm:block mt-0.5'>
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

