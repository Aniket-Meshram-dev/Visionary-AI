import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  LayoutDashboard,
  Users,
  Zap,
  Sparkles,
  ChevronDown,
  User as UserIcon,
  Shield,
  Layers,
  Settings as SettingsIcon,
} from 'lucide-react'

const UserDropdown = () => {
  const { user, signOut, plan, usage } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const isPremium = plan === 'premium'
  const maxUsage = 10
  const remaining = Math.max(0, maxUsage - usage)

  return (
    <div className='relative inline-block text-left' ref={dropdownRef}>
      {/* Avatar Trigger Button */}
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer ring-1 ring-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500'
        aria-expanded={open}
        aria-haspopup='true'
      >
        <img
          src={user.imageUrl}
          alt={user.fullName}
          className='w-8 h-8 rounded-full object-cover'
        />
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className='absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-900/10 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150'>
          {/* User Profile Header */}
          <div
            onClick={() => {
              setOpen(false)
              navigate('/ai/profile')
            }}
            className='px-4 py-3 border-b border-slate-100 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition'
          >
            <img
              src={user.imageUrl}
              alt={user.fullName}
              className='w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100 shrink-0'
            />
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-semibold text-slate-900 truncate'>{user.fullName}</p>
              <p className='text-xs text-slate-500 truncate'>{user.email}</p>
              {user.headline && (
                <p className='text-[10px] text-indigo-600 truncate mt-0.5'>{user.headline}</p>
              )}
            </div>
          </div>

          {/* Plan & Usage Badge */}
          <div className='px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs'>
            <span className='text-slate-500'>Membership:</span>
            {isPremium ? (
              <span className='inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full'>
                <Zap className='w-3 h-3 fill-current' /> Pro Member
              </span>
            ) : (
              <span className='inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full'>
                Free ({remaining} credits)
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className='p-1.5 space-y-0.5'>
            <button
              onClick={() => {
                setOpen(false)
                navigate('/ai')
              }}
              className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition cursor-pointer'
            >
              <LayoutDashboard className='w-4 h-4' />
              Workspace Dashboard
            </button>

            <button
              onClick={() => {
                setOpen(false)
                navigate('/ai/creations')
              }}
              className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition cursor-pointer'
            >
              <Layers className='w-4 h-4' />
              My Creations Vault
            </button>

            <button
              onClick={() => {
                setOpen(false)
                navigate('/ai/profile')
              }}
              className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition cursor-pointer'
            >
              <SettingsIcon className='w-4 h-4' />
              Profile & Preferences
            </button>

            <button
              onClick={() => {
                setOpen(false)
                navigate('/ai/community')
              }}
              className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition cursor-pointer'
            >
              <Users className='w-4 h-4' />
              Community Feed
            </button>

            {user?.isAdmin && (
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/admin')
                }}
                className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50/70 rounded-xl transition cursor-pointer border border-amber-200/50'
              >
                <Shield className='w-4 h-4 text-amber-500' />
                Admin Control Center
              </button>
            )}

            {!isPremium && (
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/#pro-plan')
                }}
                className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer'
              >
                <Sparkles className='w-4 h-4 text-indigo-600' />
                Upgrade to Pro Plan ⚡
              </button>
            )}
          </div>

          {/* Sign Out Action */}
          <div className='p-1.5 border-t border-slate-100'>
            <button
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className='w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer'
            >
              <LogOut className='w-4 h-4' />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDropdown
