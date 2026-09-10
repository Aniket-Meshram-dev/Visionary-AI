import React, { useState } from 'react'
import {
  Hash,
  Sparkles,
  Clipboard,
  Check,
  Download,
  Trash2,
  FileText,
  Sliders,
  TrendingDown,
  ArrowRight,
  Copy,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Markdown from 'react-markdown'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const presetPercentages = [
  { label: 'Light (25%)', value: 25, desc: 'Keep full context' },
  { label: 'Balanced (50%)', value: 50, desc: 'Half original length' },
  { label: 'Deep (75%)', value: 75, desc: 'Concise executive summary' },
]

const SummarizeArticle = () => {
  const [inputText, setInputText] = useState('')
  const [reducePercent, setReducePercent] = useState(50)
  const [summaryFormat, setSummaryFormat] = useState('bullets') // 'bullets' | 'paragraph'
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [copied, setCopied] = useState(false)

  const { getToken, user } = useAuth()

  const originalWordCount = inputText ? inputText.trim().split(/\s+/).filter(Boolean).length : 0
  const summaryWordCount = summary ? summary.trim().split(/\s+/).filter(Boolean).length : 0
  const wordsSaved = Math.max(0, originalWordCount - summaryWordCount)
  const actualPercentSaved =
    originalWordCount > 0 ? Math.round((wordsSaved / originalWordCount) * 100) : 0

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setInputText(text)
        toast.success('Pasted from clipboard!')
      }
    } catch {
      toast.error('Clipboard access not permitted')
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) {
      toast.error('Please enter text to summarize')
      return
    }

    const percent = Number(reducePercent)
    if (isNaN(percent) || percent < 5 || percent > 95) {
      toast.error('Please select a reduction percentage between 5% and 95%')
      return
    }

    try {
      setLoading(true)
      const formattedInput =
        summaryFormat === 'bullets'
          ? `${inputText}\n\n(Provide the output formatted as clear, concise bulleted key takeaways)`
          : `${inputText}\n\n(Provide the output as a coherent, executive paragraph summary)`

      const { data } = await axios.post(
        '/api/ai/summarize-article',
        {
          text: formattedInput,
          reduce_percent: percent,
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      )

      if (data.success) {
        setSummary(data.summary)
        toast.success('Text summarized successfully!')
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Failed to summarize text.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Something went wrong.')
    }
    setLoading(false)
  }

  const handleCopy = () => {
    if (!summary) return
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true)
      toast.success('Summary copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    if (!summary) return
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `summary-${Date.now()}.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Summary exported')
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 text-cyan-600 font-semibold text-xs tracking-wider uppercase'>
          <Hash className='w-4 h-4' /> AI Summarization
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Summarize Long Documents
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Condense lengthy articles, meeting notes, papers, or contracts into rapid, high-signal takeaways.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Input Form */}
        <form
          onSubmit={onSubmitHandler}
          className='lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5'
        >
          {/* Header Row with Actions */}
          <div className='flex items-center justify-between'>
            <label className='text-xs font-semibold text-slate-800' htmlFor='inputText'>
              Original Text or Article
            </label>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={handlePaste}
                className='text-[11px] font-medium text-slate-600 hover:text-cyan-700 bg-slate-100 hover:bg-slate-200/70 px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer'
              >
                <Copy className='w-3 h-3' /> Paste
              </button>
              {inputText && (
                <button
                  type='button'
                  onClick={() => setInputText('')}
                  className='text-[11px] font-medium text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-md transition cursor-pointer'
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            id='inputText'
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={9}
            className='w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition leading-relaxed'
            placeholder='Paste your article, meeting transcript, academic paper, or report here...'
            required
          />

          <div className='flex items-center justify-between text-[11px] text-slate-400'>
            <span>{originalWordCount} words</span>
            <span>{inputText.length} characters</span>
          </div>

          {/* Format Selection */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-slate-800'>Summary Format</label>
            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => setSummaryFormat('bullets')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  summaryFormat === 'bullets'
                    ? 'border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/10 text-cyan-800 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <p className='text-xs'>⚡ Bulleted Key Points</p>
                <p className='text-[10px] text-slate-500 mt-0.5'>Fastest to read</p>
              </button>

              <button
                type='button'
                onClick={() => setSummaryFormat('paragraph')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  summaryFormat === 'paragraph'
                    ? 'border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/10 text-cyan-800 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <p className='text-xs'>📄 Executive Narrative</p>
                <p className='text-[10px] text-slate-500 mt-0.5'>Flowing cohesive prose</p>
              </button>
            </div>
          </div>

          {/* Reduction Percentage Slider */}
          <div className='space-y-3 pt-1'>
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-slate-800 flex items-center gap-1.5'>
                <Sliders className='w-3.5 h-3.5 text-cyan-600' /> Reduction Target
              </label>
              <span className='text-xs font-mono font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md'>
                Decrease by {reducePercent}%
              </span>
            </div>

            <input
              type='range'
              min='15'
              max='85'
              step='5'
              value={reducePercent}
              onChange={(e) => setReducePercent(Number(e.target.value))}
              className='w-full accent-cyan-600 cursor-pointer'
            />

            {/* Presets */}
            <div className='grid grid-cols-3 gap-2'>
              {presetPercentages.map((preset) => (
                <button
                  key={preset.value}
                  type='button'
                  onClick={() => setReducePercent(preset.value)}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    reducePercent === preset.value
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <p className='text-xs font-bold'>{preset.label}</p>
                  <p className='text-[10px] text-slate-500 truncate'>{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 hover:opacity-95 shadow-md shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
          >
            {loading ? (
              <>
                <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                <span>Condensing Document...</span>
              </>
            ) : (
              <>
                <Sparkles className='w-4 h-4' />
                <span>Summarize Content</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Summary Output */}
        <div className='lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[500px] max-h-[750px] overflow-hidden'>
          {/* Header Bar */}
          <div className='p-4 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50'>
            <div className='flex items-center gap-2 min-w-0'>
              <FileText className='w-4 h-4 text-cyan-600 shrink-0' />
              <h2 className='text-xs sm:text-sm font-semibold text-slate-800 truncate'>
                AI Condensed Summary
              </h2>
            </div>

            {summary && (
              <div className='flex items-center gap-2'>
                <span className='hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium'>
                  <TrendingDown className='w-3 h-3' /> -{actualPercentSaved}% reduction
                </span>

                <button
                  onClick={handleCopy}
                  title='Copy summary'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-cyan-600 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
                >
                  {copied ? (
                    <Check className='w-3.5 h-3.5 text-emerald-600' />
                  ) : (
                    <Clipboard className='w-3.5 h-3.5' />
                  )}
                  <span className='hidden sm:inline'>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  title='Download summary'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-cyan-600 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
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
              <div className='space-y-4 py-12 max-w-sm mx-auto text-center'>
                <div className='w-12 h-12 mx-auto rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-6 h-6' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  Extracting core takeaways...
                </h3>
                <p className='text-xs text-slate-500'>
                  Eliminating filler, distilling arguments, and keeping only the critical insights.
                </p>
                <div className='space-y-2 pt-4'>
                  <div className='h-3 bg-slate-100 rounded-full animate-pulse w-3/4 mx-auto' />
                  <div className='h-3 bg-slate-100 rounded-full animate-pulse w-5/6 mx-auto' />
                  <div className='h-3 bg-slate-100 rounded-full animate-pulse w-2/3 mx-auto' />
                </div>
              </div>
            ) : !summary ? (
              <div className='h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3'>
                <div className='w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400'>
                  <Hash className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                    Ready to summarize
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                    Paste your text on the left and adjust the reduction slider to start.
                  </p>
                </div>
              </div>
            ) : (
              <div className='prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed reset-tw'>
                <Markdown>{summary}</Markdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummarizeArticle
