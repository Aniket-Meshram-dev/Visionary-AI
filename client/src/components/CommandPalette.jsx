import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  SquarePen,
  FileText,
  Code,
  Image as ImageIcon,
  Scissors,
  Eraser,
  Award,
  LayoutDashboard,
  Users,
  Crown,
  Shield,
  ArrowRight,
  Sparkles,
  X,
  ExternalLink,
  Copy,
  LogOut,
  LogIn,
  Wand2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const navigate = useNavigate()
  const { user, isAdmin, openSignIn, signOut } = useAuth()
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Listen for keyboard shortcut (Ctrl+K or Cmd+K) and custom open event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    const handleCustomOpen = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleCustomOpen)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleCustomOpen)
    }
  }, [isOpen])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const commandItems = useMemo(() => {
    const items = [
      // AI Tools
      {
        id: 'article',
        category: 'AI Creator Studios',
        name: 'AI Article Writer',
        desc: 'Generate long-form articles, essays, and SEO blogs',
        icon: SquarePen,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        action: () => navigate('/ai/write-article'),
      },
      {
        id: 'summary',
        category: 'AI Creator Studios',
        name: 'Summarize Text & Documents',
        desc: 'Condense long articles and notes with custom reduction',
        icon: FileText,
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        action: () => navigate('/ai/summarize-article'),
      },
      {
        id: 'code',
        category: 'AI Creator Studios',
        name: 'Quick Code Generator & Sandbox',
        desc: 'Produce clean snippets in 10+ languages with live runner',
        icon: Code,
        color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        action: () => navigate('/ai/quick-code'),
      },
      {
        id: 'image',
        category: 'AI Creator Studios',
        name: 'AI Image Studio (FLUX.1)',
        desc: 'Photorealistic, 3D, Anime, and Ghibli text-to-image synthesis',
        icon: ImageIcon,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        action: () => navigate('/ai/generate-images'),
      },
      {
        id: 'photo-cleanup',
        category: 'AI Creator Studios',
        name: 'AI Photo Cleanup & Magic Studio',
        desc: '1-click transparent background cutout and smart AI object eraser',
        icon: Wand2,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        action: () => navigate('/ai/photo-cleanup'),
      },
      {
        id: 'resume',
        category: 'AI Creator Studios',
        name: 'ATS Resume Reviewer & Matcher',
        desc: 'Audit resumes with executive ATS scoring and keyword tips',
        icon: Award,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        action: () => navigate('/ai/review-resume'),
      },

      // Navigation
      {
        id: 'dashboard',
        category: 'Workspace & Navigation',
        name: 'My Dashboard & Creations',
        desc: 'Manage your personal library of AI-generated content',
        icon: LayoutDashboard,
        color: 'text-slate-300 bg-slate-800 border-slate-700',
        action: () => navigate('/ai'),
      },
      {
        id: 'community',
        category: 'Workspace & Navigation',
        name: 'Community Feed Gallery',
        desc: 'Discover public AI creations and trending prompts',
        icon: Users,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        action: () => navigate('/ai/community'),
      },
      {
        id: 'pricing',
        category: 'Workspace & Navigation',
        name: 'View Pricing & Pro Plans',
        desc: 'Unlimited generations and access to premium media tools',
        icon: Crown,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        action: () => navigate('/#pro-plan'),
      },
    ]

    if (isAdmin) {
      items.push({
        id: 'admin',
        category: 'Workspace & Navigation',
        name: 'Admin Control Center',
        desc: 'Overview metrics, user directory, and community moderation',
        icon: Shield,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        action: () => navigate('/admin'),
      })
    }

    // Account Actions
    if (user) {
      items.push({
        id: 'copy-email',
        category: 'Account Actions',
        name: `Copy Email (${user.email})`,
        desc: 'Copy your active sign-in email address',
        icon: Copy,
        color: 'text-slate-400 bg-slate-800 border-slate-700',
        action: () => {
          navigator.clipboard.writeText(user.email)
          toast.success('Email copied to clipboard')
        },
      })
      items.push({
        id: 'sign-out',
        category: 'Account Actions',
        name: 'Sign Out of Account',
        desc: 'Safely end your current session',
        icon: LogOut,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        action: () => signOut(),
      })
    } else {
      items.push({
        id: 'sign-in',
        category: 'Account Actions',
        name: 'Sign In / Register',
        desc: 'Access your creations and free AI credits',
        icon: LogIn,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        action: () => openSignIn('sign-in'),
      })
    }

    return items
  }, [isAdmin, user, navigate, openSignIn, signOut])

  const filteredItems = useMemo(() => {
    if (!query.trim()) return commandItems
    const q = query.toLowerCase()
    return commandItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [commandItems, query])

  const handleSelect = (item) => {
    setIsOpen(false)
    item.action()
  }

  // Key navigation within the filtered results
  const handleInputKeyDown = (e) => {
    if (filteredItems.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex])
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200'
      onClick={() => setIsOpen(false)}
    >
      <div
        className='w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col text-slate-200 ring-1 ring-white/10'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className='p-4 px-5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60'>
          <Search className='w-5 h-5 text-indigo-400 shrink-0' />
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder='Type a command or search tools (e.g. "code", "article", "resume")...'
            className='w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 outline-none'
          />
          <button
            onClick={() => setIsOpen(false)}
            className='p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className='max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-800/40'>
          {filteredItems.length === 0 ? (
            <div className='py-12 text-center text-slate-500 text-xs sm:text-sm'>
              No matching tools or commands found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon
              const isSelected = selectedIndex === index

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className={`p-2 rounded-lg border shrink-0 ${item.color}`}>
                      <Icon className='w-4 h-4' />
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs sm:text-sm font-semibold truncate'>
                          {item.name}
                        </span>
                        <span className='text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-700/60 hidden sm:inline'>
                          {item.category}
                        </span>
                      </div>
                      <p className='text-[11px] text-slate-400 truncate mt-0.5'>{item.desc}</p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 text-indigo-400 transition-transform shrink-0 ${
                      isSelected ? 'translate-x-0.5 opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              )
            })
          )}
        </div>

        {/* Keyboard Footer Helper */}
        <div className='px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500'>
          <div className='flex items-center gap-3'>
            <span>
              <kbd className='px-1.5 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-slate-300 font-mono text-[10px]'>
                ↑
              </kbd>{' '}
              <kbd className='px-1.5 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-slate-300 font-mono text-[10px]'>
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className='px-1.5 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-slate-300 font-mono text-[10px]'>
                ↵
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className='px-1.5 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-slate-300 font-mono text-[10px]'>
                ESC
              </kbd>{' '}
              Close
            </span>
          </div>
          <span className='hidden sm:inline text-indigo-400 font-medium'>
            Visionary Quick Jump ⚡
          </span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
