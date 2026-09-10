import React, { useEffect, useMemo, useState } from 'react'
import {
  Gem,
  Sparkles,
  Search,
  Filter,
  Plus,
  ArrowRight,
  FolderOpen,
  Zap,
  Image as ImageIcon,
  FileText,
  Code,
  Hash,
  Clock,
  Layers,
} from 'lucide-react'
import { Protect, useAuth, useUser } from '@clerk/clerk-react'
import CreationItem from '../components/CreationItem'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const Dashboard = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const { getToken } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()

  const usage = typeof user?.publicMetadata?.usage === 'number' ? user.publicMetadata.usage : 0
  const isPremium = user?.publicMetadata?.plan === 'premium'

  const getDashboardData = async () => {
    try {
      const { data } = await axios.get('/api/user/get-user-creations', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })

      if (data.success) {
        setCreations(data.creations)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(`/api/user/delete-creation/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })

      if (data.success) {
        setCreations((prev) => prev.filter((item) => item.id !== id))
        toast.success('Creation deleted successfully')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    getDashboardData()
  }, [])

  // Filter and search logic
  const filteredCreations = useMemo(() => {
    return creations.filter((item) => {
      const matchesFilter = activeFilter === 'all' || item.type === activeFilter
      const matchesSearch =
        !searchQuery.trim() ||
        (item.prompt && item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    })
  }, [creations, activeFilter, searchQuery])

  // Count by category
  const counts = useMemo(() => {
    return {
      all: creations.length,
      image: creations.filter((c) => c.type === 'image').length,
      article: creations.filter((c) => c.type === 'article').length,
      'quick-code': creations.filter((c) => c.type === 'quick-code').length,
      summary: creations.filter((c) => c.type === 'summary').length,
      'resume-review': creations.filter((c) => c.type === 'resume-review').length,
    }
  }, [creations])

  const filterTabs = [
    { key: 'all', label: 'All Creations', count: counts.all },
    { key: 'image', label: 'Images', count: counts.image },
    { key: 'article', label: 'Articles', count: counts.article },
    { key: 'quick-code', label: 'Code', count: counts['quick-code'] },
    { key: 'summary', label: 'Summaries', count: counts.summary },
    { key: 'resume-review', label: 'Resumes', count: counts['resume-review'] },
  ]

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto space-y-8'>
      {/* Header Banner */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight'>
              Welcome back, {user?.firstName || 'Creator'} 👋
            </h1>
          </div>
          <p className='text-sm text-slate-500 mt-1'>
            Manage, review, and export all your Visionary.ai generated assets.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigate('/ai/generate-images')}
            className='px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition flex items-center gap-1.5 cursor-pointer'
          >
            <ImageIcon className='w-4 h-4 text-emerald-600' /> New Image
          </button>
          <button
            onClick={() => navigate('/ai/write-article')}
            className='px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-sm shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer'
          >
            <Plus className='w-4 h-4' /> Create New
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Total Creations */}
        <div className='p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
              Total Creations
            </p>
            <h2 className='text-3xl font-bold text-slate-900 mt-1'>{creations.length}</h2>
            <p className='text-xs text-slate-500 mt-0.5 flex items-center gap-1'>
              <Layers className='w-3.5 h-3.5 text-indigo-500' /> Across all AI tools
            </p>
          </div>
          <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20'>
            <Sparkles className='w-6 h-6' />
          </div>
        </div>

        {/* Plan Status */}
        <div className='p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
              Active Membership
            </p>
            <h2 className='text-3xl font-bold text-slate-900 mt-1'>
              {isPremium ? 'Pro Member' : 'Free Tier'}
            </h2>
            <p className='text-xs text-slate-500 mt-0.5'>
              {isPremium ? 'Unlimited High-Speed AI' : `${10 - usage} of 10 free uses left`}
            </p>
          </div>
          <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20'>
            <Gem className='w-6 h-6' />
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className='p-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-1'>
          <div>
            <div className='flex items-center justify-between text-xs text-indigo-300 font-semibold uppercase tracking-wider'>
              <span>Quick AI Suite</span>
              <Zap className='w-4 h-4 text-amber-400 fill-amber-400' />
            </div>
            <p className='text-sm text-slate-200 font-medium mt-1.5'>
              7 intelligent tools at your fingertips
            </p>
          </div>

          <div className='flex items-center gap-2 mt-4 pt-2 border-t border-white/10'>
            <button
              onClick={() => navigate('/ai/quick-code')}
              className='text-xs text-indigo-200 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer'
            >
              Generate Code <ArrowRight className='w-3 h-3' />
            </button>
            <span className='text-white/20'>•</span>
            <button
              onClick={() => navigate('/ai/review-resume')}
              className='text-xs text-indigo-200 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer'
            >
              Review Resume <ArrowRight className='w-3 h-3' />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className='space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          {/* Search box */}
          <div className='relative flex-1 max-w-md'>
            <Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by prompt or keyword...'
              className='w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition placeholder:text-slate-400'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600'
              >
                Clear
              </button>
            )}
          </div>

          <p className='text-xs font-medium text-slate-500'>
            Showing {filteredCreations.length} of {creations.length} creations
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className='flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar'>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Stream */}
      {loading ? (
        <div className='space-y-4'>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className='p-6 bg-white rounded-2xl border border-slate-200/60 shadow-xs animate-pulse space-y-3'
            >
              <div className='h-4 bg-slate-200 rounded w-1/3' />
              <div className='h-3 bg-slate-100 rounded w-1/4' />
            </div>
          ))}
        </div>
      ) : filteredCreations.length === 0 ? (
        <div className='text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4'>
          <div className='w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center'>
            <FolderOpen className='w-7 h-7' />
          </div>

          {searchQuery || activeFilter !== 'all' ? (
            <div className='max-w-md mx-auto space-y-2'>
              <h3 className='text-base font-semibold text-slate-800'>No matching creations</h3>
              <p className='text-xs text-slate-500'>
                We couldn't find any creations matching your search query or filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setActiveFilter('all')
                }}
                className='mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer'
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className='max-w-md mx-auto space-y-3'>
              <h3 className='text-base font-semibold text-slate-800'>No creations yet</h3>
              <p className='text-xs text-slate-500 leading-relaxed'>
                Start producing studio-quality articles, code, images, and resume analyses with
                Visionary.ai's creative engine.
              </p>
              <div className='flex flex-wrap justify-center gap-2 pt-2'>
                <button
                  onClick={() => navigate('/ai/write-article')}
                  className='px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer'
                >
                  ✍️ Write Article
                </button>
                <button
                  onClick={() => navigate('/ai/generate-images')}
                  className='px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer'
                >
                  🎨 Generate Image
                </button>
                <button
                  onClick={() => navigate('/ai/quick-code')}
                  className='px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer'
                >
                  ⚡ Quick Code
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='space-y-3.5'>
          {filteredCreations.map((item) => (
            <CreationItem key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
