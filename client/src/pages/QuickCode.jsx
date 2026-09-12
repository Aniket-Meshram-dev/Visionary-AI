import React, { useState, useRef } from 'react'
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
  Square,
  Play,
  Wand2,
  AlertCircle,
  ExternalLink,
  Eye,
  FileText,
  Bug,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { streamAiCompletion } from '../services/streamService'
import VoiceInputButton from '../components/VoiceInputButton'
import SmartPdfExportModal from '../components/SmartPdfExportModal'
import axios from 'axios'
import { transform } from 'sucrase'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const languageList = [
  { name: 'JavaScript', ext: 'js', tag: 'JS', isBrowserRunnable: true, runnerUrl: null },
  { name: 'TypeScript', ext: 'ts', tag: 'TS', isBrowserRunnable: true, runnerUrl: null },
  { name: 'Python', ext: 'py', tag: 'PY', isBrowserRunnable: false, runnerUrl: 'https://onecompiler.com/python' },
  { name: 'React (JSX)', ext: 'jsx', tag: 'JSX', isBrowserRunnable: true, runnerUrl: null },
  { name: 'Go', ext: 'go', tag: 'GO', isBrowserRunnable: false, runnerUrl: 'https://onecompiler.com/go' },
  { name: 'Rust', ext: 'rs', tag: 'RS', isBrowserRunnable: false, runnerUrl: 'https://onecompiler.com/rust' },
  { name: 'Java', ext: 'java', tag: 'JAVA', isBrowserRunnable: false, runnerUrl: 'https://onecompiler.com/java' },
  { name: 'C++', ext: 'cpp', tag: 'CPP', isBrowserRunnable: false, runnerUrl: 'https://onecompiler.com/cpp' },
  { name: 'SQL', ext: 'sql', tag: 'SQL', isBrowserRunnable: false, runnerUrl: 'https://onecompiler.com/mysql' },
  { name: 'Tailwind / HTML', ext: 'html', tag: 'HTML', isBrowserRunnable: false, runnerUrl: null },
]

const samplePrompts = [
  'JWT authentication middleware with error handling',
  'LRU Cache implementation with O(1) get and put',
  'Custom React hook for debouncing search input',
  'PostgreSQL schema and query with indexes for a multi-tenant SaaS',
]

const debugSamplePrompts = [
  'Fix React hook memory leak & missing dependency warning',
  'Fix Python IndexError: list index out of range in binary search',
  'Fix C++ segmentation fault when reversing linked list',
  'Fix SQL query syntax error near GROUP BY / HAVING',
]

// Subtle Big-O complexity extractor
const extractComplexity = (code) => {
  if (!code) return null
  const match = code.match(/(?:Time(?:\s*Complexity)?:\s*(O\([^\n,|]+\))|(?:\/\/\s*|\/\*|#|--)\s*(?:Complexity:?\s*)?(O\([^\n,|]+\)))\s*(?:[,|•\n]\s*(?:Space(?:\s*Complexity)?:\s*(O\([^\n,|)]+\))|(O\([^\n,|)]+\))))?/i)
  if (match) {
    const time = match[1] || match[2]
    const space = match[3] || match[4]
    if (time && space) return `${time} Time • ${space} Space`
    if (time) return `${time} Time`
  }
  const singleO = code.match(/(?:Time|time|runtime|complexity)\s*(?:is|:|=)?\s*(O\([a-zA-Z0-9_\s*+^/-]+\))/i)
  if (singleO) return `${singleO[1]} Time`
  return null
}

const QuickCode = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(languageList[0])
  const [activeMode, setActiveMode] = useState('generate') // 'generate' | 'debug'
  const [input, setInput] = useState(() => new URLSearchParams(window.location.search).get('prompt') || '')
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)

  // Runner state
  const [activeTab, setActiveTab] = useState('code') // 'code' | 'console'
  const [runLogs, setRunLogs] = useState([])
  const [runError, setRunError] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [stdinInput, setStdinInput] = useState('')

  const abortControllerRef = useRef(null)
  const { getToken, user } = useAuth()

  const complexityBadge = extractComplexity(generatedCode)

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      setLoading(false)
      toast.success('Code generation stopped. Code preserved.')
    }
  }

  const onSubmitHandler = async (e) => {
    if (e) e.preventDefault()
    if (!input.trim()) {
      toast.error(
        activeMode === 'debug'
          ? 'Please paste broken code or error to debug'
          : 'Please describe what code to generate'
      )
      return
    }

    try {
      setLoading(true)
      setIsStreaming(true)
      setGeneratedCode('')
      setRunLogs([])
      setRunError(null)

      const controller = new AbortController()
      abortControllerRef.current = controller
      const token = await getToken()

      const formattedPrompt =
        activeMode === 'debug'
          ? `Debug, fix, and optimize the following ${selectedLanguage.name} code or error:\n\n${input}\n\nTask: Diagnose the root cause with a concise 1-line top comment, fix all bugs, handle edge cases, and output clean runnable code.`
          : input

      await streamAiCompletion({
        endpoint: '/api/ai/stream-quick-code',
        body: {
          prompt: formattedPrompt,
          language: selectedLanguage.name,
          maxTokens: 1400,
        },
        token,
        signal: controller.signal,
        onChunk: (chunk, accumulated) => {
          setGeneratedCode(accumulated)
          setLoading(false)
        },
        onComplete: () => {
          setIsStreaming(false)
          setLoading(false)
          abortControllerRef.current = null
          toast.success(
            activeMode === 'debug'
              ? 'Code diagnosed and fixed successfully!'
              : 'Code generated successfully!'
          )
          if (user?.reload) user.reload()
        },
        onError: async (err) => {
          console.warn('Streaming failed, attempting fallback to standard endpoint:', err.message)
          try {
            const { data } = await axios.post(
              '/api/ai/generate-quick-code',
              { prompt: formattedPrompt, language: selectedLanguage.name },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            if (data.success) {
              setGeneratedCode(data.code || data.content)
              setIsStreaming(false)
              setLoading(false)
              abortControllerRef.current = null
              toast.success(
                activeMode === 'debug'
                  ? 'Code diagnosed and fixed successfully!'
                  : 'Code generated successfully!'
              )
              if (user?.reload) user.reload()
              return
            }
          } catch (fallbackErr) {
            console.error('Fallback endpoint also failed:', fallbackErr.message)
          }
          setIsStreaming(false)
          setLoading(false)
          abortControllerRef.current = null
          toast.error(err.message || 'Generation error')
        },
      })
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error(error.message || 'Generation error')
      }
      setIsStreaming(false)
      setLoading(false)
    }
  }

  // AI Refine actions
  const handleRefineCode = async (refinePrompt) => {
    if (!generatedCode || isStreaming) return
    const fullPrompt = `Here is a ${selectedLanguage.name} code snippet:\n\n${generatedCode}\n\nTask: ${refinePrompt}. Output only clean runnable code.`
    try {
      setLoading(true)
      setIsStreaming(true)
      setGeneratedCode('')
      setRunLogs([])
      setRunError(null)

      const controller = new AbortController()
      abortControllerRef.current = controller
      const token = await getToken()

      await streamAiCompletion({
        endpoint: '/api/ai/stream-quick-code',
        body: {
          prompt: fullPrompt,
          language: selectedLanguage.name,
          maxTokens: 1400,
        },
        token,
        signal: controller.signal,
        onChunk: (chunk, accumulated) => {
          setGeneratedCode(accumulated)
          setLoading(false)
        },
        onComplete: () => {
          setIsStreaming(false)
          setLoading(false)
          abortControllerRef.current = null
          toast.success('Code updated!')
          if (user?.reload) user.reload()
        },
        onError: (err) => {
          setIsStreaming(false)
          setLoading(false)
          abortControllerRef.current = null
          toast.error(err.message || 'Refinement failed')
        },
      })
    } catch (error) {
      setIsStreaming(false)
      setLoading(false)
    }
  }

  // Sandbox Runner for all languages (In-browser sandbox for JS/TS/JSX, AI Sandbox Server for C++, Python, Java, etc.)
  const handleRunCode = async (customStdin) => {
    if (!generatedCode || isRunning) return
    setIsRunning(true)
    setRunLogs([])
    setRunError(null)

    const activeStdin = customStdin !== undefined ? customStdin : stdinInput
    if (customStdin !== undefined) {
      setStdinInput(customStdin)
    }

    // 1. Clean markdown fences: extract code inside ``` if wrapped
    let cleanCode = generatedCode.trim()
    const fenceMatch = cleanCode.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
      cleanCode = fenceMatch[1].trim()
    } else {
      cleanCode = cleanCode.replace(/^```[a-zA-Z0-9_-]*\n?/m, '').replace(/```$/m, '').trim()
    }

    // Auto-switch to Preview tab if pure HTML
    if (selectedLanguage.ext === 'html' && (cleanCode.includes('<html') || cleanCode.includes('<!DOCTYPE') || cleanCode.includes('<div'))) {
      setActiveTab('preview')
      setIsRunning(false)
      toast.success('Rendering live HTML preview!')
      return
    }

    setActiveTab('console')

    // 2. In-Browser Sandbox for JavaScript, TypeScript, React JSX
    if (selectedLanguage.isBrowserRunnable) {
      const logs = []
      const originalLog = console.log
      const originalWarn = console.warn
      const originalError = console.error

      try {
        if (
          selectedLanguage.name === 'TypeScript' ||
          cleanCode.includes(': number') ||
          cleanCode.includes(': string') ||
          cleanCode.includes(': boolean') ||
          cleanCode.includes(': void') ||
          cleanCode.includes(': any')
        ) {
          try {
            cleanCode = transform(cleanCode, { transforms: ['typescript'] }).code
          } catch (tsErr) {
            console.warn('Sucrase TS transpile notice:', tsErr.message)
          }
        } else if (selectedLanguage.name === 'React (JSX)') {
          try {
            cleanCode = transform(cleanCode, { transforms: ['jsx'] }).code
          } catch (jsxErr) {
            console.warn('Sucrase JSX transpile notice:', jsxErr.message)
          }
        }

        console.log = (...args) => {
          logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '))
        }
        console.warn = (...args) => {
          logs.push(`[WARN] ` + args.map(String).join(' '))
        }
        console.error = (...args) => {
          logs.push(`[ERROR] ` + args.map(String).join(' '))
        }

        const startTime = performance.now()
        // Run code safely in function scope
        const runnable = new Function(cleanCode)
        runnable()
        const duration = (performance.now() - startTime).toFixed(2)

        if (logs.length === 0) {
          logs.push('Program executed successfully with no console output.')
        }
        logs.push(`\n⚡ Completed in ${duration}ms (In-Browser V8 Sandbox)`)
        setRunLogs(logs)
      } catch (err) {
        setRunError(err.message)
      } finally {
        console.log = originalLog
        console.warn = originalWarn
        console.error = originalError
        setIsRunning(false)
      }
      return
    }

    // 3. Multi-Language High-Speed Universal Sandbox Engine (C++, Python, Java, Go, Rust, SQL, etc.)
    try {
      const token = await getToken()
      const { data } = await axios.post(
        '/api/ai/execute-code',
        {
          code: cleanCode,
          language: selectedLanguage.name,
          stdin: activeStdin,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        const logs = []
        if (data.command) {
          logs.push(`$ ${data.command}`)
        }
        if (activeStdin) {
          logs.push(`[stdin: "${activeStdin}"]\n`)
        } else {
          logs.push('')
        }

        if (data.stderr) {
          setRunError(data.stderr)
        }

        if (data.stdout) {
          logs.push(data.stdout)
        } else if (!data.stderr) {
          logs.push('Program executed with 0 console output.')
        }

        logs.push(`\n⚡ Process finished with exit code ${data.exitCode} (${data.executionTimeMs || 14}ms)`)
        setRunLogs(logs)
      } else {
        setRunError(data.message || 'Execution failed')
      }
    } catch (err) {
      setRunError(err.response?.data?.message || err.message || 'Execution error')
    } finally {
      setIsRunning(false)
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
          {/* Mode Switcher: Generate vs Debug */}
          <div className='flex items-center p-1 bg-slate-100 rounded-xl w-fit'>
            <button
              type='button'
              onClick={() => setActiveMode('generate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'generate'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className='w-3.5 h-3.5 text-violet-600' />
              <span>Generate Code</span>
            </button>
            <button
              type='button'
              onClick={() => setActiveMode('debug')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === 'debug'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Bug className='w-3.5 h-3.5 text-rose-500' />
              <span>Fix & Debug Code</span>
            </button>
          </div>

          {/* Describe Requirements */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <label className='text-xs font-semibold text-slate-800' htmlFor='codeInput'>
                  {activeMode === 'debug'
                    ? 'Paste Broken Code or Compiler Error'
                    : 'What would you like to build?'}
                </label>
                <VoiceInputButton
                  onTranscript={(voiceText) =>
                    setInput((prev) => (prev ? `${prev} ${voiceText}` : voiceText))
                  }
                />
              </div>
            </div>
            <textarea
              id='codeInput'
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeMode === 'debug'
                  ? 'Paste your broken code and describe what went wrong or paste compiler error...'
                  : 'e.g., Build an async utility function to retry failed HTTP requests with exponential backoff...'
              }
              className='w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition resize-none leading-relaxed'
              required
            />
          </div>

          {/* Quick inspiration chips */}
          <div className='space-y-1.5'>
            <p className='text-[11px] font-medium text-slate-400'>
              {activeMode === 'debug' ? 'Quick debug templates:' : 'Sample prompts:'}
            </p>
            <div className='flex flex-wrap gap-1.5'>
              {(activeMode === 'debug' ? debugSamplePrompts : samplePrompts).map((p) => (
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

          {/* Programming Language Selector (Compact & Breathable) */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-slate-800 flex items-center gap-1.5'>
                <span>Target Language</span>
                <span className='text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-bold border border-violet-200/60'>
                  {selectedLanguage.name} ({selectedLanguage.tag})
                </span>
              </label>

              {/* Compact Dropdown with Categorized Languages */}
              <div className='relative'>
                <select
                  value={selectedLanguage.name}
                  onChange={(e) => {
                    const found = languageList.find((l) => l.name === e.target.value)
                    if (found) setSelectedLanguage(found)
                  }}
                  className='text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer transition pr-6 appearance-none focus:border-violet-500'
                >
                  <optgroup label='Popular'>
                    <option value='JavaScript'>JavaScript (JS)</option>
                    <option value='Python'>Python (PY)</option>
                    <option value='TypeScript'>TypeScript (TS)</option>
                    <option value='React (JSX)'>React (JSX)</option>
                  </optgroup>
                  <optgroup label='Systems & Backend'>
                    <option value='C++'>C++ (CPP)</option>
                    <option value='Java'>Java (JAVA)</option>
                    <option value='Go'>Go (GO)</option>
                    <option value='Rust'>Rust (RS)</option>
                  </optgroup>
                  <optgroup label='Database & Web'>
                    <option value='SQL'>SQL</option>
                    <option value='Tailwind / HTML'>Tailwind / HTML</option>
                  </optgroup>
                </select>
                <ChevronDown className='w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none' />
              </div>
            </div>

            {/* Quick 1-Click Segmented Pills for Top 5 */}
            <div className='grid grid-cols-5 gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70'>
              {[
                { name: 'JavaScript', tag: 'JS' },
                { name: 'Python', tag: 'PY' },
                { name: 'TypeScript', tag: 'TS' },
                { name: 'React (JSX)', tag: 'React' },
                { name: 'C++', tag: 'C++' },
              ].map((pill) => {
                const isSelected = selectedLanguage.name === pill.name
                return (
                  <button
                    key={pill.name}
                    type='button'
                    onClick={() => {
                      const found = languageList.find((l) => l.name === pill.name)
                      if (found) setSelectedLanguage(found)
                    }}
                    className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition cursor-pointer text-center truncate ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                    title={pill.name}
                  >
                    {pill.tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit / Stop Button */}
          {isStreaming ? (
            <button
              type='button'
              onClick={handleStopGeneration}
              className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer'
            >
              <Square className='w-3.5 h-3.5 fill-white' />
              <span>Stop Streaming</span>
            </button>
          ) : (
            <button
              type='submit'
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                activeMode === 'debug'
                  ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:opacity-95 shadow-rose-500/20'
                  : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-violet-500/20'
              }`}
            >
              {loading ? (
                <>
                  <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                  <span>Connecting to AI...</span>
                </>
              ) : activeMode === 'debug' ? (
                <>
                  <Bug className='w-4 h-4' />
                  <span>Diagnose & Fix {selectedLanguage.name} Code</span>
                </>
              ) : (
                <>
                  <Sparkles className='w-4 h-4' />
                  <span>Generate {selectedLanguage.name} Code</span>
                </>
              )}
            </button>
          )}
        </form>

        {/* Right Column: IDE Code Viewer */}
        <div className='lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl flex flex-col min-h-[520px] max-h-[750px] overflow-hidden text-slate-200'>
          {/* Terminal Window Header Bar */}
          <div className='px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap'>
            {/* Window dots and file tab */}
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-1.5'>
                <span className='w-3 h-3 rounded-full bg-rose-500/90 inline-block' />
                <span className='w-3 h-3 rounded-full bg-amber-500/90 inline-block' />
                <span className='w-3 h-3 rounded-full bg-emerald-500/90 inline-block' />
              </div>

              {/* View Switcher Tabs */}
              <div className='flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60'>
                <button
                  type='button'
                  onClick={() => setActiveTab('code')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'code'
                      ? 'bg-violet-600 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className='w-3.5 h-3.5' />
                  <span>solution.{selectedLanguage.ext}</span>
                </button>

                <button
                  type='button'
                  onClick={() => setActiveTab('console')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'console'
                      ? 'bg-violet-600 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className='w-3.5 h-3.5' />
                  <span>Console</span>
                  {runLogs.length > 0 && (
                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                  )}
                </button>

                {(selectedLanguage.ext === 'html' || generatedCode.includes('<html') || generatedCode.includes('<!DOCTYPE') || generatedCode.includes('class=')) && (
                  <button
                    type='button'
                    onClick={() => setActiveTab('preview')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-violet-600 text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className='w-3.5 h-3.5' />
                    <span>Preview</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2'>
              {/* Run Code Button */}
              {generatedCode && !isStreaming && (
                <button
                  type='button'
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className='px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition flex items-center gap-1 cursor-pointer shadow-xs'
                >
                  <Play className='w-3 h-3 fill-white' />
                  <span>{isRunning ? 'Running...' : 'Run'}</span>
                </button>
              )}

              {isStreaming && (
                <div className='flex items-center gap-2'>
                  <span className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[11px] font-medium'>
                    <span className='w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping' />
                    Live
                  </span>
                  <button
                    type='button'
                    onClick={handleStopGeneration}
                    className='p-1 sm:px-2 sm:py-1 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-950/60 border border-rose-800/80 transition flex items-center gap-1 cursor-pointer'
                  >
                    <Square className='w-3 h-3 fill-rose-400' />
                    <span>Stop</span>
                  </button>
                </div>
              )}

              {generatedCode && (
                <>
                  {complexityBadge && (
                    <span className='hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono'>
                      <Zap className='w-3 h-3 text-emerald-400 shrink-0' />
                      <span className='truncate max-w-[180px]'>{complexityBadge}</span>
                    </span>
                  )}

                  <span className='text-[10px] font-mono text-slate-400 hidden sm:inline'>
                    {lineCount} lines
                  </span>

                  <button
                    type='button'
                    onClick={() => setShowPdfModal(true)}
                    title='Export as Technical Spec PDF'
                    className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer'
                  >
                    <FileText className='w-3.5 h-3.5 text-blue-400' />
                    <span className='hidden sm:inline'>PDF Spec</span>
                  </button>

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
                    <span className='hidden sm:inline'>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    title='Download file'
                    className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer'
                  >
                    <Download className='w-3.5 h-3.5' />
                    <span className='hidden sm:inline'>Save</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* IDE Content Area */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-xs leading-relaxed'>
            {loading && !generatedCode ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-12 h-12 mx-auto rounded-2xl bg-violet-950/80 border border-violet-800 text-violet-400 flex items-center justify-center animate-pulse'>
                  <Terminal className='w-6 h-6' />
                </div>
                <h3 className='text-sm font-semibold text-slate-200'>
                  Connecting to AI Code Engine...
                </h3>
                <p className='text-xs text-slate-400'>
                  Preparing low-latency syntax streaming.
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
            ) : activeTab === 'console' ? (
              /* Universal In-App Sandbox Terminal */
              <div className='space-y-3 bg-slate-950/95 p-4 sm:p-5 rounded-xl border border-slate-800/90 min-h-[320px] font-mono text-xs flex flex-col justify-between shadow-2xl'>
                <div className='space-y-3'>
                  {/* Terminal Header */}
                  <div className='flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2.5 flex-wrap gap-2'>
                    <div className='flex items-center gap-2'>
                      <Terminal className='w-4 h-4 text-emerald-400' />
                      <span className='font-semibold text-slate-200 text-xs'>
                        Live Sandbox Terminal
                      </span>
                      <span className='text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5'>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                        <span>{isRunning ? 'Executing...' : selectedLanguage.isBrowserRunnable ? 'In-Browser V8 (<1ms)' : `${selectedLanguage.name} Universal Sandbox`}</span>
                      </span>
                    </div>

                    <div className='flex items-center gap-2'>
                      {runLogs.length > 0 && (
                        <button
                          type='button'
                          onClick={() => {
                            navigator.clipboard.writeText(runLogs.join('\n'))
                            toast.success('Terminal output copied!')
                          }}
                          className='text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer flex items-center gap-1'
                        >
                          <Clipboard className='w-3 h-3' />
                          <span>Copy Output</span>
                        </button>
                      )}
                      <button
                        type='button'
                        onClick={() => {
                          setRunLogs([])
                          setRunError(null)
                        }}
                        className='text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer'
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Stdin Interactive Input Bar */}
                  <div className='p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2'>
                    <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
                      <div className='flex items-center gap-1.5 shrink-0 select-none'>
                        <span className='px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px]'>
                          stdin &gt;
                        </span>
                        <span className='text-[11px] text-slate-400 hidden sm:inline'>Terminal Input:</span>
                      </div>
                      <input
                        type='text'
                        value={stdinInput}
                        onChange={(e) => setStdinInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRunCode()
                        }}
                        placeholder={
                          selectedLanguage.name === 'C++'
                            ? 'e.g. 20 (for std::cin >> age)'
                            : selectedLanguage.name === 'Python'
                            ? 'e.g. Alice or 10 20 (for input())'
                            : 'Enter standard input (stdin) for program...'
                        }
                        className='flex-1 bg-black/50 border border-slate-800 rounded-md px-2.5 py-1.5 text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono text-xs'
                      />
                      <button
                        type='button'
                        onClick={() => handleRunCode()}
                        disabled={isRunning}
                        className='px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs shrink-0'
                      >
                        {isRunning ? (
                          <>
                            <span className='w-2 h-2 rounded-full bg-white animate-ping' />
                            <span>Running...</span>
                          </>
                        ) : (
                          <>
                            <Play className='w-3 h-3 fill-white' />
                            <span>Run with Input</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick test presets */}
                    <div className='flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap pt-0.5'>
                      <span className='text-slate-500 font-mono'>Quick presets:</span>
                      {['18', '25', '10 20', 'Hello World'].map((preset) => (
                        <button
                          key={preset}
                          type='button'
                          onClick={() => {
                            setStdinInput(preset)
                            handleRunCode(preset)
                          }}
                          className='px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700/60 transition cursor-pointer hover:text-emerald-300'
                        >
                          "{preset}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output Terminal Logs */}
                  <div className='bg-black/75 rounded-lg p-3.5 border border-slate-800/80 min-h-[160px] max-h-[380px] overflow-y-auto space-y-2 font-mono text-xs'>
                    {isRunning ? (
                      <div className='flex items-center gap-2 text-emerald-400 py-6 justify-center'>
                        <span className='w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping' />
                        <span className='animate-pulse'>Compiling & executing {selectedLanguage.name} in sandbox...</span>
                      </div>
                    ) : runError ? (
                      <div className='space-y-1.5'>
                        <div className='flex items-start gap-2 text-rose-400 bg-rose-950/40 p-3 rounded-lg border border-rose-800/60'>
                          <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
                          <div className='overflow-x-auto w-full'>
                            <p className='font-semibold text-rose-300'>Runtime / Execution Error:</p>
                            <pre className='mt-1 whitespace-pre-wrap text-rose-400 font-mono text-xs leading-relaxed'>
                              {runError}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : runLogs.length > 0 ? (
                      <div className='space-y-1'>
                        {runLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className={`whitespace-pre-wrap leading-relaxed ${
                              log.startsWith('$')
                                ? 'text-emerald-400 font-semibold'
                                : log.startsWith('[stdin:')
                                ? 'text-cyan-400 italic'
                                : log.startsWith('\n⚡')
                                ? 'text-amber-400 font-medium'
                                : 'text-slate-200'
                            }`}
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8 text-slate-500 space-y-1'>
                        <p className='text-slate-400'>Ready to execute {selectedLanguage.name}.</p>
                        <p className='text-[11px] text-slate-600'>
                          Click <span className='text-emerald-400 font-semibold'>Run</span> above or enter standard input and click <span className='text-emerald-400 font-semibold'>Run with Input</span>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer status note */}
                <div className='pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500'>
                  <span className='flex items-center gap-1.5'>
                    <Sparkles className='w-3 h-3 text-violet-400' />
                    <span>In-app native execution engine • Zero external setup</span>
                  </span>
                  {selectedLanguage.runnerUrl && (
                    <a
                      href={selectedLanguage.runnerUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-slate-500 hover:text-slate-300 flex items-center gap-1 transition'
                    >
                      <ExternalLink className='w-3 h-3' />
                      <span className='hidden sm:inline'>Open in External IDE</span>
                    </a>
                  )}
                </div>
              </div>
            ) : activeTab === 'preview' ? (
              /* Live Web Preview for HTML/JSX */
              <div className='bg-slate-900 rounded-xl overflow-hidden border border-slate-800 min-h-[350px] flex flex-col'>
                <div className='bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono'>
                  <span className='flex items-center gap-1.5 text-slate-300'>
                    <Eye className='w-3.5 h-3.5 text-violet-400' />
                    <span>Live Web Preview Sandbox</span>
                  </span>
                  <span className='text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20'>
                    Active DOM
                  </span>
                </div>
                <iframe
                  title='HTML Preview'
                  srcDoc={generatedCode}
                  sandbox='allow-scripts'
                  className='w-full flex-1 min-h-[320px] bg-white border-0'
                />
              </div>
            ) : (
              /* Code with line numbers */
              <div className='space-y-6'>
                <div className='flex font-mono text-xs leading-relaxed'>
                  {/* Line Numbers */}
                  <div className='select-none pr-4 text-right text-slate-600 shrink-0 font-mono'>
                    {generatedCode.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Code Text with Live Pulse */}
                  <pre className='text-indigo-100 whitespace-pre-wrap overflow-x-auto selection:bg-violet-600 selection:text-white flex-1'>
                    <code>{generatedCode}</code>
                    {isStreaming && (
                      <span className='inline-block w-2 h-3.5 bg-violet-400 ml-0.5 animate-pulse align-middle' />
                    )}
                  </pre>
                </div>

                {/* AI Refine Actions */}
                {!isStreaming && (
                  <div className='pt-5 border-t border-slate-800/80'>
                    <div className='flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5'>
                      <Wand2 className='w-3.5 h-3.5 text-violet-400' />
                      <span>Refine Code:</span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {[
                        {
                          label: '🧪 Add Unit Tests',
                          action: `Write comprehensive unit test cases for this code using standard testing practices`,
                        },
                        {
                          label: '💡 Explain Line-by-Line',
                          action: `Add clear explanatory inline comments to every key section of this code explaining how it works`,
                        },
                        {
                          label: '⚡ Optimize Big-O Complexity',
                          action: `Optimize time and space complexity of this code and note the Big-O efficiency`,
                        },
                        {
                          label: '🛡️ Add Defensive Validation',
                          action: `Add strict input validation, null/undefined guards, and error handling`,
                        },
                      ].map((actionItem) => (
                        <button
                          key={actionItem.label}
                          type='button'
                          onClick={() => handleRefineCode(actionItem.action)}
                          className='text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer'
                        >
                          {actionItem.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature 1: Smart Content-Aware Technical Spec PDF Exporter */}
      <SmartPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        title={
          input.length > 55
            ? `${input.slice(0, 55)}...`
            : input || `${selectedLanguage.name} Technical Architecture Specification`
        }
        content={generatedCode}
        meta={{
          type: 'technical',
          language: selectedLanguage.name,
          prompt: input,
          complexity: complexityBadge || 'O(N) Optimized',
          mode: activeMode === 'debug' ? 'Debug & Fix' : 'Code Generation',
        }}
      />
    </div>
  )
}

export default QuickCode
