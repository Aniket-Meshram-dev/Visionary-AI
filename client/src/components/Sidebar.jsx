import { useAuth, Protect } from '../context/AuthContext'
import {
  Eraser,
  FileText,
  Hash,
  House,
  Image,
  LogOut,
  Scissors,
  SquarePen,
  Users,
  Code,
  Zap,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Wand2,
  Layers,
  Settings,
} from 'lucide-react'
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'

const workspaceNavItems = [
  { to: '/ai', label: 'Dashboard', Icon: House, end: true },
  { to: '/ai/creations', label: 'My Creations', Icon: Layers, end: false },
]

const studioNavItems = [
  { to: '/ai/write-article', label: 'Write Article', Icon: SquarePen, badge: null },
  { to: '/ai/summarize-article', label: 'Summarize Text', Icon: Hash, badge: null },
  { to: '/ai/quick-code', label: 'Quick Code', Icon: Code, badge: 'Fast' },
  { to: '/ai/generate-images', label: 'Generate Images', Icon: Image, badge: null },
  { to: '/ai/photo-cleanup', label: 'Photo Cleanup Studio', Icon: Wand2, badge: 'Magic' },
  { to: '/ai/review-resume', label: 'Review Resume', Icon: FileText, badge: 'ATS' },
  { to: '/ai/community', label: 'Community Feed', Icon: Users, badge: null },
]

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user, signOut, openSignIn, plan, usage, isAdmin } = useAuth()
  const navigate = useNavigate()

  const isPremium = plan === 'premium'
  const maxUsage = 10
  const remaining = Math.max(0, maxUsage - usage)
  const percent = Math.min(100, Math.round((usage / maxUsage) * 100))

  return (
    <>
      {/* Mobile backdrop */}
      {sidebar && (
        <div
          onClick={() => setSidebar(false)}
          className='fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 sm:hidden transition-opacity'
        />
      )}

      <aside
        className={`w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 z-40 transition-all duration-300 ease-in-out max-sm:fixed max-sm:top-16 max-sm:bottom-0 ${
          sidebar ? 'max-sm:translate-x-0' : 'max-sm:-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className='flex-1 overflow-y-auto px-3 py-4 space-y-6'>
          {/* User quick pill */}
          <div
            onClick={() => (!user && openSignIn ? openSignIn('sign-in') : null)}
            className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 ${
              !user ? 'cursor-pointer hover:bg-indigo-50/50' : ''
            }`}
          >
            <img
              src={
                user?.imageUrl ||
                'https://api.dicebear.com/7.x/initials/svg?seed=Guest&backgroundColor=4f46e5'
              }
              alt={user?.fullName || 'Guest'}
              className='w-10 h-10 rounded-full ring-2 ring-indigo-500/20 object-cover shrink-0'
            />
            <div className='min-w-0 flex-1'>
              <h2 className='text-xs font-semibold text-slate-800 truncate'>
                {user?.fullName || 'Guest Explorer'}
              </h2>
              <p className='text-[11px] text-slate-500 truncate'>
                {user?.email || 'Sign in to create'}
              </p>
            </div>
          </div>

          {/* Workspace Nav Items */}
          <div className='space-y-1'>
            <p className='px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2'>
              Workspace
            </p>
            {workspaceNavItems.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebar(false)}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className='truncate'>{label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>

          {/* Creation Tools Nav Items */}
          <div className='space-y-1'>
            <p className='px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2'>
              Creation Studios
            </p>
            {studioNavItems.map(({ to, label, Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebar(false)}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className='flex items-center gap-2.5 min-w-0'>
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span className='truncate'>{label}</span>
                    </div>

                    {badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {isAdmin && (
              <div className='pt-3'>
                <p className='px-3 text-[11px] font-semibold uppercase tracking-wider text-amber-500 mb-1.5 flex items-center gap-1.5'>
                  <ShieldCheck className='w-3 h-3' /> Administration
                </p>
                <NavLink
                  to='/admin'
                  onClick={() => setSidebar(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20'
                        : 'text-amber-700 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/60'
                    }`
                  }
                >
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <ShieldCheck className='w-4 h-4 shrink-0 text-amber-600 group-hover:scale-110 transition-transform' />
                    <span className='font-semibold truncate'>Admin Control Center</span>
                  </div>
                  <span className='text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide bg-amber-200/60 text-amber-900 border border-amber-300/60 shrink-0'>
                    Admin
                  </span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Usage Tracker / Upgrade Box */}
          <div className='pt-2'>
            {isPremium ? (
              <div className='p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-200/70'>
                <div className='flex items-center justify-between'>
                  <span className='flex items-center gap-1.5 text-xs font-bold text-purple-900'>
                    <Sparkles className='w-3.5 h-3.5 text-amber-500 fill-amber-500' /> Pro Plan
                  </span>
                  <span className='text-[10px] font-semibold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full'>
                    Active
                  </span>
                </div>
                <p className='text-[11px] text-purple-700/80 mt-1 leading-relaxed'>
                  Unlimited AI generations & priority high-speed pipeline enabled.
                </p>
              </div>
            ) : (
              <div className='p-3.5 rounded-xl bg-gradient-to-b from-slate-50 to-indigo-50/30 border border-slate-200/80 shadow-xs'>
                <div className='flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5'>
                  <span className='flex items-center gap-1.5'>
                    <Zap className='w-3.5 h-3.5 text-indigo-600 fill-indigo-600' /> Free Usage
                  </span>
                  <span className='text-[11px] font-mono text-slate-500'>
                    {usage} / {maxUsage}
                  </span>
                </div>

                {/* Progress bar */}
                <div className='w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden'>
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      percent >= 90
                        ? 'bg-rose-500'
                        : percent >= 60
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className='flex items-center justify-between text-[11px] text-slate-500 mt-1.5'>
                  <span>{remaining} left</span>
                  <span>{percent}% used</span>
                </div>

                <button
                  onClick={() => {
                    navigate('/#pro-plan')
                  }}
                  className='mt-3 w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-95 shadow-xs shadow-indigo-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer'
                >
                  <Zap className='w-3 h-3 fill-current' /> Upgrade to Pro ⚡
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer User Profile & SignOut */}
        <div className='border-t border-slate-200/80 p-3 flex items-center justify-between bg-slate-50/50'>
          {user ? (
            <>
              <div
                onClick={() => navigate('/ai/profile')}
                className='flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition py-1 px-1.5 rounded-lg hover:bg-slate-100/80 flex-1 mr-1'
                title='View Profile & Settings'
              >
                <img
                  src={user.imageUrl}
                  className='w-8 h-8 rounded-full ring-1 ring-slate-200 shrink-0 object-cover'
                  alt=''
                />
                <div className='min-w-0'>
                  <h3 className='text-xs font-semibold text-slate-800 truncate'>
                    {user.fullName || 'User'}
                  </h3>
                  <p className='text-[10px] text-slate-500 flex items-center gap-1'>
                    <Protect plan='premium' fallback={<span>Free Tier</span>}>
                      <span className='text-indigo-600 font-semibold'>Pro Member</span>
                    </Protect>
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-0.5 shrink-0'>
                <button
                  onClick={() => navigate('/ai/profile')}
                  title='Profile & Settings'
                  className='p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer'
                  aria-label='Settings'
                >
                  <Settings className='w-4 h-4' />
                </button>
                <button
                  onClick={() => signOut()}
                  title='Sign Out'
                  className='p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer'
                  aria-label='Sign out'
                >
                  <LogOut className='w-4 h-4' />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => openSignIn && openSignIn('sign-in')}
              className='w-full py-2 px-3 rounded-xl bg-primary hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer'
            >
              Sign In to Account
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
