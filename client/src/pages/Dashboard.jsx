import React, { useEffect, useState } from 'react'
import {
  Gem,
  Sparkles,
  Plus,
  ArrowRight,
  FolderOpen,
  Zap,
  Image as ImageIcon,
  FileText,
  Code,
  Hash,
  Layers,
  Wand2,
  SquarePen,
  Users,
  Compass,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CreationItem from '../components/CreationItem'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const Dashboard = () => {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)

  const { getToken, user, plan, usage } = useAuth()
  const navigate = useNavigate()

  const isPremium = plan === 'premium'

  const getDashboardData = async () => {
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
    getDashboardData()
  }, [])

  // Top 3 recent creations
  const recentCreations = creations.slice(0, 3)

  // All 6 Upgraded Creation Studios
  const studioCards = [
    {
      title: 'Write Article',
      badge: '3-Stage Agentic',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
      description: 'Autonomous research, auto outline, SEO cover art & omni-channel repurposing.',
      route: '/ai/write-article',
      icon: SquarePen,
      gradient: 'from-blue-500 to-indigo-600',
      cta: 'Launch Writer',
    },
    {
      title: 'Summarize Text',
      badge: 'Mindmap & Audio',
      badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
      description: 'Interactive visual mindmaps, natural voice TTS audio briefing & doc ingestion.',
      route: '/ai/summarize-article',
      icon: Hash,
      gradient: 'from-cyan-500 to-blue-600',
      cta: 'Summarize Content',
    },
    {
      title: 'Quick Code',
      badge: 'FAST Compiler',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200/80',
      description: '15+ languages compiler sandbox, execution runner & Big-O complexity analyzer.',
      route: '/ai/quick-code',
      icon: Code,
      gradient: 'from-violet-500 to-purple-600',
      cta: 'Run & Compile Code',
    },
    {
      title: 'Generate Images',
      badge: 'FLUX.1 Turbo',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      description: 'Photorealistic FLUX.1 synthesis, prompt enhancer, image remix & 5 aspect ratios.',
      route: '/ai/generate-images',
      icon: ImageIcon,
      gradient: 'from-emerald-500 to-teal-600',
      cta: 'Synthesize Images',
    },
    {
      title: 'Photo Cleanup Studio',
      badge: 'MAGIC',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
      description: '1-click HD background removal & generative inpainting object eraser.',
      route: '/ai/photo-cleanup',
      icon: Wand2,
      gradient: 'from-rose-500 to-pink-600',
      cta: 'Magic Cleanup',
    },
    {
      title: 'Review Resume',
      badge: 'ATS Recruiter',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
      description: 'ATS recruiter audit, 1-click Google XYZ bullet optimizer & cover letter builder.',
      route: '/ai/review-resume',
      icon: FileText,
      gradient: 'from-amber-500 to-orange-600',
      cta: 'Audit Resume',
    },
  ]

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto space-y-8'>
      {/* Header Banner */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight'>
              Welcome back, {user?.fullName?.split(' ')[0] || 'Creator'} 👋
            </h1>
          </div>
          <p className='text-sm text-slate-500 mt-1'>
            Your creative workspace command center. Launch specialized studios and monitor assets.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigate('/ai/creations')}
            className='px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition flex items-center gap-1.5 cursor-pointer'
          >
            <Layers className='w-4 h-4 text-indigo-600' /> My Creations ({creations.length})
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
        <div
          onClick={() => navigate('/ai/creations')}
          className='p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-indigo-300 transition'
        >
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
              Total Creations Vault
            </p>
            <h2 className='text-3xl font-bold text-slate-900 mt-1'>{creations.length}</h2>
            <p className='text-xs text-indigo-600 font-semibold mt-0.5 flex items-center gap-1'>
              Manage & view all assets →
            </p>
          </div>
          <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20'>
            <Layers className='w-6 h-6' />
          </div>
        </div>

        {/* Plan Status */}
        <div
          onClick={() => navigate('/ai/profile')}
          className='p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-pink-300 transition'
        >
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
              Active Membership
            </p>
            <h2 className='text-3xl font-bold text-slate-900 mt-1'>
              {isPremium ? 'Pro Member' : 'Free Tier'}
            </h2>
            <p className='text-xs text-slate-500 mt-0.5'>
              {isPremium ? 'Unlimited High-Speed AI Pipeline' : `${Math.max(0, 10 - usage)} of 10 free uses left`}
            </p>
          </div>
          <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20'>
            <Gem className='w-6 h-6' />
          </div>
        </div>

        {/* AI Engine Status */}
        <div className='p-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-1'>
          <div>
            <div className='flex items-center justify-between text-xs text-indigo-300 font-semibold uppercase tracking-wider'>
              <span>AI Engine Platform</span>
              <span className='flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' /> 7 Studios Online
              </span>
            </div>
            <p className='text-sm text-slate-200 font-medium mt-2'>
              High-speed neural inference & multimodal agents ready
            </p>
          </div>

          <div className='flex items-center gap-3 mt-4 pt-2.5 border-t border-white/10 text-xs'>
            <button
              onClick={() => navigate('/ai/quick-code')}
              className='text-indigo-200 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer transition'
            >
              <Code className='w-3 h-3 text-emerald-400' /> Quick Code
            </button>
            <span className='text-white/20'>•</span>
            <button
              onClick={() => navigate('/ai/photo-cleanup')}
              className='text-indigo-200 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer transition'
            >
              <Wand2 className='w-3 h-3 text-rose-400' /> Photo Cleanup
            </button>
            <span className='text-white/20'>•</span>
            <button
              onClick={() => navigate('/ai/review-resume')}
              className='text-indigo-200 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer transition'
            >
              <FileText className='w-3 h-3 text-amber-400' /> ATS Resume
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated AI Creation Studios Launchpad */}
      <div className='space-y-3.5'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2'>
              <Sparkles className='w-4.5 h-4.5 text-indigo-600' /> AI Creation Studios
            </h2>
            <p className='text-xs text-slate-500 mt-0.5'>
              6 purpose-built creative power tools with real-time neural processing
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {studioCards.map((tool) => {
            const Icon = tool.icon
            return (
              <div
                key={tool.title}
                onClick={() => navigate(tool.route)}
                className='group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer'
              >
                <div>
                  <div className='flex items-center justify-between mb-3'>
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      <Icon className='w-5 h-5' />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${tool.badgeClass}`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className='text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors'>
                    {tool.title}
                  </h3>
                  <p className='text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2'>
                    {tool.description}
                  </p>
                </div>

                <div className='mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700'>
                  <span>{tool.cta}</span>
                  <ArrowRight className='w-3.5 h-3.5 group-hover:translate-x-1 transition-transform' />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Community Spotlight Banner */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-slate-800 p-5 sm:p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm'>
        <div className='flex items-start gap-3.5'>
          <div className='w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30'>
            <Users className='w-5 h-5 text-white' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-sm sm:text-base font-bold text-white'>Explore Community Feed</h3>
              <span className='px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'>
                Trending Creations
              </span>
            </div>
            <p className='text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed'>
              Discover viral community creations, inspect AI prompts & styles, and share your own masterpieces.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/ai/community')}
          className='px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer shrink-0'
        >
          View Community Feed <ArrowRight className='w-4 h-4' />
        </button>
      </div>

      {/* Recent Creations Section */}
      <div className='space-y-4 pt-2'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2'>
              <Layers className='w-4.5 h-4.5 text-indigo-600' /> Recent Creations
            </h2>
            <p className='text-xs text-slate-500 mt-0.5'>
              Quick access to your latest outputs. Check the vault for full management.
            </p>
          </div>

          {creations.length > 0 && (
            <button
              onClick={() => navigate('/ai/creations')}
              className='text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition'
            >
              View All My Creations ({creations.length}) <ArrowRight className='w-3.5 h-3.5' />
            </button>
          )}
        </div>

        {loading ? (
          <div className='space-y-3'>
            {[1, 2].map((n) => (
              <div
                key={n}
                className='p-5 bg-white rounded-2xl border border-slate-200/60 shadow-xs animate-pulse space-y-2'
              >
                <div className='h-4 bg-slate-200 rounded w-1/3' />
                <div className='h-3 bg-slate-100 rounded w-1/4' />
              </div>
            ))}
          </div>
        ) : recentCreations.length === 0 ? (
          <div className='text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3'>
            <div className='w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center'>
              <FolderOpen className='w-6 h-6' />
            </div>
            <h3 className='text-sm font-bold text-slate-800'>No creations yet</h3>
            <p className='text-xs text-slate-500 max-w-sm mx-auto'>
              Choose any creative studio above to start generating studio-quality articles, code, art, and resumes.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {recentCreations.map((item) => (
              <CreationItem key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
