import React, { useState } from 'react'
import {
  FileText,
  Sparkles,
  UploadCloud,
  Download,
  Clipboard,
  Check,
  Award,
  X,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Mail,
  ChevronDown,
  ChevronUp,
  FileDown,
  Zap,
  Copy,
  Target,
  Type,
  RotateCcw,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import MarkdownRenderer from '../components/MarkdownRenderer'
import SmartPdfExportModal from '../components/SmartPdfExportModal'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const seniorityLevels = ['Entry / Junior', 'Mid-Level', 'Senior / Staff', 'Executive']

const ReviewResume = () => {
  // Input Ingestion Mode: 'file' | 'text'
  const [inputMode, setInputMode] = useState('file')
  const [file, setFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [seniority, setSeniority] = useState(seniorityLevels[1])
  const [jobDescription, setJobDescription] = useState('')
  const [showJdInput, setShowJdInput] = useState(false)
  const [companyName, setCompanyName] = useState('')

  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [metrics, setMetrics] = useState(null)
  const [extractedResumeText, setExtractedResumeText] = useState('')
  const [copied, setCopied] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Tab State: 'audit' | 'cover-letter' | 'bullet-optimizer'
  const [activeTab, setActiveTab] = useState('audit')
  const [coverLetter, setCoverLetter] = useState('')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false)
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false)

  // 1-Click Bullet Optimizer State (Google XYZ formula)
  const [rawBullet, setRawBullet] = useState('')
  const [optimizingBullet, setOptimizingBullet] = useState(false)
  const [bulletResults, setBulletResults] = useState(null)
  const [copiedBulletIdx, setCopiedBulletIdx] = useState(null)

  // Interactive Keyword Copy State
  const [copiedKeyword, setCopiedKeyword] = useState(null)

  const { getToken, user } = useAuth()

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF document (or use the Paste Text option)')
      return
    }
    setFile(selectedFile)
    setContent('')
    setMetrics(null)
    setCoverLetter('')
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (inputMode === 'file' && !file) {
      toast.error('Please upload your resume in PDF format or switch to Paste Text')
      return
    }
    if (inputMode === 'text' && resumeText.trim().length < 30) {
      toast.error('Please paste at least 30 characters of resume text')
      return
    }

    try {
      setLoading(true)
      setContent('')
      setMetrics(null)
      setActiveTab('audit')

      const formData = new FormData()
      if (inputMode === 'file') {
        formData.append('resume', file)
      } else {
        formData.append('resume_text', resumeText.trim())
      }

      if (targetRole.trim()) {
        formData.append('target_role', `${targetRole.trim()} (${seniority})`)
      }
      if (jobDescription.trim()) {
        formData.append('job_description', jobDescription.trim())
      }

      const { data } = await axios.post('/api/ai/resume-review', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })

      if (data.success) {
        setContent(data.content)
        if (data.metrics) setMetrics(data.metrics)
        if (data.extractedText) {
          setExtractedResumeText(data.extractedText)
        } else if (inputMode === 'text') {
          setExtractedResumeText(resumeText.trim().slice(0, 3000))
        }
        toast.success('Resume audited with ATS score metrics!')
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Failed to review resume')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Audit error')
    }
    setLoading(false)
  }

  // 1-Click Bullet Point Optimizer Handler (Google XYZ formula)
  const handleOptimizeBullet = async (bulletToRun = rawBullet) => {
    const text = (bulletToRun || '').trim()
    if (text.length < 5) {
      toast.error('Please enter a bullet point to optimize (at least 5 characters)')
      return
    }

    try {
      setOptimizingBullet(true)
      const { data } = await axios.post(
        '/api/ai/optimize-resume-bullet',
        {
          bullet_point: text,
          target_role: targetRole || 'Software Professional',
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      )

      if (data.success) {
        setBulletResults(data)
        toast.success('Generated 3 Google XYZ-formula variations!')
      } else {
        toast.error(data.message || 'Failed to optimize bullet')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Bullet optimizer error')
    } finally {
      setOptimizingBullet(false)
    }
  }

  const handleCopyBullet = (text, index) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBulletIdx(index)
      setTimeout(() => setCopiedBulletIdx(null), 2000)
      toast.success('Optimized bullet copied to clipboard!')
    })
  }

  const handleCopySingleKeyword = (kw) => {
    navigator.clipboard.writeText(kw).then(() => {
      setCopiedKeyword(kw)
      setTimeout(() => setCopiedKeyword(null), 1800)
      toast.success(`Copied "${kw}"`)
    })
  }

  const handleCopyAllMissingKeywords = () => {
    if (!metrics?.missing_keywords?.length) return
    const all = metrics.missing_keywords.join(', ')
    navigator.clipboard.writeText(all).then(() => {
      setCopiedKeyword('all')
      setTimeout(() => setCopiedKeyword(null), 1800)
      toast.success('Copied all missing keywords!')
    })
  }

  // Generate Tailored Cover Letter
  const handleGenerateCoverLetter = async () => {
    try {
      setGeneratingCoverLetter(true)
      setActiveTab('cover-letter')
      setCoverLetter('')

      const { data } = await axios.post(
        '/api/ai/generate-cover-letter',
        {
          target_role: targetRole || 'Software Engineer',
          company_name: companyName || 'Target Company',
          job_description: jobDescription,
          resume_summary: extractedResumeText.slice(0, 2000),
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      )

      if (data.success) {
        setCoverLetter(data.coverLetter)
        toast.success('Cover letter generated!')
      } else {
        toast.error(data.message || 'Failed to generate cover letter')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error generating cover letter')
    } finally {
      setGeneratingCoverLetter(false)
    }
  }

  const handleCopy = (text, isCoverLetter = false) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      if (isCoverLetter) {
        setCopiedCoverLetter(true)
        setTimeout(() => setCopiedCoverLetter(false), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
      toast.success('Copied to clipboard!')
    })
  }

  const handleDownloadReport = () => {
    if (!content) return
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resume-ats-audit-${Date.now()}.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Report downloaded')
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase'>
          <Award className='w-4 h-4' /> AI Career Strategist
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          ATS Resume Audit & Scoring
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Diagnose keyword density, formatting compliance, quantifiable bullet impact, and job alignment.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Upload Form */}
        <form
          onSubmit={onSubmitHandler}
          className='lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5'
        >
          {/* Ingestion Mode Toggle */}
          <div className='flex items-center justify-between'>
            <label className='text-xs font-semibold text-slate-800 flex items-center gap-1.5'>
              <span>Resume Input</span>
            </label>
            <div className='flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold'>
              <button
                type='button'
                onClick={() => setInputMode('file')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition cursor-pointer ${
                  inputMode === 'file'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className='w-3 h-3' />
                <span>Upload PDF</span>
              </button>
              <button
                type='button'
                onClick={() => setInputMode('text')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition cursor-pointer ${
                  inputMode === 'text'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Type className='w-3 h-3' />
                <span>Paste Text</span>
              </button>
            </div>
          </div>

          {/* Ingestion Content: File Dropzone OR Paste Textarea */}
          {inputMode === 'file' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <input
                id='resumeFileInput'
                type='file'
                accept='application/pdf'
                onChange={(e) => handleFileChange(e.target.files[0])}
                className='absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10'
              />

              {file ? (
                <div className='space-y-2 py-2'>
                  <div className='w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center'>
                    <FileText className='w-6 h-6' />
                  </div>
                  <div>
                    <p className='text-xs font-bold text-slate-800 truncate'>{file.name}</p>
                    <p className='text-[10px] text-slate-500'>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB PDF • Ready to audit
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setContent('')
                    }}
                    className='text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer'
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className='space-y-3 py-4'>
                  <div className='w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center'>
                    <UploadCloud className='w-6 h-6' />
                  </div>
                  <div>
                    <p className='text-xs sm:text-sm font-semibold text-slate-800'>
                      Drop your PDF resume, or <span className='text-emerald-600 underline'>browse</span>
                    </p>
                    <p className='text-[11px] text-slate-400 mt-0.5'>Supports standard PDF up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-1.5'>
              <div className='relative'>
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder='Paste your resume content here (Summary, Work Experience, Skills, Projects, Education)...'
                  className='w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono transition resize-none leading-relaxed'
                />
              </div>
              <div className='flex items-center justify-between px-1 text-[11px] text-slate-400'>
                <span>
                  {resumeText.trim() ? `${resumeText.trim().split(/\s+/).filter(Boolean).length} words` : 'Min 30 chars required'}
                </span>
                {resumeText && (
                  <button
                    type='button'
                    onClick={() => setResumeText('')}
                    className='text-rose-500 hover:text-rose-600 font-semibold cursor-pointer'
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Target Role Input */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-slate-800' htmlFor='roleInput'>
              Target Job Title (Optional)
            </label>
            <div className='relative'>
              <Briefcase className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none' />
              <input
                id='roleInput'
                type='text'
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder='e.g., Senior Full Stack Engineer, Product Lead...'
                className='w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition'
              />
            </div>
          </div>

          {/* Seniority Selector */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-slate-800'>Career Level</label>
            <div className='grid grid-cols-2 gap-2'>
              {seniorityLevels.map((lvl) => (
                <button
                  key={lvl}
                  type='button'
                  onClick={() => setSeniority(lvl)}
                  className={`p-2 rounded-xl text-xs font-medium border text-left transition cursor-pointer ${
                    seniority === lvl
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Target Job Description (JD) Matcher Accordion */}
          <div className='border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50'>
            <button
              type='button'
              onClick={() => setShowJdInput(!showJdInput)}
              className='w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition cursor-pointer'
            >
              <span className='flex items-center gap-1.5'>
                <Sparkles className='w-3.5 h-3.5 text-emerald-600' />
                Match Target Job Description (JD)
              </span>
              {showJdInput ? (
                <ChevronUp className='w-4 h-4 text-slate-400' />
              ) : (
                <ChevronDown className='w-4 h-4 text-slate-400' />
              )}
            </button>
            {showJdInput && (
              <div className='p-3 pt-0 space-y-2 border-t border-slate-200/60'>
                <p className='text-[11px] text-slate-500'>
                  Paste job requirements & qualifications to calculate real-time keyword match % and gaps.
                </p>
                <textarea
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder='e.g., Seeking Senior Engineer with 5+ yrs experience in React, Node, microservices, cloud deployments, and CI/CD...'
                  className='w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 resize-none leading-relaxed'
                />
                <input
                  type='text'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder='Company Name (optional, e.g. Stripe, OpenAI)'
                  className='w-full p-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500'
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={loading || (inputMode === 'file' ? !file : !resumeText.trim())}
            className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
          >
            {loading ? (
              <>
                <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                <span>Running ATS Engine...</span>
              </>
            ) : (
              <>
                <FileText className='w-4 h-4' />
                <span>Audit Resume & Calculate ATS Score</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Audit Results & Cover Letter Studio */}
        <div className='lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[520px] max-h-[780px] overflow-hidden'>
          {/* Header Bar with Tabs */}
          <div className='p-3.5 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50 flex-wrap'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold'>
                <button
                  type='button'
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Award className='w-3.5 h-3.5 text-emerald-600' />
                  <span>ATS Audit Report</span>
                </button>

                <button
                  type='button'
                  onClick={() => setActiveTab('bullet-optimizer')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'bullet-optimizer'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className='w-3.5 h-3.5 text-amber-500' />
                  <span>Bullet Optimizer</span>
                  <span className='text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded-sm'>
                    XYZ
                  </span>
                </button>

                {content && (
                  <button
                    type='button'
                    onClick={() => {
                      setActiveTab('cover-letter')
                      if (!coverLetter && !generatingCoverLetter) {
                        handleGenerateCoverLetter()
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                      activeTab === 'cover-letter'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mail className='w-3.5 h-3.5 text-indigo-600' />
                    <span>Tailored Cover Letter</span>
                    {!coverLetter && (
                      <span className='text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1 rounded-sm'>
                        NEW
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-2'>
              {content && activeTab === 'audit' && (
                <>
                  <button
                    onClick={() => setShowPdfModal(true)}
                    title='Extract as ATS Audit PDF'
                    className='px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-xs transition flex items-center gap-1.5 cursor-pointer'
                  >
                    <FileDown className='w-3.5 h-3.5' />
                    <span className='hidden sm:inline'>Extract PDF</span>
                  </button>

                  <button
                    onClick={() => handleCopy(content, false)}
                    title='Copy report'
                    className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
                  >
                    {copied ? (
                      <Check className='w-3.5 h-3.5 text-emerald-600' />
                    ) : (
                      <Clipboard className='w-3.5 h-3.5' />
                    )}
                    <span className='hidden sm:inline'>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownloadReport}
                    title='Download report'
                    className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
                  >
                    <Download className='w-3.5 h-3.5' />
                    <span className='hidden sm:inline'>Export</span>
                  </button>
                </>
              )}

              {coverLetter && activeTab === 'cover-letter' && (
                <>
                  <button
                    onClick={() => setShowPdfModal(true)}
                    title='Extract as Cover Letter PDF'
                    className='px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:opacity-95 shadow-xs transition flex items-center gap-1.5 cursor-pointer'
                  >
                    <FileDown className='w-3.5 h-3.5' />
                    <span className='hidden sm:inline'>Extract PDF</span>
                  </button>
                  <button
                    onClick={() => handleCopy(coverLetter, true)}
                    className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
                  >
                    {copiedCoverLetter ? (
                      <Check className='w-3.5 h-3.5 text-emerald-600' />
                    ) : (
                      <Clipboard className='w-3.5 h-3.5' />
                    )}
                    <span>{copiedCoverLetter ? 'Copied' : 'Copy Letter'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className='flex-1 overflow-y-auto p-5 sm:p-7'>
            {loading ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-7 h-7' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  Scanning resume text layers & keywords...
                </h3>
                <p className='text-xs text-slate-500'>
                  Simulating applicant tracking filters, matching job requirements, and calculating scores.
                </p>
                <div className='space-y-2 pt-4'>
                  <div className='h-2.5 bg-slate-200 rounded-full animate-pulse w-3/4 mx-auto' />
                  <div className='h-2.5 bg-slate-200 rounded-full animate-pulse w-5/6 mx-auto' />
                  <div className='h-2.5 bg-slate-200 rounded-full animate-pulse w-2/3 mx-auto' />
                </div>
              </div>
            ) : activeTab === 'bullet-optimizer' ? (
              /* Bullet Point Enhancer Studio View */
              <div className='space-y-6'>
                {/* Studio Header Card */}
                <div className='p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2.5'>
                      <div className='w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs'>
                        <Zap className='w-4.5 h-4.5' />
                      </div>
                      <div>
                        <h3 className='text-sm font-bold text-slate-900'>1-Click Bullet Point Optimizer</h3>
                        <p className='text-[11px] text-slate-500'>Google XYZ Formula: Accomplished [X] as measured by [Y], by doing [Z]</p>
                      </div>
                    </div>
                    <span className='hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200'>
                      ATS Power Booster
                    </span>
                  </div>

                  {/* Input Box */}
                  <div className='space-y-2 pt-1'>
                    <textarea
                      rows={3}
                      value={rawBullet}
                      onChange={(e) => setRawBullet(e.target.value)}
                      placeholder='Paste any weak bullet point (e.g., Created API endpoints for user auth and handled MongoDB database queries)...'
                      className='w-full p-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition resize-none leading-relaxed'
                    />

                    {/* Suggested Quick Inspiration Chips */}
                    <div className='flex items-center gap-1.5 flex-wrap pt-0.5'>
                      <span className='text-[10px] text-slate-400 font-semibold'>Try:</span>
                      {[
                        'Fixed bugs and improved frontend performance',
                        'Managed MongoDB queries and built auth APIs',
                        'Worked with team on payment gateway integration'
                      ].map((sample) => (
                        <button
                          key={sample}
                          type='button'
                          onClick={() => {
                            setRawBullet(sample)
                            handleOptimizeBullet(sample)
                          }}
                          className='text-[10px] bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 hover:border-amber-300 px-2 py-0.5 rounded-md transition cursor-pointer truncate max-w-[200px] sm:max-w-none'
                        >
                          "{sample}"
                        </button>
                      ))}
                    </div>

                    <div className='flex items-center justify-between pt-2'>
                      <span className='text-[11px] text-slate-500'>
                        Target Role: <strong className='text-slate-800'>{targetRole || 'Software Professional'}</strong>
                      </span>
                      <button
                        type='button'
                        onClick={() => handleOptimizeBullet()}
                        disabled={optimizingBullet || rawBullet.trim().length < 5}
                        className='px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-95 shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50'
                      >
                        {optimizingBullet ? (
                          <>
                            <span className='w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin' />
                            <span>Transforming with XYZ...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className='w-3.5 h-3.5' />
                            <span>Optimize with XYZ Formula</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optimizer Results or Explainer */}
                {bulletResults ? (
                  <div className='space-y-4'>
                    {bulletResults.critique && (
                      <div className='p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-700'>
                        <Sparkles className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
                        <div>
                          <span className='font-bold text-slate-800'>Recruiter Analysis: </span>
                          <span>{bulletResults.critique}</span>
                        </div>
                      </div>
                    )}

                    <div className='space-y-3'>
                      {bulletResults.variations?.map((item, idx) => (
                        <div
                          key={idx}
                          className='p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-xs transition group relative space-y-2'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-1.5'>
                              {idx === 0 ? (
                                <TrendingUp className='w-4 h-4 text-emerald-600' />
                              ) : idx === 1 ? (
                                <Zap className='w-4 h-4 text-amber-600' />
                              ) : (
                                <Award className='w-4 h-4 text-indigo-600' />
                              )}
                              <span className='text-xs font-bold text-slate-800'>{item.type}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              {item.badge && (
                                <span className='text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60'>
                                  {item.badge}
                                </span>
                              )}
                              <button
                                type='button'
                                onClick={() => handleCopyBullet(item.bullet, idx)}
                                className='p-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-amber-800 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition flex items-center gap-1 cursor-pointer'
                                title='Copy to clipboard'
                              >
                                {copiedBulletIdx === idx ? (
                                  <>
                                    <Check className='w-3.5 h-3.5 text-emerald-600' />
                                    <span className='text-emerald-700 font-bold'>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className='w-3.5 h-3.5' />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <p className='text-xs sm:text-sm text-slate-800 font-serif leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100'>
                            • {item.bullet}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Explainer Card before optimization */
                  <div className='p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/40'>
                    <div className='w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center'>
                      <Zap className='w-6 h-6' />
                    </div>
                    <div className='max-w-md mx-auto space-y-1'>
                      <h4 className='text-xs sm:text-sm font-bold text-slate-800'>Why Google's XYZ Formula wins callbacks</h4>
                      <p className='text-[11px] sm:text-xs text-slate-500'>
                        Recruiters reject passive bullets like <em>"Worked on frontend bugs"</em>. The XYZ formula instantly reframes it:
                      </p>
                    </div>
                    <div className='text-left bg-white p-3.5 rounded-xl border border-slate-200 max-w-md mx-auto text-xs space-y-1 text-slate-700 shadow-2xs'>
                      <div className='flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider'>
                        <CheckCircle2 className='w-3 h-3' /> Google Recruiter Standard
                      </div>
                      <p className='text-slate-800 font-serif italic'>
                        "Accomplished 35% reduction in page load latency as measured by Core Web Vitals, by refactoring state architecture and code-splitting."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : !content ? (
              <div className='h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3'>
                <div className='w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400'>
                  <FileText className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                    Ready for ATS Audit
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                    Upload your resume PDF or paste resume text to receive an instant visual ATS score, missing keywords, and tailored interview advice.
                  </p>
                </div>
              </div>
            ) : activeTab === 'cover-letter' ? (
              /* Cover Letter View */
              <div className='space-y-4'>
                <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                  <div>
                    <h3 className='text-sm font-bold text-slate-800'>
                      Tailored Executive Cover Letter
                    </h3>
                    <p className='text-xs text-slate-500'>
                      Aligned with {targetRole || 'your target role'} and {companyName || 'your target company'}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={handleGenerateCoverLetter}
                    disabled={generatingCoverLetter}
                    className='text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50'
                  >
                    <Sparkles className='w-3.5 h-3.5' />
                    <span>Regenerate</span>
                  </button>
                </div>

                {generatingCoverLetter ? (
                  <div className='py-16 text-center space-y-3'>
                    <div className='w-10 h-10 mx-auto rounded-full border-3 border-indigo-600 border-t-transparent animate-spin' />
                    <p className='text-xs font-semibold text-slate-700'>
                      Drafting high-converting cover letter...
                    </p>
                  </div>
                ) : coverLetter ? (
                  <div className='bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 leading-relaxed text-slate-800 text-xs sm:text-sm font-serif whitespace-pre-wrap selection:bg-indigo-500 selection:text-white'>
                    {coverLetter}
                  </div>
                ) : (
                  <div className='text-center py-12 text-slate-400 space-y-3'>
                    <Mail className='w-8 h-8 mx-auto text-slate-300' />
                    <p className='text-xs'>Click below to generate a tailored cover letter</p>
                    <button
                      type='button'
                      onClick={handleGenerateCoverLetter}
                      className='px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer'
                    >
                      Generate Cover Letter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Audit Report View with Visual ATS Gauge */
              <div className='space-y-6'>
                {metrics && (
                  <div className='space-y-4'>
                    {/* Top Gauge Card */}
                    <div className='p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-lg flex flex-col sm:flex-row items-center gap-6'>
                      {/* Circular Gauge */}
                      <div className='relative flex items-center justify-center shrink-0'>
                        <svg className='w-28 h-28 transform -rotate-90'>
                          <circle
                            cx='56'
                            cy='56'
                            r='44'
                            stroke='currentColor'
                            strokeWidth='8'
                            className='text-slate-800'
                            fill='transparent'
                          />
                          <circle
                            cx='56'
                            cy='56'
                            r='44'
                            stroke='currentColor'
                            strokeWidth='8'
                            strokeDasharray={2 * Math.PI * 44}
                            strokeDashoffset={
                              2 * Math.PI * 44 * (1 - (metrics.overall_score || 75) / 100)
                            }
                            strokeLinecap='round'
                            className={
                              (metrics.overall_score || 0) >= 80
                                ? 'text-emerald-400 transition-all duration-1000 ease-out'
                                : (metrics.overall_score || 0) >= 60
                                ? 'text-amber-400 transition-all duration-1000 ease-out'
                                : 'text-rose-400 transition-all duration-1000 ease-out'
                            }
                            fill='transparent'
                          />
                        </svg>
                        <div className='absolute inset-0 flex flex-col items-center justify-center'>
                          <span className='text-3xl font-black tracking-tight'>
                            {metrics.overall_score}
                          </span>
                          <span className='text-[10px] font-mono tracking-wider uppercase text-slate-400'>
                            ATS Score
                          </span>
                        </div>
                      </div>

                      {/* Sub-Metrics Progress Bars */}
                      <div className='flex-1 w-full space-y-3'>
                        <div>
                          <div className='flex justify-between text-xs font-medium mb-1'>
                            <span className='text-slate-300'>Keyword Density & Role Fit</span>
                            <span className='font-mono font-bold text-emerald-400'>
                              {metrics.keyword_score}%
                            </span>
                          </div>
                          <div className='h-2 bg-slate-800 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-emerald-500 rounded-full transition-all duration-1000'
                              style={{ width: `${metrics.keyword_score}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className='flex justify-between text-xs font-medium mb-1'>
                            <span className='text-slate-300'>Quantifiable Bullet Impact</span>
                            <span className='font-mono font-bold text-indigo-400'>
                              {metrics.impact_score}%
                            </span>
                          </div>
                          <div className='h-2 bg-slate-800 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-indigo-500 rounded-full transition-all duration-1000'
                              style={{ width: `${metrics.impact_score}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className='flex justify-between text-xs font-medium mb-1'>
                            <span className='text-slate-300'>ATS Formatting & Readability</span>
                            <span className='font-mono font-bold text-cyan-400'>
                              {metrics.formatting_score}%
                            </span>
                          </div>
                          <div className='h-2 bg-slate-800 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-cyan-500 rounded-full transition-all duration-1000'
                              style={{ width: `${metrics.formatting_score}%` }}
                            />
                          </div>
                        </div>

                        {/* Target Job Description Alignment Badge */}
                        {metrics.jd_match_score !== null && metrics.jd_match_score !== undefined && (
                          <div className='flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs'>
                            <span className='text-slate-300 flex items-center gap-1.5 font-medium'>
                              <Target className='w-3.5 h-3.5 text-emerald-400' />
                              Target Job Match:
                            </span>
                            <span className='font-mono font-bold text-emerald-300'>
                              {metrics.jd_match_score}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Missing Keywords & Matched Skills Chips */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      {/* Missing Keywords (Interactive 1-Click Copy & Copy All) */}
                      <div className='p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-2.5'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-1.5 text-xs font-bold text-rose-800'>
                            <AlertTriangle className='w-3.5 h-3.5 text-rose-600' />
                            <span>Missing Keywords to Add</span>
                          </div>
                          {metrics.missing_keywords?.length > 0 && (
                            <button
                              type='button'
                              onClick={handleCopyAllMissingKeywords}
                              className='text-[10px] font-semibold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 hover:bg-rose-50 px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer'
                              title='Copy all missing keywords as comma-separated list'
                            >
                              {copiedKeyword === 'all' ? (
                                <>
                                  <Check className='w-3 h-3 text-emerald-600' />
                                  <span className='text-emerald-700'>Copied All!</span>
                                </>
                              ) : (
                                <>
                                  <Clipboard className='w-3 h-3' />
                                  <span>Copy All</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className='flex flex-wrap gap-1.5'>
                          {metrics.missing_keywords?.map((kw) => (
                            <button
                              key={kw}
                              type='button'
                              onClick={() => handleCopySingleKeyword(kw)}
                              className='text-[11px] font-medium bg-white hover:bg-rose-100/70 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md shadow-2xs transition flex items-center gap-1 cursor-pointer group active:scale-95'
                              title='Click to copy keyword'
                            >
                              {copiedKeyword === kw ? (
                                <>
                                  <Check className='w-3 h-3 text-emerald-600' />
                                  <span className='text-emerald-700 font-semibold'>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <span>+ {kw}</span>
                                  <Copy className='w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition' />
                                </>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Matched Skills */}
                      <div className='p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5'>
                        <div className='flex items-center gap-1.5 text-xs font-bold text-emerald-800'>
                          <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600' />
                          <span>Recognized ATS Skills</span>
                        </div>
                        <div className='flex flex-wrap gap-1.5'>
                          {metrics.matched_skills?.map((skill) => (
                            <span
                              key={skill}
                              className='text-[11px] font-medium bg-white text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs'
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cover Letter CTA Banner */}
                    <div className='p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-2'>
                        <Mail className='w-4 h-4 text-indigo-600 shrink-0' />
                        <p className='text-xs font-semibold text-indigo-900'>
                          Ready to apply? Create a tailored cover letter matched to this resume.
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          setActiveTab('cover-letter')
                          if (!coverLetter) handleGenerateCoverLetter()
                        }}
                        className='shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-xs'
                      >
                        Draft Letter
                      </button>
                    </div>
                  </div>
                )}

                {/* Detailed Evaluation Report */}
                <div className='pt-2'>
                  <MarkdownRenderer content={content} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Content-Aware PDF Exporter Modal */}
      <SmartPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        title={
          activeTab === 'audit'
            ? `ATS Career Strategy Audit: ${targetRole || 'Resume Diagnostic'}`
            : `Targeted Cover Letter: ${companyName || targetRole || 'Application'}`
        }
        content={activeTab === 'audit' ? content : coverLetter}
        meta={{
          type: 'resume',
          role: targetRole,
          seniority,
          company: companyName,
        }}
      />
    </div>
  )
}

export default ReviewResume
