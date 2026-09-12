import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Layers,
  FileText,
  Hash,
  Code,
  Image as ImageIcon,
  Sparkles,
  FolderOpen,
  LayoutGrid,
  List,
  Wand2,
  SquarePen,
  ExternalLink,
  Download,
  Trash2,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CreationItem from '../components/CreationItem'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const MyCreations = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' | 'oldest'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'compact'

  const { getToken, user } = useAuth()
  const navigate = useNavigate()

  const fetchCreations = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/user/get-user-creations', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (data.success) {
        setCreations(data.creations || [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load creations')
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    try {
      const token = await getToken()
      const { data } = await axios.delete(`/api/user/delete-creation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
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
    fetchCreations()
  }, [])

  // Filter, search & sort logic
  const processedCreations = useMemo(() => {
    let result = creations.filter((item) => {
      const matchesFilter = activeFilter === 'all' || item.type === activeFilter
      const matchesSearch =
        !searchQuery.trim() ||
        (item.prompt && item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    })

    result.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime()
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [creations, activeFilter, searchQuery, sortOrder])

  // Count by category
  const counts = useMemo(() => {
    return {
      all: creations.length,
      article: creations.filter((c) => c.type === 'article').length,
      summary: creations.filter((c) => c.type === 'summary').length,
      'quick-code': creations.filter((c) => c.type === 'quick-code').length,
      image: creations.filter((c) => c.type === 'image').length,
      'resume-review': creations.filter((c) => c.type === 'resume-review').length,
    }
  }, [creations])

  const filterTabs = [
    { key: 'all', label: 'All Assets', icon: Layers, count: counts.all },
    { key: 'article', label: 'Articles', icon: SquarePen, count: counts.article },
    { key: 'summary', label: 'Summaries', icon: Hash, count: counts.summary },
    { key: 'quick-code', label: 'Code Snippets', icon: Code, count: counts['quick-code'] },
    { key: 'image', label: 'Images & Photos', icon: ImageIcon, count: counts.image },
    { key: 'resume-review', label: 'Resume Audits', icon: FileText, count: counts['resume-review'] },
  ]

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto space-y-6'>
      {/* Header Bar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80'>
        <div>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs'>
              <Layers className='w-5 h-5' />
            </div>
            <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight'>
              My Creations Vault
            </h1>
          </div>
          <p className='text-sm text-slate-500 mt-1'>
            Organize, search, inspect, and export all assets generated with Visionary.ai.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigate('/ai')}
            className='px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-xs'
          >
            ← Studio Dashboard
          </button>
          <button
            onClick={() => navigate('/ai/write-article')}
            className='px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-sm shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer'
          >
            <Plus className='w-4 h-4' /> New Creation
          </button>
        </div>
      </div>

      {/* Control Toolbar: Search, Filters, View Mode, Sorting */}
      <div className='bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4'>
        {/* Search & Utility Bar */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
          <div className='relative flex-1 max-w-lg'>
            <Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by prompt, code snippet, or keywords...'
              className='w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition placeholder:text-slate-400'
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

          <div className='flex items-center gap-2 self-end sm:self-auto'>
            {/* Sort Order Selector */}
            <div className='flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700'>
              <ArrowUpDown className='w-3.5 h-3.5 text-slate-500' />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className='bg-transparent outline-none font-medium cursor-pointer text-xs'
              >
                <option value='newest'>Newest First</option>
                <option value='oldest'>Oldest First</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className='flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80'>
              <button
                onClick={() => setViewMode('grid')}
                title='Card View'
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className='w-4 h-4' />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                title='Compact List View'
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className='flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 pt-3'>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key
            const TabIcon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Asset Stream */}
      {loading ? (
        <div className='space-y-4'>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className='p-6 bg-white rounded-2xl border border-slate-200/60 shadow-xs animate-pulse space-y-3'
            >
              <div className='h-4 bg-slate-200 rounded w-1/3' />
              <div className='h-3 bg-slate-100 rounded w-1/4' />
            </div>
          ))}
        </div>
      ) : processedCreations.length === 0 ? (
        <div className='text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4'>
          <div className='w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center'>
            <FolderOpen className='w-7 h-7' />
          </div>

          {searchQuery || activeFilter !== 'all' ? (
            <div className='max-w-md mx-auto space-y-2'>
              <h3 className='text-base font-semibold text-slate-800'>No matching assets</h3>
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
            <div className='max-w-xl mx-auto space-y-3'>
              <h3 className='text-base font-semibold text-slate-800'>Vault is currently empty</h3>
              <p className='text-xs text-slate-500 leading-relaxed max-w-md mx-auto'>
                Start producing studio-quality articles, visual mindmaps, compiler code, generative art, and ATS resumes with Visionary.ai.
              </p>
              <div className='flex flex-wrap justify-center gap-2 pt-3'>
                <button
                  onClick={() => navigate('/ai/write-article')}
                  className='px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition cursor-pointer flex items-center gap-1.5'
                >
                  <SquarePen className='w-3.5 h-3.5' /> Write Article
                </button>
                <button
                  onClick={() => navigate('/ai/summarize-article')}
                  className='px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200/60 transition cursor-pointer flex items-center gap-1.5'
                >
                  <Hash className='w-3.5 h-3.5' /> Summarize Text
                </button>
                <button
                  onClick={() => navigate('/ai/quick-code')}
                  className='px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60 transition cursor-pointer flex items-center gap-1.5'
                >
                  <Code className='w-3.5 h-3.5' /> Quick Code
                </button>
                <button
                  onClick={() => navigate('/ai/generate-images')}
                  className='px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 transition cursor-pointer flex items-center gap-1.5'
                >
                  <ImageIcon className='w-3.5 h-3.5' /> Generate Image
                </button>
                <button
                  onClick={() => navigate('/ai/photo-cleanup')}
                  className='px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 transition cursor-pointer flex items-center gap-1.5'
                >
                  <Wand2 className='w-3.5 h-3.5' /> Photo Cleanup
                </button>
                <button
                  onClick={() => navigate('/ai/review-resume')}
                  className='px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60 transition cursor-pointer flex items-center gap-1.5'
                >
                  <FileText className='w-3.5 h-3.5' /> Review Resume
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='space-y-3.5'>
          {processedCreations.map((item) => (
            <CreationItem key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyCreations
