import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { assets } from '../../assets/assets'
import {
  Users,
  Shield,
  Crown,
  Layers,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Sliders,
  ExternalLink,
  Activity,
  Cpu,
  Database,
  Lock,
  Zap,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

const AdminDashboard = () => {
  const { getToken, user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('users') // 'users' | 'moderation' | 'health'
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [usersList, setUsersList] = useState([])
  const [creationsList, setCreationsList] = useState([])

  // Filters
  const [userSearch, setUserSearch] = useState('')
  const [userPlanFilter, setUserPlanFilter] = useState('all') // 'all' | 'premium' | 'free'

  const [creationFilter, setCreationFilter] = useState('all') // 'all' | 'image' | 'article' | 'quick-code' | 'summary'
  const [creationPublishFilter, setCreationPublishFilter] = useState('all')
  const [creationSearch, setCreationSearch] = useState('')

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState(null)
  const [editPlan, setEditPlan] = useState('free')
  const [editUsage, setEditUsage] = useState(0)
  const [savingUser, setSavingUser] = useState(false)

  const baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

  const formatTokens = (val) => {
    if (!val) return '0'
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
    return val.toLocaleString()
  }

  // Fetch overview stats
  const fetchOverviewStats = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${baseURL}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      toast.error('Failed to load admin overview metrics.')
    }
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${baseURL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setUsersList(data.users)
      }
    } catch (error) {
      toast.error('Failed to load user directory.')
    }
  }

  // Fetch creations for moderation
  const fetchCreations = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${baseURL}/api/admin/creations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setCreationsList(data.creations)
      }
    } catch (error) {
      toast.error('Failed to load community creations.')
    }
  }

  const reloadAll = async () => {
    setLoading(true)
    await Promise.all([fetchOverviewStats(), fetchUsers(), fetchCreations()])
    setLoading(false)
  }

  useEffect(() => {
    reloadAll()
  }, [])

  // Handle plan & credit update
  const handleSaveUser = async (e) => {
    e.preventDefault()
    if (!editingUser) return

    setSavingUser(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${baseURL}/api/admin/update-user-plan`,
        {
          targetUserId: editingUser.id,
          plan: editPlan,
          freeUsage: editUsage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(`User updated: ${editingUser.email}`)
        setEditingUser(null)
        fetchUsers()
        fetchOverviewStats()
      } else {
        toast.error(data.message || 'Failed to update user.')
      }
    } catch (err) {
      toast.error('Failed to update user plan.')
    } finally {
      setSavingUser(false)
    }
  }

  // Handle toggle publish
  const handleTogglePublish = async (creationId, currentPublish) => {
    try {
      const token = await getToken()
      const nextStatus = !currentPublish
      const { data } = await axios.post(
        `${baseURL}/api/admin/toggle-publish`,
        { creationId, publish: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(nextStatus ? 'Published to community' : 'Unpublished from community')
        setCreationsList((prev) =>
          prev.map((c) => (c.id === creationId ? { ...c, publish: nextStatus } : c))
        )
      }
    } catch (err) {
      toast.error('Failed to update publication status.')
    }
  }

  // Handle delete creation
  const handleDeleteCreation = (creationId) => {
    Swal.fire({
      title: 'Permanently delete creation?',
      text: 'This action cannot be undone. The content will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Yes, delete',
      customClass: {
        popup: 'rounded-2xl bg-slate-900 text-white border border-slate-800',
        confirmButton: 'rounded-xl px-4 py-2 font-medium',
        cancelButton: 'rounded-xl px-4 py-2 font-medium',
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = await getToken()
          const { data } = await axios.delete(
            `${baseURL}/api/admin/delete-creation/${creationId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (data.success) {
            toast.success('Creation deleted permanently.')
            setCreationsList((prev) => prev.filter((c) => c.id !== creationId))
          }
        } catch (err) {
          toast.error('Failed to delete creation.')
        }
      }
    })
  }

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !userSearch.trim() ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.fullName.toLowerCase().includes(userSearch.toLowerCase())
    const matchesPlan = userPlanFilter === 'all' || u.plan === userPlanFilter
    return matchesSearch && matchesPlan
  })

  // Filtered creations
  const filteredCreations = creationsList.filter((c) => {
    const matchesType = creationFilter === 'all' || c.type === creationFilter
    const matchesPublish =
      creationPublishFilter === 'all' ||
      (creationPublishFilter === 'published' && c.publish) ||
      (creationPublishFilter === 'unpublished' && !c.publish)
    const matchesSearch =
      !creationSearch.trim() ||
      (c.prompt && c.prompt.toLowerCase().includes(creationSearch.toLowerCase())) ||
      (c.content && c.content.toLowerCase().includes(creationSearch.toLowerCase()))
    return matchesType && matchesPublish && matchesSearch
  })

  return (
    <div className='min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white'>
      {/* Top Admin Header */}
      <header className='border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <img src={assets.logoLight} alt='Visionary.ai' className='h-7 object-contain' />
          <div className='h-4 w-[1px] bg-slate-800' />
          <div className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold'>
            <Shield className='w-3 h-3' /> Enterprise Control Plane
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={reloadAll}
            className='p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer'
            title='Refresh data'
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/ai')}
            className='flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition cursor-pointer'
          >
            <ArrowLeft className='w-3.5 h-3.5' /> User Workspace
          </button>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8'>
        {/* KPI Metrics Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Total Users */}
          <div className='p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xs flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                Total Registered Users
              </p>
              <h2 className='text-3xl font-extrabold text-white mt-1'>
                {stats?.totalUsers ?? '...'}
              </h2>
              <p className='text-[11px] text-slate-500 mt-1 flex items-center gap-1'>
                <span className='text-emerald-400 font-semibold'>{stats?.proUsers ?? 0} Pro</span> •{' '}
                {stats?.freeUsers ?? 0} Free Tier
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center'>
              <Users className='w-6 h-6' />
            </div>
          </div>

          {/* Active Pro Members */}
          <div className='p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xs flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                Active Pro Subscribers
              </p>
              <h2 className='text-3xl font-extrabold text-amber-300 mt-1'>
                {stats?.proUsers ?? '...'}
              </h2>
              <p className='text-[11px] text-slate-500 mt-1'>
                {stats?.totalUsers
                  ? `${Math.round(((stats.proUsers || 0) / stats.totalUsers) * 100)}% conversion rate`
                  : '0% conversion'}
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center'>
              <Crown className='w-6 h-6' />
            </div>
          </div>

          {/* Total Creations */}
          <div className='p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xs flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                Creations Synthesized
              </p>
              <h2 className='text-3xl font-extrabold text-white mt-1'>
                {stats?.totalCreations ?? '...'}
              </h2>
              <p className='text-[11px] text-slate-500 mt-1'>
                {stats?.publishedCreations ?? 0} in Community feed
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center'>
              <Layers className='w-6 h-6' />
            </div>
          </div>

          {/* Estimated Platform MRR */}
          <div className='p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xs flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                Estimated Platform MRR
              </p>
              <h2 className='text-3xl font-extrabold text-emerald-400 mt-1'>
                ${stats?.estimatedMRR ?? 0}
              </h2>
              <p className='text-[11px] text-slate-500 mt-1'>Based on $19/mo Pro recurring</p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center'>
              <DollarSign className='w-6 h-6' />
            </div>
          </div>
        </div>

        {/* AI Telemetry & Cost Efficiency Strip */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* AI Tokens Processed */}
          <div className='p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-xs flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5'>
                <Zap className='w-3.5 h-3.5 text-amber-400' /> AI Token Telemetry
              </p>
              <h2 className='text-3xl font-extrabold text-white mt-1'>
                {formatTokens(stats?.tokenTelemetry?.totalTokens)}
              </h2>
              <p className='text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap'>
                <span>Prompt: <strong className='text-slate-200'>{formatTokens(stats?.tokenTelemetry?.totalInputTokens)}</strong></span> •
                <span>Output: <strong className='text-slate-200'>{formatTokens(stats?.tokenTelemetry?.totalOutputTokens)}</strong></span> •
                <span>Avg: <strong className='text-slate-200'>{formatTokens(stats?.tokenTelemetry?.averageTokensPerCreation)}/req</strong></span>
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0'>
              <Zap className='w-6 h-6' />
            </div>
          </div>

          {/* AI Cloud Cost & Gross Margin */}
          <div className='p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-900/40 shadow-xs flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5'>
                <TrendingUp className='w-3.5 h-3.5 text-emerald-400' /> Est. AI Cloud Cost
              </p>
              <h2 className='text-3xl font-extrabold text-emerald-400 mt-1'>
                ${(stats?.tokenTelemetry?.estimatedCostUsd ?? 0).toFixed(4)}{' '}
                <span className='text-xs font-normal text-slate-400'>USD</span>
              </h2>
              <p className='text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap'>
                <span>Images: <strong className='text-slate-200'>{stats?.tokenTelemetry?.totalImageGenerations ?? 0} Studio</strong></span> •
                <span className='text-emerald-400 font-semibold'>~{stats?.tokenTelemetry?.grossMargin ?? 100}% Gross Margin</span>
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0'>
              <BarChart3 className='w-6 h-6' />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='flex items-center gap-2 border-b border-slate-800 pb-3'>
          {[
            { id: 'users', label: 'Users & Subscriptions', icon: Users, count: usersList.length },
            { id: 'moderation', label: 'Community Moderation', icon: Layers, count: creationsList.length },
            { id: 'health', label: 'System Health & Telemetry', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className='w-4 h-4' />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className='space-y-4'>
            {/* Search & Filter Bar */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
              <div className='relative flex-1 max-w-md'>
                <Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
                <input
                  type='text'
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder='Search user by email or name...'
                  className='w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500'
                />
              </div>

              <div className='flex items-center gap-2'>
                <span className='text-xs text-slate-500'>Plan Filter:</span>
                {['all', 'premium', 'free'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setUserPlanFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                      userPlanFilter === p
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {p === 'premium' ? 'Pro' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Data Table */}
            <div className='rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl'>
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-xs'>
                  <thead className='bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[11px]'>
                    <tr>
                      <th className='p-4'>User Details</th>
                      <th className='p-4'>Plan Status</th>
                      <th className='p-4'>Free Credits Used</th>
                      <th className='p-4'>Joined Date</th>
                      <th className='p-4 text-right'>Action</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-800/60'>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className='p-8 text-center text-slate-500'>
                          No users matched your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isPro = u.plan === 'premium'
                        return (
                          <tr key={u.id} className='hover:bg-slate-800/40 transition'>
                            <td className='p-4'>
                              <div className='flex items-center gap-3'>
                                <img
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                    u.fullName
                                  )}&backgroundColor=4f46e5`}
                                  alt=''
                                  className='w-8 h-8 rounded-full ring-1 ring-slate-700'
                                />
                                <div>
                                  <p className='font-semibold text-white'>{u.fullName}</p>
                                  <p className='text-slate-400 font-mono text-[11px]'>{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className='p-4'>
                              {isPro ? (
                                <span className='inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-[11px]'>
                                  <Crown className='w-3 h-3' /> Pro Unlimited
                                </span>
                              ) : (
                                <span className='inline-flex items-center gap-1 font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-[11px]'>
                                  Free Starter
                                </span>
                              )}
                            </td>

                            <td className='p-4'>
                              {isPro ? (
                                <span className='text-emerald-400 font-semibold'>Zero Caps</span>
                              ) : (
                                <span className='font-mono text-slate-300'>
                                  {u.usage} / 10 used
                                </span>
                              )}
                            </td>

                            <td className='p-4 text-slate-400 font-mono'>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>

                            <td className='p-4 text-right'>
                              <button
                                onClick={() => {
                                  setEditingUser(u)
                                  setEditPlan(u.plan)
                                  setEditUsage(u.usage)
                                }}
                                className='px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition text-xs font-semibold cursor-pointer'
                              >
                                Manage Plan
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMMUNITY MODERATION */}
        {activeTab === 'moderation' && (
          <div className='space-y-4'>
            {/* Filters */}
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                {['all', 'image', 'article', 'quick-code', 'summary', 'resume-review'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCreationFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                      creationFilter === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {t.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div className='flex items-center gap-2'>
                <span className='text-xs text-slate-500'>Publication:</span>
                {['all', 'published', 'unpublished'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setCreationPublishFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                      creationPublishFilter === p
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Creations Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {filteredCreations.length === 0 ? (
                <div className='col-span-full p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800'>
                  No creations found for the selected moderation filter.
                </div>
              ) : (
                filteredCreations.map((c) => (
                  <div
                    key={c.id}
                    className='p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3'
                  >
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700'>
                          {c.type}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            c.publish
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {c.publish ? 'Public on Community' : 'Private'}
                        </span>
                      </div>

                      <p className='text-xs text-slate-300 font-medium line-clamp-2 mb-2'>
                        {c.prompt}
                      </p>

                      {c.type === 'image' && (
                        <img
                          src={c.content}
                          alt=''
                          className='w-full h-36 object-cover rounded-xl border border-slate-800 mb-2'
                        />
                      )}

                      {c.type !== 'image' && (
                        <p className='text-[11px] text-slate-400 font-mono line-clamp-3 bg-slate-950 p-2 rounded-lg border border-slate-800/80'>
                          {c.content}
                        </p>
                      )}
                    </div>

                    <div className='pt-2 border-t border-slate-800 flex items-center justify-between text-xs'>
                      <span className='text-[11px] text-slate-500 font-mono'>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>

                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleTogglePublish(c.id, c.publish)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            c.publish
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                          title={c.publish ? 'Unpublish' : 'Publish'}
                        >
                          {c.publish ? <EyeOff className='w-3.5 h-3.5' /> : <Eye className='w-3.5 h-3.5' />}
                        </button>

                        <button
                          onClick={() => handleDeleteCreation(c.id)}
                          className='p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer'
                          title='Delete permanently'
                        >
                          <Trash2 className='w-3.5 h-3.5' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM HEALTH & TELEMETRY */}
        {activeTab === 'health' && (
          <div className='space-y-6'>
            {/* AI Token & Cost Telemetry Deep Dive */}
            <div className='p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <h3 className='text-sm font-bold text-white flex items-center gap-2'>
                  <BarChart3 className='w-4 h-4 text-emerald-400' /> AI Infrastructure Economics & Live Token Telemetry
                </h3>
                <span className='text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium'>
                  Live Telemetry
                </span>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1'>
                <div className='p-4 rounded-xl bg-slate-950/60 border border-slate-800/80'>
                  <span className='text-[11px] text-slate-400 uppercase font-semibold tracking-wider'>Total Tokens</span>
                  <div className='text-xl font-bold text-white mt-1'>
                    {formatTokens(stats?.tokenTelemetry?.totalTokens)}
                  </div>
                  <span className='text-[10px] text-slate-500'>Across all creator tools</span>
                </div>
                <div className='p-4 rounded-xl bg-slate-950/60 border border-slate-800/80'>
                  <span className='text-[11px] text-slate-400 uppercase font-semibold tracking-wider'>Input Tokens</span>
                  <div className='text-xl font-bold text-indigo-400 mt-1'>
                    {formatTokens(stats?.tokenTelemetry?.totalInputTokens)}
                  </div>
                  <span className='text-[10px] text-slate-500'>Prompts & System context</span>
                </div>
                <div className='p-4 rounded-xl bg-slate-950/60 border border-slate-800/80'>
                  <span className='text-[11px] text-slate-400 uppercase font-semibold tracking-wider'>Output Tokens</span>
                  <div className='text-xl font-bold text-purple-400 mt-1'>
                    {formatTokens(stats?.tokenTelemetry?.totalOutputTokens)}
                  </div>
                  <span className='text-[10px] text-slate-500'>Synthesized responses</span>
                </div>
                <div className='p-4 rounded-xl bg-slate-950/60 border border-slate-800/80'>
                  <span className='text-[11px] text-slate-400 uppercase font-semibold tracking-wider'>Est. Cloud Cost</span>
                  <div className='text-xl font-bold text-emerald-400 mt-1'>
                    ${(stats?.tokenTelemetry?.estimatedCostUsd ?? 0).toFixed(4)}
                  </div>
                  <span className='text-[10px] text-emerald-400/80 font-medium'>~{stats?.tokenTelemetry?.grossMargin ?? 100}% Gross Margin</span>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Engine Status */}
            <div className='p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4'>
              <h3 className='text-sm font-bold text-white flex items-center gap-2'>
                <Cpu className='w-4 h-4 text-indigo-400' /> AI Engines & Microservices Status
              </h3>
              <div className='space-y-2.5'>
                {[
                  { name: 'Google Gemini 2.0 Flash LLM', status: stats?.systemHealth?.gemini },
                  { name: 'Groq High-Speed Llama 3.3 Engine', status: stats?.systemHealth?.groq },
                  { name: 'Pollinations Ultra-HD Diffusion Engine', status: stats?.systemHealth?.pollinations },
                  { name: 'Cloudinary CDN Asset Processor', status: stats?.systemHealth?.cloudinary },
                  { name: 'Supabase PostgreSQL & Auth Cluster', status: stats?.systemHealth?.supabase },
                  { name: 'Stripe USD Checkout Pipeline', status: stats?.systemHealth?.stripe },
                  { name: 'Razorpay INR Gateway Subsystem', status: stats?.systemHealth?.razorpay },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs'
                  >
                    <span className='font-medium text-slate-300'>{item.name}</span>
                    {item.status ? (
                      <span className='flex items-center gap-1 font-semibold text-emerald-400'>
                        <CheckCircle2 className='w-3.5 h-3.5' /> Operational
                      </span>
                    ) : (
                      <span className='flex items-center gap-1 font-semibold text-amber-400'>
                        <Activity className='w-3.5 h-3.5' /> Key Missing / Inactive
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tool Volume Breakdown */}
            <div className='p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4'>
              <h3 className='text-sm font-bold text-white flex items-center gap-2'>
                <Activity className='w-4 h-4 text-purple-400' /> Tool Volume Breakdown
              </h3>
              <div className='space-y-3'>
                {stats?.toolBreakdown &&
                  Object.entries(stats.toolBreakdown).map(([tool, count]) => {
                    const total = stats.totalCreations || 1
                    const percent = Math.round((count / total) * 100)
                    return (
                      <div key={tool} className='space-y-1 text-xs'>
                        <div className='flex items-center justify-between'>
                          <span className='capitalize font-medium text-slate-300'>
                            {tool.replace('-', ' ')}
                          </span>
                          <span className='font-mono text-slate-400'>
                            {count} ({percent}%)
                          </span>
                        </div>
                        <div className='h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800'>
                          <div
                            className='h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full'
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* MODAL: MANAGE USER PLAN & CREDITS */}
        {editingUser && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md'>
            <div className='bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-100'>
              <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
                <div>
                  <h3 className='text-base font-bold text-white'>Manage Subscription</h3>
                  <p className='text-xs text-slate-400 font-mono mt-0.5'>{editingUser.email}</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className='p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer'
                >
                  <XCircle className='w-5 h-5' />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className='space-y-4 text-xs'>
                <div>
                  <label className='block font-semibold text-slate-300 mb-2'>Membership Tier</label>
                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      type='button'
                      onClick={() => setEditPlan('free')}
                      className={`p-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                        editPlan === 'free'
                          ? 'bg-slate-800 text-white border-indigo-500'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Starter Free (10 Caps)
                    </button>
                    <button
                      type='button'
                      onClick={() => setEditPlan('premium')}
                      className={`p-3 rounded-xl border text-center font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        editPlan === 'premium'
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Crown className='w-3.5 h-3.5 text-amber-300' /> Pro Unlimited
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block font-semibold text-slate-300 mb-1.5'>
                    Free Credits Counter ({editUsage} used / 10 max)
                  </label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='number'
                      min='0'
                      max='100'
                      value={editUsage}
                      onChange={(e) => setEditUsage(Number(e.target.value))}
                      className='flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-hidden focus:border-indigo-500'
                    />
                    <button
                      type='button'
                      onClick={() => setEditUsage(0)}
                      className='px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer'
                    >
                      Reset to 0
                    </button>
                  </div>
                  <p className='text-[10px] text-slate-500 mt-1'>
                    Setting to 0 replenishes their 10 free AI generations.
                  </p>
                </div>

                <div className='pt-3 flex items-center justify-end gap-2'>
                  <button
                    type='button'
                    onClick={() => setEditingUser(null)}
                    className='px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={savingUser}
                    className='px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50'
                  >
                    {savingUser ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
