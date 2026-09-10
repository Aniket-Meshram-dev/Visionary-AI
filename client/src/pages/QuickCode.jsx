import React, { useState } from 'react'
import {
  Code,
  Cpu,
  Clipboard,
  Check,
  Download,
  Terminal,
  FileCode,
  Sparkles,
  Layers,
} from 'lucide-react'
import axios from 'axios'
import { useAuth, useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const languageList = [
  { name: 'JavaScript', ext: 'js', tag: 'JS' },
  { name: 'TypeScript', ext: 'ts', tag: 'TS' },
  { name: 'Python', ext: 'py', tag: 'PY' },
  { name: 'React (JSX)', ext: 'jsx', tag: 'JSX' },
  { name: 'Go', ext: 'go', tag: 'GO' },
  { name: 'Rust', ext: 'rs', tag: 'RS' },
  { name: 'Java', ext: 'java', tag: 'JAVA' },
  { name: 'C++', ext: 'cpp', tag: 'CPP' },
  { name: 'SQL', ext: 'sql', tag: 'SQL' },
  { name: 'Tailwind / HTML', ext: 'html', tag: 'HTML' },
]

const samplePrompts = [
  'JWT authentication middleware with error handling',
  'LRU Cache implementation with O(1) get and put',
  'Custom React hook for debouncing search input',
  'PostgreSQL schema and query with indexes for a multi-tenant SaaS',
]

const QuickCode = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(languageList[0])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const { getToken } = useAuth()
  const { user } = useUser()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input.trim()) {
      toast.error('Please describe what code to generate')
      return
    }

    try {
      setLoading(true)
      const token = await getToken()

      const { data } = await axios.post(
        '/api/ai/generate-quick-code',
        {
          prompt: input,
          language: selectedLanguage.name,
          maxTokens: 800,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (data.success) {
        setGeneratedCode(data.code)
        toast.success('Code generated successfully!')
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Failed to generate code')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Generation error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!generatedCode) return
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    if (!generatedCode) return
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `solution.${selectedLanguage.ext}`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded solution.${selectedLanguage.ext}`)
  }

  const lineCount = generatedCode ? generatedCode.split('\n').length : 0

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 text-violet-600 font-semibold text-xs tracking-wider uppercase'>
          <Code className='w-4 h-4' /> AI Code Engine
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Generate Code & Algorithms
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Produce production-ready snippets, database schemas, API handlers, and algorithms with clean typing.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Form */}
        <form
          onSubmit={onSubmitHandler}
          className='lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5'
        >
          {/* Describe Requirements */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-slate-800' htmlFor='codeInput'>
              What would you like to build?
            </label>
            <textarea
              id='codeInput'
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g., Build an async utility function to retry failed HTTP requests with exponential backoff...'
              className='w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition resize-none leading-relaxed'
              required
            />
          </div>

          {/* Quick inspiration chips */}
          <div className='space-y-1.5'>
            <p className='text-[11px] font-medium text-slate-400'>Sample prompts:</p>
            <div className='flex flex-wrap gap-1.5'>
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  type='button'
                  onClick={() => setInput(p)}
                  className='text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-md transition text-left cursor-pointer'
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Programming Language Pills */}
          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-800'>Target Language / Framework</label>
            <div className='flex flex-wrap gap-1.5'>
              {languageList.map((lang) => {
                const isSelected = selectedLanguage.name === lang.name
                return (
                  <button
                    key={lang.name}
                    type='button'
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <span className='text-[10px] opacity-70 font-mono'>{lang.tag}</span>
                    <span>{lang.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-violet-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
          >
            {loading ? (
              <>
                <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                <span>Writing Clean Code...</span>
              </>
            ) : (
              <>
                <Sparkles className='w-4 h-4' />
                <span>Generate {selectedLanguage.name} Code</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: IDE Code Viewer */}
        <div className='lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl flex flex-col min-h-[500px] max-h-[750px] overflow-hidden text-slate-200'>
          {/* Terminal Window Header Bar */}
          <div className='px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3'>
            {/* Window dots and file tab */}
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-1.5'>
                <span className='w-3 h-3 rounded-full bg-rose-500/90 inline-block' />
                <span className='w-3 h-3 rounded-full bg-amber-500/90 inline-block' />
                <span className='w-3 h-3 rounded-full bg-emerald-500/90 inline-block' />
              </div>
              <div className='flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800/80 text-[11px] font-mono text-slate-300 border border-slate-700/60'>
                <FileCode className='w-3.5 h-3.5 text-violet-400' />
                <span>solution.{selectedLanguage.ext}</span>
              </div>
            </div>

            {/* Actions */}
            {generatedCode && (
              <div className='flex items-center gap-2'>
                <span className='text-[10px] font-mono text-slate-400 hidden sm:inline'>
                  {lineCount} lines
                </span>
                <button
                  onClick={handleCopy}
                  title='Copy code'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer'
                >
                  {copied ? (
                    <Check className='w-3.5 h-3.5 text-emerald-400' />
                  ) : (
                    <Clipboard className='w-3.5 h-3.5' />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  title='Download file'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer'
                >
                  <Download className='w-3.5 h-3.5' />
                  <span className='hidden sm:inline'>Save</span>
                </button>
              </div>
            )}
          </div>

          {/* IDE Content Area */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-xs leading-relaxed'>
            {loading ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-12 h-12 mx-auto rounded-2xl bg-violet-950/80 border border-violet-800 text-violet-400 flex items-center justify-center animate-pulse'>
                  <Terminal className='w-6 h-6' />
                </div>
                <h3 className='text-sm font-semibold text-slate-200'>
                  Synthesizing code architecture...
                </h3>
                <p className='text-xs text-slate-400'>
                  Constructing type definitions, handling edge cases, and formatting syntax.
                </p>
                <div className='space-y-2 pt-4'>
                  <div className='h-2.5 bg-slate-800 rounded-full animate-pulse w-3/4 mx-auto' />
                  <div className='h-2.5 bg-slate-800 rounded-full animate-pulse w-5/6 mx-auto' />
                  <div className='h-2.5 bg-slate-800 rounded-full animate-pulse w-2/3 mx-auto' />
                </div>
              </div>
            ) : !generatedCode ? (
              <div className='h-full flex flex-col items-center justify-center text-center py-16 text-slate-500 space-y-3'>
                <div className='w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400'>
                  <Code className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-300'>
                    Ready to code
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-500 mt-1'>
                    Select your language, describe your function, and generate instant clean code.
                  </p>
                </div>
              </div>
            ) : (
              <pre className='text-indigo-100 whitespace-pre-wrap overflow-x-auto selection:bg-violet-600 selection:text-white'>
                <code>{generatedCode}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickCode
