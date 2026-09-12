import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  Download,
  Heart,
  ExternalLink,
  Code,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  SquarePen,
  Calendar,
  Layers,
  Wand2,
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { assets } from '../assets/assets'
import { useAuth } from '../context/AuthContext'

const PublicShare = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, getToken, openSignIn } = useAuth()

  const [creation, setCreation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

  useEffect(() => {
    const fetchCreation = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`${baseURL}/api/user/get-creation/${id}`)
        if (data.success && data.creation) {
          setCreation(data.creation)
        } else {
          setCreation(null)
        }
      } catch (err) {
        console.error('Fetch public creation error:', err)
        setCreation(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchCreation()
  }, [id, baseURL])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedLink(true)
      toast.success('Public link copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  const handleCopyPrompt = () => {
    if (!creation?.prompt) return
    navigator.clipboard.writeText(creation.prompt).then(() => {
      setCopiedPrompt(true)
      toast.success('Prompt copied!')
      setTimeout(() => setCopiedPrompt(false), 2000)
    })
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Check out this AI creation made on Visionary AI: "${creation?.prompt?.slice(0, 80)}..."\n\n${window.location.href}`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const handleRemix = () => {
    if (!creation) return
    const promptText = encodeURIComponent(creation.prompt || '')

    if (creation.type === 'image') {
      navigate(`/ai/generate-images?prompt=${promptText}`)
    } else if (creation.type === 'quick-code') {
      navigate(`/ai/quick-code?prompt=${promptText}`)
    } else if (creation.type === 'article') {
      navigate(`/ai/write-article?prompt=${promptText}`)
    } else if (creation.type === 'summary') {
      navigate(`/ai/summarize-article`)
    } else {
      navigate('/ai')
    }
    toast.success('Prompt loaded into Studio! Remix away ⚡')
  }

  const handleLike = async () => {
    if (!user) {
      openSignIn('sign-in')
      return
    }

    const userIdStr = user.id.toString()
    const alreadyLiked = creation.likes?.includes(userIdStr)
    const newLikes = alreadyLiked
      ? creation.likes.filter((u) => u !== userIdStr)
      : [...(creation.likes || []), userIdStr]

    setCreation((prev) => ({ ...prev, likes: newLikes }))

    try {
      const token = await getToken()
      await axios.post(
        `${baseURL}/api/user/toggle-like-creation`,
        { id: creation.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      toast.error('Failed to update like')
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-[#07090E] text-slate-200 flex flex-col items-center justify-center space-y-4'>
        <div className='w-12 h-12 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin' />
        <p className='text-sm font-medium text-slate-400'>Loading AI Creation...</p>
      </div>
    )
  }

  if (!creation) {
    return (
      <div className='min-h-screen bg-[#07090E] text-slate-200 flex flex-col items-center justify-center p-4 text-center space-y-4'>
        <div className='w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500'>
          <Sparkles className='w-8 h-8' />
        </div>
        <h2 className='text-xl font-bold text-white'>Creation Not Found</h2>
        <p className='text-xs text-slate-400 max-w-sm'>
          This AI creation may have been removed, made private, or the link is invalid.
        </p>
        <Link
          to='/'
          className='px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer'
        >
          Explore Visionary AI
        </Link>
      </div>
    )
  }

  const isLiked = user && creation.likes?.includes(user.id.toString())

  return (
    <div className='min-h-screen bg-[#07090E] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden'>
      {/* Navbar Header */}
      <header className='border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-3.5'>
        <div className='max-w-6xl mx-auto flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3 cursor-pointer' onClick={() => navigate('/')}>
            <img src={assets.logoLight} alt='Visionary AI' className='h-7 sm:h-8 object-contain' />
          </div>

          <div className='flex items-center gap-3'>
            <button
              onClick={handleCopyLink}
              className='px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer'
            >
              {copiedLink ? <Check className='w-3.5 h-3.5 text-emerald-400' /> : <Share2 className='w-3.5 h-3.5' />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => navigate('/ai')}
              className='px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-600/30 transition cursor-pointer'
            >
              Launch Studio ⚡
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8'>
        {/* Creation Card */}
        <div className='bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden'>
          {/* Header metadata bar */}
          <div className='p-4 sm:p-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-950/40'>
            <div className='flex items-center gap-2.5'>
              <span className='text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'>
                {creation.type}
              </span>
              <span className='text-xs text-slate-400 flex items-center gap-1'>
                <Calendar className='w-3 h-3' />
                {new Date(creation.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Social Action Buttons */}
            <div className='flex items-center gap-2'>
              <button
                onClick={handleLike}
                className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                  isLiked
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/80'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{creation.likes?.length || 0}</span>
              </button>

              <button
                onClick={handleShareTwitter}
                className='p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 text-xs font-medium transition cursor-pointer flex items-center gap-1'
                title='Share to X (Twitter)'
              >
                <span>𝕏 Post</span>
              </button>

              <button
                onClick={handleRemix}
                className='px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs'
              >
                <Wand2 className='w-3.5 h-3.5' />
                <span>Remix Prompt</span>
              </button>
            </div>
          </div>

          {/* Body Preview */}
          <div className='p-6 sm:p-8'>
            {creation.type === 'image' ? (
              <div className='space-y-6'>
                <div className='rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[650px]'>
                  <img
                    src={creation.content}
                    alt={creation.prompt}
                    className='w-full h-auto object-contain max-h-[650px]'
                  />
                </div>
              </div>
            ) : creation.type === 'quick-code' ? (
              <div className='bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs leading-relaxed overflow-x-auto text-slate-200'>
                <pre>
                  <code>{creation.content}</code>
                </pre>
              </div>
            ) : (
              <div className='bg-slate-950/60 p-6 sm:p-8 rounded-2xl border border-slate-800/80 prose prose-invert max-w-none text-slate-200 leading-relaxed text-sm'>
                <MarkdownRenderer content={creation.content} />
              </div>
            )}

            {/* Prompt details box */}
            {creation.prompt && (
              <div className='mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-4'>
                <div className='space-y-1 min-w-0'>
                  <p className='text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold'>
                    Original Generation Prompt
                  </p>
                  <p className='text-xs sm:text-sm text-slate-300 italic leading-relaxed'>
                    "{creation.prompt}"
                  </p>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  title='Copy prompt'
                  className='p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 shrink-0 transition cursor-pointer'
                >
                  {copiedPrompt ? <Check className='w-3.5 h-3.5 text-emerald-400' /> : <Copy className='w-3.5 h-3.5' />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Viral CTA Box */}
        <div className='p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border border-indigo-900/60 text-center space-y-4 shadow-2xl'>
          <h3 className='text-xl sm:text-2xl font-bold text-white'>
            Create your own AI masterpieces in seconds
          </h3>
          <p className='text-xs sm:text-sm text-slate-400 max-w-lg mx-auto'>
            Get started with 10 free generations across Article Writing, Code, Photorealistic Images, and Resume Auditing.
          </p>
          <div className='pt-2 flex items-center justify-center gap-3'>
            <button
              onClick={() => navigate('/ai')}
              className='px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition cursor-pointer'
            >
              Start Creating Free 🚀
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PublicShare
