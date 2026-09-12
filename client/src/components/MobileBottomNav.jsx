import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  House,
  Image,
  Wand2,
  Users,
  Grid,
  SquarePen,
  Hash,
  Code,
  FileText,
  X,
  Sparkles,
  ChevronRight,
  Layers,
  Settings,
} from 'lucide-react'

export const MobileBottomNav = ({ onOpenSidebar }) => {
  const [showToolsSheet, setShowToolsSheet] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const workspaceTools = [
    { to: '/ai/creations', label: 'My Creations Vault', desc: 'Search, filter & export all generated assets', Icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
    { to: '/ai/profile', label: 'Profile & Settings', desc: 'Avatar photo, bio & generation defaults', Icon: Settings, color: 'text-slate-700 bg-slate-100' },
  ]

  const allStudioTools = [
    { to: '/ai/write-article', label: 'Write Article', desc: 'Autonomous 3-stage agentic engine', Icon: SquarePen, color: 'text-blue-500 bg-blue-50' },
    { to: '/ai/summarize-article', label: 'Summarize Text', desc: 'AI visual mindmaps & TTS briefings', Icon: Hash, color: 'text-indigo-500 bg-indigo-50' },
    { to: '/ai/quick-code', label: 'Quick Code', desc: 'Fast code generation & execution', Icon: Code, color: 'text-emerald-500 bg-emerald-50' },
    { to: '/ai/generate-images', label: 'Generate Images', desc: 'Photorealistic FLUX & remix styles', Icon: Image, color: 'text-purple-500 bg-purple-50' },
    { to: '/ai/photo-cleanup', label: 'Photo Cleanup Studio', desc: 'Magic background & object removal', Icon: Wand2, color: 'text-rose-500 bg-rose-50' },
    { to: '/ai/review-resume', label: 'Review Resume', desc: 'ATS recruiter score & XYZ optimizer', Icon: FileText, color: 'text-amber-500 bg-amber-50' },
  ]

  const navButtons = [
    { to: '/ai', label: 'Home', Icon: House, end: true },
    { to: '/ai/generate-images', label: 'Images', Icon: Image, end: false },
    { to: '/ai/photo-cleanup', label: 'Cleanup', Icon: Wand2, end: false },
    { to: '/ai/community', label: 'Feed', Icon: Users, end: false },
  ]

  const isToolActive = allStudioTools.some(tool => location.pathname === tool.to)

  return (
    <>
      {/* 1. Quick Studio Sheet Modal on Mobile */}
      {showToolsSheet && (
        <div className='fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200'>
          <div
            className='absolute inset-0'
            onClick={() => setShowToolsSheet(false)}
          />
          <div className='relative bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200/80 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300'>
            {/* Sheet Handle */}
            <div className='w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4' />

            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='text-sm font-bold text-slate-900 flex items-center gap-1.5'>
                  <Sparkles className='w-4 h-4 text-indigo-600' /> All AI Creation Tools
                </h3>
                <p className='text-[11px] text-slate-500'>Select a tool to launch studio workspace</p>
              </div>
              <button
                onClick={() => setShowToolsSheet(false)}
                className='p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition cursor-pointer'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Workspace quick actions */}
            <div className='grid grid-cols-2 gap-2 mb-3'>
              {workspaceTools.map(({ to, label, Icon, color }) => (
                <button
                  key={to}
                  onClick={() => {
                    setShowToolsSheet(false)
                    navigate(to)
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition text-left cursor-pointer ${
                    location.pathname === to
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className='w-4 h-4' />
                  </div>
                  <div className='text-xs font-bold text-slate-800 truncate'>{label}</div>
                </button>
              ))}
            </div>

            <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2'>
              Creation Studios
            </p>

            <div className='grid grid-cols-1 gap-2 pb-6'>
              {allStudioTools.map(({ to, label, desc, Icon, color }) => (
                <button
                  key={to}
                  onClick={() => {
                    setShowToolsSheet(false)
                    navigate(to)
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition text-left cursor-pointer ${
                    location.pathname === to
                      ? 'bg-indigo-50/60 border-indigo-200 shadow-xs'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/70'
                  }`}
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className='w-5 h-5' />
                    </div>
                    <div className='min-w-0'>
                      <div className='text-xs font-bold text-slate-800 truncate'>{label}</div>
                      <div className='text-[11px] text-slate-500 truncate'>{desc}</div>
                    </div>
                  </div>
                  <ChevronRight className='w-4 h-4 text-slate-400 shrink-0 ml-2' />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Docked Bottom Navigation Bar (Visible on mobile/phablet < 768px) */}
      <nav
        aria-label="Mobile Navigation"
        className='fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-lg shadow-slate-900/5 px-2 pb-[env(safe-area-inset-bottom,0px)]'
      >
        <div className='flex items-center justify-around h-14'>
          {navButtons.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-9 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 scale-105'
                        : 'text-slate-500'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                  </div>
                  <span className='mt-0.5 tracking-tight'>{label}</span>
                  {isActive && (
                    <span className='absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full' />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Tools Drawer Button */}
          <button
            onClick={() => setShowToolsSheet(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-all cursor-pointer ${
              isToolActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label='Open Studio Tools'
          >
            <div
              className={`w-9 h-7 rounded-xl flex items-center justify-center transition-all ${
                isToolActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 scale-105'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Grid className='w-4 h-4' />
            </div>
            <span className='mt-0.5 tracking-tight'>Tools</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default MobileBottomNav
