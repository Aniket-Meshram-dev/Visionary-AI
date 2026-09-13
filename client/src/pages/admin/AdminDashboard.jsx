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
  Server,
  Radio,
  Clock,
  ChevronRight,
  ShieldAlert,
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
    <div className='min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative bg-grid-mesh overflow-x-hidden'>
      {/* Ambient Lighting Orbs matching Landing Page */}
      <div className='absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none -z-10' />
      <div className='absolute top-20 right-1/4 translate-x-1/2 w-[500px] h-[350px] bg-purple-600/15 blur-[150px] rounded-full pointer-events-none -z-10' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-600/10 blur-[160px] rounded-full pointer-events-none -z-10' />

      {/* Top Admin Executive Header */}
      <header className='border-b border-white/[0.08] bg-[#07090E]/80 backdrop-blur-2xl sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between'>
        <div className='flex items-center gap-3 sm:gap-4'>
          <div
            onClick={() => navigate('/')}
            className='flex items-center gap-2.5 cursor-pointer group'
          >
            <img
              src={assets.logoLight}
              alt='Visionary.ai'
              className='h-7 object-contain transition-transform group-hover:scale-105'
            />
          </div>

          <div className='h-4 w-[1px] bg-white/10 hidden sm:block' />

          <div className='hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold'>
            <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
            <Shield className='w-3.5 h-3.5 text-indigo-400' />
            <span>Enterprise Ops Cockpit</span>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {/* Quick status pill */}
          <div className='hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] text-slate-300 font-mono'>
            <Radio className='w-3.5 h-3.5 text-emerald-400 animate-pulse' />
            <span>Prod Cluster: 99.9% Healthy</span>
          </div>

          <button
            onClick={reloadAll}
            className='p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition cursor-pointer'
            title='Refresh telemetry data'
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/ai')}
            className='flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white text-xs font-semibold border border-white/10 shadow-sm transition cursor-pointer'
          >
            <ArrowLeft className='w-3.5 h-3.5 text-indigo-400' />
            <span>User Workspace</span>
          </button>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 relative z-10'>
        {/* Header Title & Subtitle */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1'>
              <Sparkles className='w-3.5 h-3.5' /> Control Center
            </div>
            <h1 className='text-2xl sm:text-3xl font-extrabold text-white tracking-tight'>
              Platform Governance & Telemetry
            </h1>
            <p className='text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl'>
              Real-time multi-tenant monitoring, dynamic subscription overrides, AI token economics, and community feed moderation.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-xs font-mono text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.08]'>
              Admin: <strong className='text-indigo-300'>{user?.email || 'admin@gmail.com'}</strong>
            </span>
          </div>
        </div>

        {/* KPI Metrics Cards Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Card 1: Total Registered Users */}
          <div className='p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex items-center justify-between group'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                Total Registered Users
              </p>
              <h2 className='text-3xl font-extrabold text-white mt-1 group-hover:text-indigo-200 transition-colors'>
                {stats?.totalUsers ?? '...'}
              </h2>
              <p className='text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5'>
                <span className='text-indigo-400 font-semibold'>{stats?.proUsers ?? 0} Pro</span>
                <span className='text-slate-600'>•</span>
                <span className='text-slate-400'>{stats?.freeUsers ?? 0} Free Tier</span>
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform'>
              <Users className='w-6 h-6' />
            </div>
          </div>

          {/* Card 2: Active Pro Members */}
          <div className='p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 flex items-center justify-between group'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                Active Pro Subscribers
              </p>
              <h2 className='text-3xl font-extrabold text-amber-300 mt-1 group-hover:text-amber-200 transition-colors'>
                {stats?.proUsers ?? '...'}
              </h2>
              <p className='text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5'>
                <span className='px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[10px] font-semibold'>
                  {stats?.totalUsers
                    ? `${Math.round(((stats.proUsers || 0) / stats.totalUsers) * 100)}% conversion`
                    : '0%'}
                </span>
                <span className='text-slate-500 text-[10px]'>Subscribed</span>
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform'>
              <Crown className='w-6 h-6' />
            </div>
          </div>

          {/* Card 3: Total Creations */}
          <div className='p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex items-center justify-between group'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                Creations Synthesized
              </p>
              <h2 className='text-3xl font-extrabold text-white mt-1 group-hover:text-purple-200 transition-colors'>
                {stats?.totalCreations ?? '...'}
              </h2>
              <p className='text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5'>
                <span className='text-purple-300 font-semibold'>{stats?.publishedCreations ?? 0}</span>
                <span className='text-slate-500'>in Community feed</span>
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform'>
              <Layers className='w-6 h-6' />
            </div>
          </div>

          {/* Card 4: Estimated Platform MRR */}
          <div className='p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between group'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
                Estimated Platform MRR
              </p>
              <h2 className='text-3xl font-extrabold text-emerald-400 mt-1 group-hover:text-emerald-300 transition-colors'>
                ${stats?.estimatedMRR ?? 0}
              </h2>
              <p className='text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5'>
                <span className='px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold'>
                  $19/mo
                </span>
                <span className='text-slate-500 text-[10px]'>Tier recurring</span>
              </p>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform'>
              <DollarSign className='w-6 h-6' />
            </div>
          </div>
        </div>

        {/* AI Telemetry & Cost Efficiency Strip */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* AI Tokens Processed */}
          <div className='p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-indigo-950/20 to-slate-900/70 border border-indigo-500/25 backdrop-blur-xl shadow-lg relative overflow-hidden flex items-center justify-between group'>
            <div className='absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none' />
            <div className='space-y-1.5'>
              <p className='text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5'>
                <Zap className='w-4 h-4 text-amber-400' /> AI Token Telemetry
              </p>
              <h2 className='text-3xl sm:text-4xl font-extrabold text-white'>
                {formatTokens(stats?.tokenTelemetry?.totalTokens)}
              </h2>
              <p className='text-xs text-slate-400 flex items-center gap-2 flex-wrap pt-1'>
                <span className='px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]'>
                  Prompt: <strong className='text-slate-200'>{formatTokens(stats?.tokenTelemetry?.totalInputTokens)}</strong>
                </span>
                <span className='px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]'>
                  Output: <strong className='text-slate-200'>{formatTokens(stats?.tokenTelemetry?.totalOutputTokens)}</strong>
                </span>
                <span className='text-slate-400'>
                  Avg: <strong className='text-indigo-300'>{formatTokens(stats?.tokenTelemetry?.averageTokensPerCreation)}/req</strong>
                </span>
              </p>
            </div>
            <div className='w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform'>
              <Cpu className='w-7 h-7' />
            </div>
          </div>

          {/* AI Cloud Cost & Gross Margin */}
          <div className='p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-emerald-950/20 to-slate-900/70 border border-emerald-500/25 backdrop-blur-xl shadow-lg relative overflow-hidden flex items-center justify-between group'>
            <div className='absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none' />
            <div className='space-y-1.5'>
              <p className='text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5'>
                <TrendingUp className='w-4 h-4 text-emerald-400' /> Est. AI Cloud Cost & Margins
              </p>
              <h2 className='text-3xl sm:text-4xl font-extrabold text-emerald-400'>
                ${(stats?.tokenTelemetry?.estimatedCostUsd ?? 0).toFixed(4)}{' '}
                <span className='text-xs font-normal text-slate-400'>USD</span>
              </h2>
              <p className='text-xs text-slate-400 flex items-center gap-2 flex-wrap pt-1'>
                <span className='px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-semibold'>
                  ~{stats?.tokenTelemetry?.grossMargin ?? 100}% Gross Margin
                </span>
                <span className='text-slate-400'>
                  Images: <strong className='text-slate-200'>{stats?.tokenTelemetry?.totalImageGenerations ?? 0} Studio</strong>
                </span>
              </p>
            </div>
            <div className='w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform'>
              <BarChart3 className='w-7 h-7' />
            </div>
          </div>
        </div>

        {/* Sleek Segmented Tab Navigation Bar */}
        <div className='p-1.5 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/[0.08] inline-flex flex-wrap gap-1.5'>
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono transition-colors ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'bg-white/[0.06] text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* TAB 1: USERS & SUBSCRIPTIONS DIRECTORY */}
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
                  className='w-full pl-10 pr-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors'
                />
              </div>

              <div className='flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/[0.08]'>
                <span className='text-xs text-slate-400 px-2'>Plan:</span>
                {['all', 'premium', 'free'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setUserPlanFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      userPlanFilter === p
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {p === 'premium' ? 'Pro' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Data Table */}
            <div className='rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl'>
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-xs'>
                  <thead className='bg-slate-950/70 border-b border-white/[0.08] text-slate-400 uppercase tracking-wider font-mono text-[11px]'>
                    <tr>
                      <th className='p-4 sm:px-6'>User Profile</th>
                      <th className='p-4'>Plan Status</th>
                      <th className='p-4'>Free Credits Used</th>
                      <th className='p-4'>Joined Date</th>
                      <th className='p-4 sm:px-6 text-right'>Action</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-white/[0.06]'>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className='p-12 text-center text-slate-400'>
                          No users matched your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isPro = u.plan === 'premium'
                        return (
                          <tr key={u.id} className='hover:bg-white/[0.03] transition-colors group'>
                            <td className='p-4 sm:px-6'>
                              <div className='flex items-center gap-3'>
                                <div className='relative'>
                                  <img
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                      u.fullName
                                    )}&backgroundColor=4f46e5`}
                                    alt=''
                                    className='w-9 h-9 rounded-full ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all'
                                  />
                                  <span className='absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900' />
                                </div>
                                <div>
                                  <p className='font-bold text-white text-xs sm:text-sm group-hover:text-indigo-200 transition-colors'>
                                    {u.fullName}
                                  </p>
                                  <p className='text-slate-400 font-mono text-[11px]'>{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className='p-4'>
                              {isPro ? (
                                <span className='inline-flex items-center gap-1.5 font-bold text-amber-300 bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 px-3 py-1 rounded-full text-[11px] shadow-xs'>
                                  <Crown className='w-3 h-3 text-amber-400' /> Pro Unlimited
                                </span>
                              ) : (
                                <span className='inline-flex items-center gap-1 font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-full text-[11px]'>
                                  Free Starter
                                </span>
                              )}
                            </td>

                            <td className='p-4'>
                              {isPro ? (
                                <span className='text-emerald-400 font-semibold flex items-center gap-1'>
                                  <CheckCircle2 className='w-3.5 h-3.5' /> Zero Caps
                                </span>
                              ) : (
                                <div className='space-y-1 max-w-[120px]'>
                                  <div className='flex items-center justify-between text-[11px] font-mono text-slate-300'>
                                    <span>{u.usage}/10</span>
                                    <span className='text-slate-500'>{Math.round((u.usage / 10) * 100)}%</span>
                                  </div>
                                  <div className='h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5'>
                                    <div
                                      className='h-full bg-indigo-500 rounded-full'
                                      style={{ width: `${Math.min(100, (u.usage / 10) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className='p-4 text-slate-400 font-mono text-[11px]'>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>

                            <td className='p-4 sm:px-6 text-right'>
                              <button
                                onClick={() => {
                                  setEditingUser(u)
                                  setEditPlan(u.plan)
                                  setEditUsage(u.usage)
                                }}
                                className='px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/25 hover:border-indigo-500/60 transition-all text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 ml-auto'
                              >
                                <Sliders className='w-3 h-3' /> Manage Plan
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
              <div className='flex flex-wrap items-center gap-2'>
                {['all', 'resume-builder', 'resume-review', 'image', 'article', 'quick-code', 'summary'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCreationFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                      creationFilter === t
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/[0.08]'
                    }`}
                  >
                    {t.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div className='flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/[0.08]'>
                <span className='text-xs text-slate-400 px-2'>Visibility:</span>
                {['all', 'published', 'unpublished'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setCreationPublishFilter(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      creationPublishFilter === p
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-slate-200'
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
                <div className='col-span-full p-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-white/[0.08] backdrop-blur-xl'>
                  No creations found for the selected moderation filter.
                </div>
              ) : (
                filteredCreations.map((c) => (
                  <div
                    key={c.id}
                    className='p-5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3.5 shadow-xl group'
                  >
                    <div>
                      <div className='flex items-center justify-between mb-2.5'>
                        <span className='text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25'>
                          {c.type}
                        </span>

                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                            c.publish
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : 'bg-white/[0.04] text-slate-400 border border-white/[0.08]'
                          }`}
                        >
                          {c.publish ? 'Public Feed' : 'Private'}
                        </span>
                      </div>

                      <p className='text-xs text-slate-200 font-medium line-clamp-2 mb-2'>
                        {c.prompt}
                      </p>

                      {c.type === 'image' && (
                        <div className='overflow-hidden rounded-xl border border-white/[0.08] mb-2'>
                          <img
                            src={c.content}
                            alt=''
                            className='w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300'
                          />
                        </div>
                      )}

                      {c.type !== 'image' && (
                        <p className='text-[11px] text-slate-300 font-mono line-clamp-3 bg-slate-950/70 p-3 rounded-xl border border-white/[0.08]'>
                          {c.content}
                        </p>
                      )}
                    </div>

                    <div className='pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs'>
                      <span className='text-[11px] text-slate-500 font-mono flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>

                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleTogglePublish(c.id, c.publish)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            c.publish
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                          }`}
                          title={c.publish ? 'Unpublish from community' : 'Publish to community'}
                        >
                          {c.publish ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                        </button>

                        <button
                          onClick={() => handleDeleteCreation(c.id)}
                          className='p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 transition-all cursor-pointer'
                          title='Delete permanently'
                        >
                          <Trash2 className='w-4 h-4' />
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
            {/* AI Infrastructure Deep Dive */}
            <div className='p-6 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-xl'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <h3 className='text-sm font-bold text-white flex items-center gap-2'>
                  <BarChart3 className='w-4 h-4 text-emerald-400' /> AI Infrastructure Economics & Live Token Telemetry
                </h3>
                <span className='text-[11px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono font-medium flex items-center gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                  Active Cluster
                </span>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1'>
                <div className='p-4 rounded-xl bg-slate-950/60 border border-white/[0.08]'>
                  <span className='text-[11px] text-slate-400 uppercase font-semibold tracking-wider'>Total Tokens</span>
                  <div className='text-xl font-extrabold text-white mt-1'>
                    {formatTokens(stats?.tokenTelemetry?.totalTokens)}
                  </div>
                  <span className='text-[10px] text-slate-500'>Across all creator tools</span>
                </div>
                <div className='p-4 rounded-xl bg-slate-950/60 border border-white/[0.08]'>
                  <span className='text-[11px] text-slate-400 uppercase font-semibold tracking-wider'>Input Tokens</span>
                  <div className='text-xl font-extrabold text-indigo-400 mt-1'>
                    {formatTokens(stats?.tokenTelemetry?.totalInputTokens)}
                  </div>
                  <span className='text-[10px] text-slate-500'>Prompts & System context</span>
                </div>
                <div className='p-4 rounded-xl bg-slate-950/60 border border-white/[0.08]'>
                  <span className='text-[11px] text-slate-400 uppercase font-semibold tracking-wider'>Output Tokens</span>
                  <div className='text-xl font-extrabold text-purple-400 mt-1'>
                    {formatTokens(stats?.tokenTelemetry?.totalOutputTokens)}
                  </div>
                  <span className='text-[10px] text-slate-500'>Synthesized responses</span>
                </div>
                <div className='p-4 rounded-xl bg-slate-950/60 border border-white/[0.08]'>
                  <span className='text-[11px] text-slate-400 uppercase font-semibold tracking-wider'>Est. Cloud Cost</span>
                  <div className='text-xl font-extrabold text-emerald-400 mt-1'>
                    ${(stats?.tokenTelemetry?.estimatedCostUsd ?? 0).toFixed(4)}
                  </div>
                  <span className='text-[10px] text-emerald-400/80 font-medium'>~{stats?.tokenTelemetry?.grossMargin ?? 100}% Margin</span>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Engine Status */}
              <div className='p-6 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-xl'>
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
                      className='flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs'
                    >
                      <span className='font-medium text-slate-300'>{item.name}</span>
                      {item.status ? (
                        <span className='flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-[11px]'>
                          <CheckCircle2 className='w-3.5 h-3.5' /> Operational
                        </span>
                      ) : (
                        <span className='flex items-center gap-1.5 font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 text-[11px]'>
                          <Activity className='w-3.5 h-3.5' /> Key Missing / Inactive
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tool Volume Breakdown */}
              <div className='p-6 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-xl'>
                <h3 className='text-sm font-bold text-white flex items-center gap-2'>
                  <Activity className='w-4 h-4 text-purple-400' /> Tool Volume Breakdown
                </h3>
                <div className='space-y-3.5'>
                  {stats?.toolBreakdown &&
                    Object.entries(stats.toolBreakdown).map(([tool, count]) => {
                      const total = stats.totalCreations || 1
                      const percent = Math.round((count / total) * 100)
                      return (
                        <div key={tool} className='space-y-1.5 text-xs'>
                          <div className='flex items-center justify-between'>
                            <span className='capitalize font-medium text-slate-300'>
                              {tool.replace('-', ' ')}
                            </span>
                            <span className='font-mono text-slate-400'>
                              {count} ({percent}%)
                            </span>
                          </div>
                          <div className='h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.06]'>
                            <div
                              className='h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full'
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
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in'>
            <div className='bg-slate-900/95 border border-white/15 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-slate-100'>
              <div className='flex items-center justify-between pb-3 border-b border-white/[0.08]'>
                <div>
                  <h3 className='text-base font-bold text-white flex items-center gap-2'>
                    <Sliders className='w-4 h-4 text-indigo-400' /> Manage Subscription
                  </h3>
                  <p className='text-xs text-slate-400 font-mono mt-0.5'>{editingUser.email}</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className='p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer'
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
                      className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        editPlan === 'free'
                          ? 'bg-slate-800 text-white border-indigo-500 shadow-md'
                          : 'border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      Starter Free (10 Caps)
                    </button>
                    <button
                      type='button'
                      onClick={() => setEditPlan('premium')}
                      className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        editPlan === 'premium'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                          : 'border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
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
                      className='flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono outline-hidden focus:border-indigo-500'
                    />
                    <button
                      type='button'
                      onClick={() => setEditUsage(0)}
                      className='px-3.5 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 rounded-xl font-semibold transition cursor-pointer'
                    >
                      Reset to 0
                    </button>
                  </div>
                  <p className='text-[10px] text-slate-500 mt-1.5'>
                    Resetting to 0 replenishes their 10 free AI generations.
                  </p>
                </div>

                <div className='pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.08]'>
                  <button
                    type='button'
                    onClick={() => setEditingUser(null)}
                    className='px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={savingUser}
                    className='px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50'
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
