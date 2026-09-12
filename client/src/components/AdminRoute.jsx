import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react'
import { assets } from '../assets/assets'

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin, openSignIn } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-950 text-white'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin' />
          <p className='text-xs font-mono text-slate-400'>Verifying administrative credentials...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4 text-center'>
        <div className='p-4 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl space-y-4'>
          <div className='w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20'>
            <Lock className='w-6 h-6' />
          </div>
          <h2 className='text-xl font-bold'>Administrator Login Required</h2>
          <p className='text-xs text-slate-400 leading-relaxed'>
            You must authenticate with a designated administrator account to access the Visionary.ai Control Plane.
          </p>
          <button
            onClick={() => openSignIn('sign-in')}
            className='w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer'
          >
            Sign In with Admin Account
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4 text-center'>
        <div className='p-6 bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full shadow-2xl space-y-4'>
          <div className='w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20'>
            <ShieldAlert className='w-6 h-6' />
          </div>
          <h2 className='text-xl font-bold text-white'>Access Denied (403)</h2>
          <p className='text-xs text-slate-400 leading-relaxed'>
            Your account (<span className='text-slate-200 font-mono'>{user.email}</span>) does not possess administrator privileges. This incident has been logged.
          </p>
          <button
            onClick={() => navigate('/ai')}
            className='w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer'
          >
            <ArrowLeft className='w-4 h-4' /> Return to Workspace
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default AdminRoute
