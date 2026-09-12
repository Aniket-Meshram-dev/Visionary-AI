import React, { useState, useRef } from 'react'
import {
  User as UserIcon,
  Camera,
  UploadCloud,
  Check,
  Zap,
  Sparkles,
  Sliders,
  ShieldCheck,
  Mail,
  Briefcase,
  AlignLeft,
  Settings as SettingsIcon,
  Save,
  ArrowRight,
  RefreshCw,
  Gem,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const ProfileSettings = () => {
  const { user, updateUserProfile, plan, usage, upgradeToPro } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'preferences' | 'plan'
  const [saving, setSaving] = useState(false)

  // Form State
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [headline, setHeadline] = useState(user?.headline || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.imageUrl || '')

  // Preferences State
  const [preferences, setPreferences] = useState({
    defaultTone: user?.preferences?.defaultTone || 'Professional',
    defaultLanguage: user?.preferences?.defaultLanguage || 'javascript',
    defaultAspect: user?.preferences?.defaultAspect || '1:1',
    autoSave: user?.preferences?.autoSave !== false,
  })

  const isPremium = plan === 'premium'
  const maxUsage = 10
  const remaining = Math.max(0, maxUsage - usage)

  // Avatar file selection handler
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.')
      return
    }

    setAvatarFile(file)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
  }

  // Handle Save
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('fullName', fullName)
      formData.append('headline', headline)
      formData.append('bio', bio)
      formData.append('preferences', JSON.stringify(preferences))

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const res = await updateUserProfile(formData)
      if (res.success) {
        setAvatarFile(null)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-5xl mx-auto space-y-6'>
      {/* Header Banner */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80'>
        <div>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs'>
              <SettingsIcon className='w-5 h-5' />
            </div>
            <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight'>
              Profile & Preferences
            </h1>
          </div>
          <p className='text-sm text-slate-500 mt-1'>
            Personalize your creator profile, AI defaults, and manage your membership.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigate('/ai')}
            className='px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-xs'
          >
            ← Studio Dashboard
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='flex items-center gap-2 border-b border-slate-200'>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className='w-4 h-4' /> Creator Profile
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className='w-4 h-4' /> AI Generation Defaults
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'plan'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gem className='w-4 h-4' /> Membership & Usage
        </button>
      </div>

      {/* Tab 1: Profile & Persona */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className='space-y-6'>
          {/* Avatar & Basic Info Card */}
          <div className='p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6'>
            <h2 className='text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3'>
              <Camera className='w-4 h-4 text-indigo-600' /> Avatar & Identity
            </h2>

            <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
              {/* Avatar Preview & Upload Trigger */}
              <div className='relative group'>
                <div className='w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-indigo-500/15 shadow-md bg-slate-100 shrink-0'>
                  <img
                    src={avatarPreview || 'https://api.dicebear.com/7.x/initials/svg?seed=Creator'}
                    alt={fullName}
                    className='w-full h-full object-cover'
                  />
                </div>

                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer'
                  title='Upload new photo'
                >
                  <Camera className='w-4 h-4' />
                </button>

                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept='image/png, image/jpeg, image/webp'
                  className='hidden'
                />
              </div>

              <div className='space-y-2 text-center sm:text-left flex-1'>
                <h3 className='text-base font-bold text-slate-800'>Profile Photo</h3>
                <p className='text-xs text-slate-500 max-w-sm'>
                  Upload a crisp portrait photo (JPG, PNG, WEBP, up to 5MB). Photo will be hosted on permanent ultra-HD CDN.
                </p>
                <div className='flex items-center gap-2 pt-1 justify-center sm:justify-start'>
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    className='px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition cursor-pointer'
                  >
                    Upload New Photo
                  </button>
                  {avatarFile && (
                    <span className='text-[11px] text-emerald-600 font-medium flex items-center gap-1'>
                      <Check className='w-3.5 h-3.5' /> New photo selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2'>
              {/* Full Name */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold text-slate-700 flex items-center gap-1.5'>
                  <UserIcon className='w-3.5 h-3.5 text-slate-400' /> Full Name
                </label>
                <input
                  type='text'
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder='e.g. Aniket Sharma'
                  required
                  className='w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition'
                />
              </div>

              {/* Headline / Title */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold text-slate-700 flex items-center gap-1.5'>
                  <Briefcase className='w-3.5 h-3.5 text-slate-400' /> Professional Headline / Role
                </label>
                <input
                  type='text'
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder='e.g. Senior Full-Stack Engineer & AI Creator'
                  className='w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition'
                />
              </div>

              {/* Email (Read-Only with verified badge) */}
              <div className='space-y-1.5 sm:col-span-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-xs font-bold text-slate-700 flex items-center gap-1.5'>
                    <Mail className='w-3.5 h-3.5 text-slate-400' /> Registered Email Address
                  </label>
                  <span className='inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full'>
                    <CheckCircle2 className='w-3 h-3' /> Verified Account
                  </span>
                </div>
                <input
                  type='email'
                  value={user?.email || ''}
                  disabled
                  className='w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed'
                />
                <p className='text-[11px] text-slate-400'>
                  Your email address is managed via secure authentication and cannot be changed here.
                </p>
              </div>

              {/* Bio / Info */}
              <div className='space-y-1.5 sm:col-span-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-xs font-bold text-slate-700 flex items-center gap-1.5'>
                    <AlignLeft className='w-3.5 h-3.5 text-slate-400' /> Creator Bio / Info
                  </label>
                  <span className='text-[11px] text-slate-400'>{bio.length}/300</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 300))}
                  rows={3}
                  placeholder='Share a brief description about your creative projects, tech stack, or background...'
                  className='w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition resize-none'
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex items-center justify-end gap-3'>
            <button
              type='submit'
              disabled={saving}
              className='px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-sm shadow-indigo-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50'
            >
              {saving ? (
                <>
                  <RefreshCw className='w-4 h-4 animate-spin' /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' /> Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: AI Generation Preferences */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSaveProfile} className='space-y-6'>
          <div className='p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6'>
            <h2 className='text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3'>
              <Sliders className='w-4 h-4 text-indigo-600' /> Studio Generation Defaults
            </h2>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
              {/* Default Article Tone */}
              <div className='space-y-2'>
                <label className='text-xs font-bold text-slate-700'>
                  Default Article Writing Tone
                </label>
                <select
                  value={preferences.defaultTone}
                  onChange={(e) =>
                    setPreferences({ ...preferences, defaultTone: e.target.value })
                  }
                  className='w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium cursor-pointer'
                >
                  <option value='Professional'>Professional & Authoritative</option>
                  <option value='Creative'>Creative & Engaging</option>
                  <option value='Academic'>Academic & Analytical</option>
                  <option value='Concise'>Concise & Direct (TL;DR)</option>
                  <option value='Casual'>Casual & Conversational</option>
                </select>
                <p className='text-[11px] text-slate-500'>
                  Applied as baseline tone in the Write Article 3-stage agentic engine.
                </p>
              </div>

              {/* Default Code Sandbox Language */}
              <div className='space-y-2'>
                <label className='text-xs font-bold text-slate-700'>
                  Default Code Sandbox Language
                </label>
                <select
                  value={preferences.defaultLanguage}
                  onChange={(e) =>
                    setPreferences({ ...preferences, defaultLanguage: e.target.value })
                  }
                  className='w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium cursor-pointer'
                >
                  <option value='javascript'>JavaScript (Node.js)</option>
                  <option value='python'>Python 3</option>
                  <option value='typescript'>TypeScript</option>
                  <option value='go'>Go</option>
                  <option value='cpp'>C++ (GCC)</option>
                  <option value='java'>Java</option>
                  <option value='rust'>Rust</option>
                </select>
                <p className='text-[11px] text-slate-500'>
                  Preferred compiler language in the Quick Code live sandbox.
                </p>
              </div>

              {/* Default Image Aspect Ratio */}
              <div className='space-y-2'>
                <label className='text-xs font-bold text-slate-700'>
                  Default Image Aspect Ratio
                </label>
                <select
                  value={preferences.defaultAspect}
                  onChange={(e) =>
                    setPreferences({ ...preferences, defaultAspect: e.target.value })
                  }
                  className='w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium cursor-pointer'
                >
                  <option value='1:1'>1:1 Square (1024 × 1024) — Social Avatars</option>
                  <option value='16:9'>16:9 Landscape (1280 × 720) — Banners & YouTube</option>
                  <option value='9:16'>9:16 Portrait (720 × 1280) — Stories & Reels</option>
                  <option value='4:3'>4:3 Standard (1152 × 864) — Classical</option>
                  <option value='3:2'>3:2 Photography (1200 × 800) — Editorial</option>
                </select>
                <p className='text-[11px] text-slate-500'>
                  Default canvas ratio in the Generate Images FLUX Turbo studio.
                </p>
              </div>

              {/* Auto Save Toggle */}
              <div className='space-y-2'>
                <label className='text-xs font-bold text-slate-700'>
                  Auto-Save Creations
                </label>
                <div className='flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl'>
                  <div>
                    <p className='text-xs font-semibold text-slate-800'>Auto-sync to Vault</p>
                    <p className='text-[11px] text-slate-500'>Save assets to My Creations automatically</p>
                  </div>
                  <input
                    type='checkbox'
                    checked={preferences.autoSave}
                    onChange={(e) =>
                      setPreferences({ ...preferences, autoSave: e.target.checked })
                    }
                    className='w-4 h-4 text-indigo-600 rounded cursor-pointer'
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-end gap-3'>
            <button
              type='submit'
              disabled={saving}
              className='px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-sm shadow-indigo-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50'
            >
              {saving ? (
                <>
                  <RefreshCw className='w-4 h-4 animate-spin' /> Saving Defaults...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' /> Save AI Defaults
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Membership & Billing */}
      {activeTab === 'plan' && (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Current Membership Card */}
            <div className='p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                  Current Plan
                </span>
                {isPremium ? (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/80 flex items-center gap-1'>
                    <Sparkles className='w-3 h-3 text-purple-600 fill-purple-600' /> Pro Member
                  </span>
                ) : (
                  <span className='px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100'>
                    Free Explorer
                  </span>
                )}
              </div>

              <div>
                <h3 className='text-2xl font-bold text-slate-900'>
                  {isPremium ? 'Visionary Pro Tier' : 'Visionary Free Tier'}
                </h3>
                <p className='text-xs text-slate-500 mt-1'>
                  {isPremium
                    ? 'Unlimited high-speed generation across all 7 creation studios.'
                    : '10 free trial credits across all AI creation tools.'}
                </p>
              </div>

              {/* Usage Progress */}
              <div className='pt-2 space-y-2'>
                <div className='flex items-center justify-between text-xs font-semibold text-slate-700'>
                  <span>Monthly Credit Usage</span>
                  <span className='font-mono'>
                    {isPremium ? 'Unlimited' : `${usage} / ${maxUsage}`}
                  </span>
                </div>

                {!isPremium && (
                  <div className='w-full bg-slate-100 h-2 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300'
                      style={{ width: `${Math.min(100, (usage / maxUsage) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {!isPremium && (
                <button
                  onClick={() => navigate('/#pro-plan')}
                  className='w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-95 shadow-sm shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer'
                >
                  <Zap className='w-4 h-4 fill-current' /> Upgrade to Pro Tier ⚡
                </button>
              )}
            </div>

            {/* Plan Perks Overview */}
            <div className='p-6 bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-xs space-y-4'>
              <h3 className='text-sm font-bold text-slate-900'>Included in Visionary Pro</h3>
              <ul className='space-y-2.5 text-xs text-slate-600'>
                <li className='flex items-center gap-2'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Unlimited High-Speed 3-Stage Article Writing</span>
                </li>
                <li className='flex items-center gap-2'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Interactive Mindmaps & Natural TTS Voice Briefings</span>
                </li>
                <li className='flex items-center gap-2'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>Universal 15+ Languages Code Execution Sandbox</span>
                </li>
                <li className='flex items-center gap-2'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>FLUX.1 Turbo Photorealistic Visual Generation</span>
                </li>
                <li className='flex items-center gap-2'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>1-Click AI Background Removal & Inpainting Object Eraser</span>
                </li>
                <li className='flex items-center gap-2'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0' />
                  <span>ATS Recruiter Resume Scoring & XYZ Bullet Optimizer</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSettings
