import React, { useEffect, useState } from 'react'
import { Sparkles, Heart, ArrowRight, Layers, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Testimonials = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const fetchLiveCreations = async () => {
      try {
        const baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
        const { data } = await axios.get(`${baseURL}/api/user/get-published-creations`)
        if (data.success && isMounted) {
          // Take top 4 most recent published creations
          setCreations((data.creations || []).slice(0, 4))
        }
      } catch (err) {
        console.warn('Notice: live creations showcase fetch:', err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchLiveCreations()
    return () => {
      isMounted = false
    }
  }, [])

  if (!loading && creations.length === 0) {
    return null // Cleanly hides if no community creations are published yet
  }

  return (
    <section className='py-28 bg-[#07090E] border-y border-slate-800/80'>
      <div className='max-w-7xl mx-auto px-4 sm:px-8'>
        {/* Section Header */}
        <div className='text-center max-w-2xl mx-auto mb-16'>
          <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-4'>
            <Sparkles className='w-3.5 h-3.5 text-indigo-400' /> Live Community Showcase
          </div>
          <h2 className='text-3xl sm:text-5xl font-extrabold tracking-tight text-white'>
            Synthesized by Real Creators
          </h2>
          <p className='mt-4 text-sm sm:text-base text-slate-400'>
            Explore real, authentic AI assets generated and published by our community.
          </p>
        </div>

        {/* Real Creations Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {creations.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate('/ai/community')}
              className='group p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between backdrop-blur-xl cursor-pointer'
            >
              <div>
                {item.type === 'image' ? (
                  <div className='w-full h-44 rounded-2xl overflow-hidden mb-4 border border-slate-800 relative bg-slate-950'>
                    <img
                      src={item.content}
                      alt={item.prompt}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                    />
                    <span className='absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono text-white font-semibold flex items-center gap-1'>
                      <ImageIcon className='w-3 h-3 text-amber-400' /> 4K Render
                    </span>
                  </div>
                ) : (
                  <div className='w-full h-44 p-3.5 rounded-2xl mb-4 border border-slate-800/80 bg-slate-950 font-mono text-xs text-slate-300 line-clamp-6 overflow-hidden relative'>
                    {item.content}
                    <div className='absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent' />
                  </div>
                )}

                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700'>
                    {item.type}
                  </span>
                  <span className='text-[11px] text-slate-500 font-mono'>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className='text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed'>
                  "{item.prompt}"
                </p>
              </div>

              <div className='flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80 text-xs'>
                <span className='text-slate-400 font-mono flex items-center gap-1.5'>
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      item.likes?.length ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
                    }`}
                  />
                  {item.likes?.length || 0} likes
                </span>
                <span className='text-indigo-400 group-hover:text-indigo-300 font-semibold flex items-center gap-1 text-[11px]'>
                  View Asset{' '}
                  <ArrowRight className='w-3 h-3 group-hover:translate-x-0.5 transition-transform' />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className='text-center mt-12'>
          <button
            onClick={() => navigate('/ai/community')}
            className='inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold hover:text-white transition cursor-pointer'
          >
            <Layers className='w-4 h-4 text-indigo-400' /> Explore Full Community Feed
          </button>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
