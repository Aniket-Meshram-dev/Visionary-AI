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
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Markdown from 'react-markdown'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const seniorityLevels = ['Entry / Junior', 'Mid-Level', 'Senior / Staff', 'Executive']

const ReviewResume = () => {
  const [file, setFile] = useState(null)
  const [targetRole, setTargetRole] = useState('')
  const [seniority, setSeniority] = useState(seniorityLevels[1])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const { getToken, user } = useAuth()

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF document')
      return
    }
    setFile(selectedFile)
    setContent('')
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
    if (!file) {
      toast.error('Please upload your resume in PDF format')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('resume', file)
      if (targetRole.trim()) {
        formData.append('target_role', `${targetRole.trim()} (${seniority})`)
      }

      const { data } = await axios.post('/api/ai/resume-review', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })

      if (data.success) {
        setContent(data.content)
        toast.success('Resume audited successfully!')
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Failed to review resume')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Audit error')
    }
    setLoading(false)
  }

  const handleCopy = () => {
    if (!content) return
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      toast.success('Analysis report copied!')
      setTimeout(() => setCopied(false), 2000)
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
          {/* Dropzone */}
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

          {/* Submit */}
          <button
            type='submit'
            disabled={loading || !file}
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
                <span>Audit Resume Now</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Audit Results Viewer */}
        <div className='lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[500px] max-h-[750px] overflow-hidden'>
          {/* Header Bar */}
          <div className='p-4 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50'>
            <div className='flex items-center gap-2 min-w-0'>
              <Award className='w-4 h-4 text-emerald-600 shrink-0' />
              <h2 className='text-xs sm:text-sm font-semibold text-slate-800 truncate'>
                ATS Evaluation & Breakdown
              </h2>
            </div>

            {content && (
              <div className='flex items-center gap-2'>
                <button
                  onClick={handleCopy}
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
              </div>
            )}
          </div>

          {/* Body */}
          <div className='flex-1 overflow-y-auto p-5 sm:p-8'>
            {loading ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-7 h-7' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  Scanning resume text layers & syntax...
                </h3>
                <p className='text-xs text-slate-500'>
                  Simulating recruiter filters, measuring action verbs, and evaluating quantifiable metrics.
                </p>
                <div className='space-y-2 pt-4'>
                  <div className='h-2.5 bg-slate-200 rounded-full animate-pulse w-3/4 mx-auto' />
                  <div className='h-2.5 bg-slate-200 rounded-full animate-pulse w-5/6 mx-auto' />
                  <div className='h-2.5 bg-slate-200 rounded-full animate-pulse w-2/3 mx-auto' />
                </div>
              </div>
            ) : !content ? (
              <div className='h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3'>
                <div className='w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400'>
                  <FileText className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                    Ready for audit
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                    Upload your resume PDF to receive a comprehensive ATS score and recruiter-level action points.
                  </p>
                </div>
              </div>
            ) : (
              <div className='prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed reset-tw'>
                <Markdown>{content}</Markdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewResume
