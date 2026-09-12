import { useAuth } from '../context/AuthContext'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  Search,
  Users,
  Image as ImageIcon,
  FileText,
  Code,
  Hash,
  Sparkles,
  Clipboard,
  Check,
  Download,
  ExternalLink,
  Calendar,
  Layers,
  Share2,
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Markdown from 'react-markdown'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const Community = () => {
  const navigate = useNavigate()
  const [creations, setCreations] = useState([])
  const { user, getToken, openSignIn } = useAuth()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [copiedId, setCopiedId] = useState(null)

  const handleRemix = (creation) => {
    let path = '/ai/write-article'
    if (creation.type === 'image') path = '/ai/generate-images'
    else if (creation.type === 'quick-code') path = '/ai/quick-code'
    else if (creation.type === 'summary') path = '/ai/summarize-article'
    else if (creation.type === 'resume-review') path = '/ai/review-resume'
    navigate(`${path}?prompt=${encodeURIComponent(creation.prompt)}`)
  }

  const fetchCreations = async () => {
    try {
      const token = await getToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const { data } = await axios.get('/api/user/get-published-creations', {
        headers,
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

  const imageLikeToggle = async (id) => {
    if (!user) {
      openSignIn('sign-in')
      return
    }
    const userIdStr = user.id.toString()

    // Optimistic UI update
    setCreations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const alreadyLiked = item.likes?.includes(userIdStr)
          const newLikes = alreadyLiked
            ? item.likes.filter((u) => u !== userIdStr)
            : [...(item.likes || []), userIdStr]
          return { ...item, likes: newLikes }
        }
        return item
      })
    )

    try {
      const { data } = await axios.post(
        '/api/user/toggle-like-creation',
        { id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (!data.success) {
        toast.error(data.message)
        // Rollback on failure
        fetchCreations()
      }
    } catch (error) {
      toast.error('Failed to update like')
      fetchCreations()
    }
  }

  const handleCopyPrompt = (id, prompt) => {
    if (!prompt) return
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(id)
      toast.success('Prompt copied!')
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleShare = (id) => {
    const url = `${window.location.origin}/share/${id}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      toast.success('Share link copied!')
    } else {
      window.open(`/share/${id}`, '_blank')
    }
  }

  useEffect(() => {
    fetchCreations()
  }, [user])

  // Filter & search
  const filteredCreations = useMemo(() => {
    return creations.filter((item) => {
      const matchesTab = activeTab === 'all' || item.type === activeTab
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        (item.prompt && item.prompt.toLowerCase().includes(query)) ||
        (item.content && item.content.toLowerCase().includes(query))
      return matchesTab && matchesSearch
    })
  }, [creations, activeTab, searchQuery])

  const counts = useMemo(() => {
    return {
      all: creations.length,
      image: creations.filter((c) => c.type === 'image').length,
      article: creations.filter((c) => c.type === 'article').length,
      'quick-code': creations.filter((c) => c.type === 'quick-code').length,
      summary: creations.filter((c) => c.type === 'summary').length,
    }
  }, [creations])

  const tabs = [
    { key: 'all', label: 'All Artifacts', count: counts.all },
    { key: 'image', label: 'Images', count: counts.image },
    { key: 'article', label: 'Articles', count: counts.article },
    { key: 'quick-code', label: 'Code', count: counts['quick-code'] },
    { key: 'summary', label: 'Summaries', count: counts.summary },
  ]

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80'>
        <div>
          <div className='flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase'>
            <Users className='w-4 h-4' /> Global Community
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
            Visionary Creators Showcase
          </h1>
          <p className='text-xs sm:text-sm text-slate-500 mt-1'>
            Explore, like, and copy prompt templates created by members of the Visionary.ai ecosystem.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className='space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          {/* Search */}
          <div className='relative flex-1 max-w-md'>
            <Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search community creations or prompts...'
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
            Showing {filteredCreations.length} public assets
          </p>
        </div>

        {/* Filter Pills */}
        <div className='flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar'>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Showcase */}
      {loading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className='bg-white rounded-2xl border border-slate-200/70 p-4 h-72 animate-pulse space-y-3'
            >
              <div className='h-44 bg-slate-100 rounded-xl w-full' />
              <div className='h-4 bg-slate-100 rounded w-2/3' />
              <div className='h-3 bg-slate-100 rounded w-1/3' />
            </div>
          ))}
        </div>
      ) : filteredCreations.length === 0 ? (
        <div className='text-center py-20 px-4 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3'>
          <div className='w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center'>
            <Sparkles className='w-7 h-7' />
          </div>
          <h3 className='text-base font-semibold text-slate-800'>No creations match your filter</h3>
          <p className='text-xs text-slate-500 max-w-sm mx-auto'>
            Try resetting your search query or generate and publish your own AI creations to the feed.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {filteredCreations.map((creation) => {
            const isLiked = creation.likes?.includes(user?.id?.toString())
            const isImage = creation.type === 'image'
            const isCode = creation.type === 'quick-code'
            const isArticle = creation.type === 'article'
            const isSummary = creation.type === 'summary'

            return (
              <div
                key={creation.id}
                className='bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group'
              >
                {/* Visual Header / Content Preview */}
                {isImage ? (
                  <div className='relative aspect-square w-full bg-slate-950 overflow-hidden'>
                    <img
                      src={creation.content}
                      alt={creation.prompt}
                      className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                      loading='lazy'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between'>
                      <div className='flex justify-end'>
                        <a
                          href={creation.content}
                          target='_blank'
                          rel='noreferrer'
                          className='p-2 rounded-lg bg-black/60 hover:bg-black text-white text-xs backdrop-blur-md transition'
                          title='Full resolution'
                        >
                          <ExternalLink className='w-3.5 h-3.5' />
                        </a>
                      </div>
                      <p className='text-xs text-white font-medium line-clamp-3 leading-relaxed'>
                        {creation.prompt}
                      </p>
                    </div>
                  </div>
                ) : isCode ? (
                  <div className='h-48 p-3.5 bg-slate-950 font-mono text-[11px] text-indigo-100 overflow-hidden relative border-b border-slate-800'>
                    <div className='flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400'>
                      <span className='flex items-center gap-1.5'>
                        <Code className='w-3 h-3 text-violet-400' /> Code Snippet
                      </span>
                    </div>
                    <pre className='line-clamp-6 opacity-90 leading-relaxed'>{creation.content}</pre>
                  </div>
                ) : (
                  <div className='h-48 p-4 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative border-b border-slate-100'>
                    <div className='flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-2'>
                      <FileText className='w-3.5 h-3.5' /> {isArticle ? 'Article' : 'Summary'}
                    </div>
                    <div className='prose prose-xs text-xs text-slate-600 line-clamp-5 reset-tw leading-relaxed'>
                      <Markdown>{creation.content}</Markdown>
                    </div>
                  </div>
                )}

                {/* Card Details & Actions Footer */}
                <div className='p-4 flex-1 flex flex-col justify-between gap-3'>
                  <div>
                    <h3 className='text-xs font-semibold text-slate-800 line-clamp-2 leading-snug'>
                      {creation.prompt}
                    </h3>
                  </div>

                  <div className='flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500 gap-2 flex-wrap'>
                    <div className='flex items-center gap-2'>
                      {/* Copy Prompt */}
                      <button
                        onClick={() => handleCopyPrompt(creation.id, creation.prompt)}
                        className='flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 transition cursor-pointer'
                        title='Copy prompt'
                      >
                        {copiedId === creation.id ? (
                          <Check className='w-3.5 h-3.5 text-emerald-600' />
                        ) : (
                          <Clipboard className='w-3.5 h-3.5' />
                        )}
                        <span>{copiedId === creation.id ? 'Copied' : 'Prompt'}</span>
                      </button>

                      {/* Remix Prompt */}
                      <button
                        onClick={() => handleRemix(creation)}
                        className='flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium transition cursor-pointer'
                        title='Remix this prompt in AI Studio'
                      >
                        <Sparkles className='w-3.5 h-3.5' />
                        <span>Remix</span>
                      </button>

                      {/* Share public link */}
                      <button
                        onClick={() => handleShare(creation.id)}
                        className='flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 transition cursor-pointer'
                        title='Share public link'
                      >
                        <Share2 className='w-3.5 h-3.5' />
                        <span>Share</span>
                      </button>

                      {/* Open public showcase */}
                      <a
                        href={`/share/${creation.id}`}
                        target='_blank'
                        rel='noreferrer'
                        className='flex items-center text-slate-400 hover:text-indigo-600 transition p-0.5'
                        title='Open public showcase page'
                      >
                        <ExternalLink className='w-3.5 h-3.5' />
                      </a>
                    </div>

                    {/* Like button */}
                    <button
                      onClick={() => imageLikeToggle(creation.id)}
                      className='flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer shrink-0'
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                          isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                        }`}
                      />
                      <span className='font-mono text-xs font-medium text-slate-700'>
                        {creation.likes?.length || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Community
