import React, { useState } from 'react'
import {
  SquarePen,
  Sparkles,
  Clipboard,
  Check,
  Download,
  Clock,
  BookOpen,
  Sliders,
  RotateCcw,
  Layers,
} from 'lucide-react'
import axios from 'axios'
import { useAuth, useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import Markdown from 'react-markdown'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const articleLengths = [
  { length: 600, label: 'Short', words: '~500 - 600 words' },
  { length: 1200, label: 'Medium', words: '~800 - 1200 words' },
  { length: 1800, label: 'Deep Dive', words: '~1500+ words' },
]

const toneOptions = [
  'Professional',
  'Conversational',
  'Technical',
  'Persuasive',
  'Thought Leadership',
  'Casual',
]

const samplePrompts = [
  'The Rise of Autonomous AI Agents in 2026',
  'Next.js 15 Full-Stack Best Practices',
  'Designing High-Conversion SaaS Onboarding',
]

const WriteArticle = () => {
  const [selectedLength, setSelectedLength] = useState(articleLengths[1])
  const [selectedTone, setSelectedTone] = useState(toneOptions[0])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)

  const { getToken } = useAuth()
  const { user } = useUser()

  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input.trim()) {
      toast.error('Please specify an article topic')
      return
    }

    try {
      setLoading(true)
      const prompt = `Write a ${selectedTone.toLowerCase()} article about: "${input}". Length target: ${
        selectedLength.words
      }. Include a captivating headline, structured subheadings, clear takeaways, and conclusion.`

      const { data } = await axios.post(
        '/api/ai/generate-article',
        { prompt, length: selectedLength.length },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      )

      if (data.success) {
        setContent(data.content)
        toast.success('Article crafted successfully!')
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Failed to generate article')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Generation error')
    }
    setLoading(false)
  }

  const handleCopy = () => {
    if (!content) return
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      toast.success('Article copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownloadMarkdown = () => {
    if (!content) return
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${input.slice(0, 30).trim().replace(/\s+/g, '-') || 'article'}.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown file downloaded')
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase'>
          <SquarePen className='w-4 h-4' /> AI Writer Studio
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Write Long-Form Articles
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Generate structured, SEO-optimized articles, essays, and guides tailored by length and tone.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Configuration Form */}
        <form
          onSubmit={onSubmitHandler}
          className='lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5'
        >
          {/* Topic Input */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-slate-800' htmlFor='topic'>
                Article Topic or Headline
              </label>
              <span className='text-[10px] text-slate-400'>{input.length}/250</span>
            </div>
            <textarea
              id='topic'
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g., Why Generative AI is reshaping developer productivity...'
              className='w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition resize-none'
              maxLength={250}
              required
            />
          </div>

          {/* Quick inspiration chips */}
          <div className='space-y-1.5'>
            <p className='text-[11px] font-medium text-slate-400'>Try an inspiration:</p>
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

          {/* Length Selector */}
          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-800'>Target Length</label>
            <div className='grid grid-cols-3 gap-2'>
              {articleLengths.map((item) => {
                const isSelected = selectedLength.label === item.label
                return (
                  <button
                    key={item.label}
                    type='button'
                    onClick={() => setSelectedLength(item)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? 'text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className='text-[10px] text-slate-500 mt-0.5'>{item.words}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tone Selector */}
          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-800'>Tone of Voice</label>
            <div className='flex flex-wrap gap-1.5'>
              {toneOptions.map((tone) => {
                const isSelected = selectedTone === tone
                return (
                  <button
                    key={tone}
                    type='button'
                    onClick={() => setSelectedTone(tone)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {tone}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:opacity-95 shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
          >
            {loading ? (
              <>
                <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                <span>Crafting Masterpiece...</span>
              </>
            ) : (
              <>
                <Sparkles className='w-4 h-4' />
                <span>Generate Article</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Output Viewer */}
        <div className='lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[500px] max-h-[750px] overflow-hidden'>
          {/* Header Bar */}
          <div className='p-4 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50'>
            <div className='flex items-center gap-2 min-w-0'>
              <BookOpen className='w-4 h-4 text-blue-600 shrink-0' />
              <h2 className='text-xs sm:text-sm font-semibold text-slate-800 truncate'>
                Generated Article
              </h2>
            </div>

            {content && (
              <div className='flex items-center gap-2'>
                <span className='hidden sm:flex items-center gap-1 text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg'>
                  <Clock className='w-3 h-3 text-slate-400' />
                  {wordCount} words • ~{readingTime} min read
                </span>

                <button
                  onClick={handleCopy}
                  title='Copy to clipboard'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
                >
                  {copied ? (
                    <Check className='w-3.5 h-3.5 text-emerald-600' />
                  ) : (
                    <Clipboard className='w-3.5 h-3.5' />
                  )}
                  <span className='hidden sm:inline'>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  title='Download Markdown'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
                >
                  <Download className='w-3.5 h-3.5' />
                  <span className='hidden sm:inline'>Export</span>
                </button>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className='flex-1 overflow-y-auto p-5 sm:p-8'>
            {loading ? (
              <div className='space-y-4 py-8 max-w-lg mx-auto text-center'>
                <div className='w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-6 h-6' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  Visionary AI is writing your article...
                </h3>
                <p className='text-xs text-slate-500'>
                  Synthesizing key insights, organizing arguments, and polishing the prose.
                </p>
                <div className='space-y-2 pt-4'>
                  <div className='h-3 bg-slate-100 rounded-full animate-pulse w-3/4 mx-auto' />
                  <div className='h-3 bg-slate-100 rounded-full animate-pulse w-5/6 mx-auto' />
                  <div className='h-3 bg-slate-100 rounded-full animate-pulse w-2/3 mx-auto' />
                </div>
              </div>
            ) : !content ? (
              <div className='h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3'>
                <div className='w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400'>
                  <SquarePen className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                    Ready to create your next article
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                    Specify your topic on the left and click "Generate Article".
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

export default WriteArticle
