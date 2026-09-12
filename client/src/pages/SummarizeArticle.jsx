import React, { useState, useRef } from 'react'
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
  Square,
  Globe,
  Youtube,
  Layers,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  FileSearch,
  Zap,
  UploadCloud,
  FileUp,
  FileDown,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { streamAiCompletion } from '../services/streamService'
import VisualMindmapViewer from '../components/VisualMindmapViewer'
import AudioBriefingPlayer from '../components/AudioBriefingPlayer'
import SummaryChatDrawer from '../components/SummaryChatDrawer'
import SmartPdfExportModal from '../components/SmartPdfExportModal'

const presetPercentages = [
  { label: 'Light (25%)', value: 25, desc: 'Keep full context' },
  { label: 'Balanced (50%)', value: 50, desc: 'Half original length' },
  { label: 'Deep (75%)', value: 75, desc: 'Concise executive summary' },
]

const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
axios.defaults.baseURL = BASE_URL

const SummarizeArticle = () => {
  // Input & Source States
  const [sourceType, setSourceType] = useState('text') // 'text' | 'url' | 'youtube' | 'file'
  const [sourceUrl, setSourceUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedMeta, setExtractedMeta] = useState(null) // { title, type, wordCount, pageCount, filename }
  const [isExtractingFile, setIsExtractingFile] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const [inputText, setInputText] = useState(() => new URLSearchParams(window.location.search).get('prompt') || '')
  const [reducePercent, setReducePercent] = useState(50)
  const [summaryFormat, setSummaryFormat] = useState('bullets') // 'bullets' | 'paragraph'
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [summary, setSummary] = useState('')
  const [copied, setCopied] = useState(false)

  // Visual Mindmap States
  const [outputTab, setOutputTab] = useState('summary') // 'summary' | 'mindmap'
  const [mermaidCode, setMermaidCode] = useState('')
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false)

  // Smart Content-Aware PDF Exporter State
  const [showPdfModal, setShowPdfModal] = useState(false)

  const abortControllerRef = useRef(null)
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
        setExtractedMeta(null)
        setUploadedFile(null)
        toast.success('Pasted from clipboard!')
      }
    } catch {
      toast.error('Clipboard access not permitted')
    }
  }

  // Handle Document Ingestion (.pdf, .txt, .md)
  const handleFileUpload = async (file) => {
    if (!file) return
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!['pdf', 'txt', 'md', 'markdown'].includes(ext)) {
      toast.error('Please upload a valid PDF or text document (.pdf, .txt, .md)')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds allowed limit (15MB)')
      return
    }

    try {
      setIsExtractingFile(true)
      const formData = new FormData()
      formData.append('file', file)

      const token = await getToken()
      const res = await axios.post(
        `${BASE_URL}/api/ai/extract-document-content`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      )

      if (res.data?.success) {
        setInputText(res.data.content)
        setUploadedFile({
          name: res.data.filename,
          size: (file.size / 1024).toFixed(1) + ' KB',
          pageCount: res.data.pageCount,
          wordCount: res.data.wordCount,
          type: ext
        })
        setExtractedMeta({
          title: res.data.title,
          type: 'document',
          wordCount: res.data.wordCount,
          pageCount: res.data.pageCount,
          filename: res.data.filename
        })
        toast.success(`Extracted ${res.data.wordCount} words from ${res.data.filename}!`)
      } else {
        toast.error(res.data?.message || 'Failed to parse document')
      }
    } catch (err) {
      console.error('File extraction error:', err)
      toast.error(err.response?.data?.message || 'Failed to extract text from document')
    } finally {
      setIsExtractingFile(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // Handle Multi-Source Ingestion (Web URL or YouTube Video)
  const handleExtractSource = async (e) => {
    if (e) e.preventDefault()
    if (!sourceUrl.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    try {
      setIsExtracting(true)
      const token = await getToken()
      const res = await axios.post(
        `${BASE_URL}/api/ai/extract-source-content`,
        { url: sourceUrl.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )

      if (res.data?.success) {
        setInputText(res.data.content)
        setUploadedFile(null)
        setExtractedMeta({
          title: res.data.title,
          type: res.data.type,
          wordCount: res.data.wordCount,
        })
        toast.success(
          res.data.type === 'youtube'
            ? 'YouTube transcript extracted successfully!'
            : 'Web article content extracted successfully!'
        )
      } else {
        toast.error(res.data?.message || 'Failed to extract content')
      }
    } catch (err) {
      console.error('Extraction error:', err)
      toast.error(err.response?.data?.message || 'Content extraction failed. Please check the URL.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      setLoading(false)
      toast.success('Summary streaming paused. Content saved.')
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) {
      toast.error('Please enter or ingest text to summarize')
      return
    }

    const percent = Number(reducePercent)
    if (isNaN(percent) || percent < 5 || percent > 95) {
      toast.error('Please select a reduction percentage between 5% and 95%')
      return
    }

    try {
      setLoading(true)
      setIsStreaming(true)
      setSummary('')
      setOutputTab('summary')

      const controller = new AbortController()
      abortControllerRef.current = controller

      const formattedInput =
        summaryFormat === 'bullets'
          ? `${inputText}\n\n(Provide the output formatted as clear, concise bulleted key takeaways)`
          : `${inputText}\n\n(Provide the output as a coherent, executive paragraph summary)`

      const token = await getToken()

      await streamAiCompletion({
        endpoint: '/api/ai/stream-summary',
        body: {
          text: formattedInput,
          reduce_percent: percent,
        },
        token,
        signal: controller.signal,
        onChunk: (chunk, accumulated) => {
          setSummary(accumulated)
          setLoading(false)
        },
        onComplete: () => {
          setIsStreaming(false)
          setLoading(false)
          abortControllerRef.current = null
          toast.success('Summary generated!')
          if (user?.reload) user.reload()
        },
        onError: (err) => {
          setIsStreaming(false)
          setLoading(false)
          abortControllerRef.current = null
          toast.error(err.message || 'Streaming failed')
        },
      })
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error(error.message || 'Something went wrong.')
      }
      setIsStreaming(false)
      setLoading(false)
    }
  }

  // Handle Mindmap Generation from Summary or Input Text
  const handleGenerateMindmap = async () => {
    const textToMap = (summary || inputText || '').trim()
    if (!textToMap) {
      toast.error('Please enter text or generate a summary first before creating a concept mindmap')
      return
    }

    try {
      setIsGeneratingMindmap(true)
      setOutputTab('mindmap')
      const token = await getToken()
      const res = await axios.post(
        `${BASE_URL}/api/ai/generate-summary-mindmap`,
        {
          summary: textToMap,
          title: extractedMeta?.title || 'Document Concept Map',
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )

      if (res.data?.success && res.data.mermaidCode) {
        setMermaidCode(res.data.mermaidCode)
        toast.success('Visual mindmap synthesized!')
      } else {
        toast.error(res.data?.message || 'Failed to synthesize concept mindmap')
      }
    } catch (err) {
      console.error('generateSummaryMindmap error:', err)
      toast.error(err.response?.data?.message || 'Mindmap generation failed')
    } finally {
      setIsGeneratingMindmap(false)
    }
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
          <Hash className='w-4 h-4' /> AI Summarization & Knowledge Synthesis
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Autonomous Document & Media Summarizer
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Ingest raw text, Web URLs, or YouTube videos to generate executive summaries, visual concept mindmaps, and audio briefings.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Multi-Source Input Form */}
        <div className='lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5'>
          {/* Source Ingestion Tabs */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-slate-800'>Ingestion Source</label>
              <span className='text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded font-medium'>
                Zero Cost API
              </span>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100/70 p-1 rounded-xl'>
              <button
                type='button'
                onClick={() => setSourceType('text')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sourceType === 'text'
                    ? 'bg-white text-cyan-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className='w-3.5 h-3.5' />
                <span>Direct Text</span>
              </button>

              <button
                type='button'
                onClick={() => setSourceType('url')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sourceType === 'url'
                    ? 'bg-white text-cyan-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className='w-3.5 h-3.5' />
                <span>Web URL</span>
              </button>

              <button
                type='button'
                onClick={() => setSourceType('youtube')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sourceType === 'youtube'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Youtube className='w-3.5 h-3.5' />
                <span>YouTube</span>
              </button>

              <button
                type='button'
                onClick={() => setSourceType('file')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sourceType === 'file'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileUp className='w-3.5 h-3.5' />
                <span>Upload PDF</span>
              </button>
            </div>
          </div>

          {/* PDF / Document Drag & Drop Box */}
          {sourceType === 'file' && (
            <div className='p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5'>
              <div className='flex items-center justify-between'>
                <label className='text-xs font-semibold text-slate-700 flex items-center gap-1.5'>
                  <FileUp className='w-4 h-4 text-indigo-600' /> Document Uploader (.pdf, .txt, .md)
                </label>
                <span className='text-[10px] text-slate-400'>Max 15MB</span>
              </div>

              <input
                ref={fileInputRef}
                type='file'
                accept='.pdf,.txt,.md,.markdown'
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
                }}
                className='hidden'
              />

              {uploadedFile && inputText ? (
                <div className='bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs'>
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <div className='w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs uppercase'>
                      {uploadedFile.type}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-semibold text-slate-800 truncate'>
                        {uploadedFile.name}
                      </p>
                      <div className='flex items-center gap-2 text-[11px] text-slate-400 mt-0.5'>
                        <span>{uploadedFile.size}</span>
                        {uploadedFile.pageCount > 1 && (
                          <>
                            <span>•</span>
                            <span>{uploadedFile.pageCount} Pages</span>
                          </>
                        )}
                        <span>•</span>
                        <span className='text-indigo-600 font-medium font-mono'>
                          {uploadedFile.wordCount} words
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <button
                      type='button'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isExtractingFile}
                      className='py-1 px-2.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer'
                    >
                      Replace
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setUploadedFile(null)
                        setInputText('')
                        setExtractedMeta(null)
                      }}
                      className='p-1 text-rose-500 hover:bg-rose-50 rounded-md transition cursor-pointer'
                      title='Remove file'
                    >
                      <Trash2 className='w-3.5 h-3.5' />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !isExtractingFile && fileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition cursor-pointer ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50/60'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 bg-white'
                  }`}
                >
                  {isExtractingFile ? (
                    <div className='space-y-2 py-2 flex flex-col items-center'>
                      <RefreshCw className='w-6 h-6 text-indigo-600 animate-spin' />
                      <p className='text-xs font-semibold text-slate-800'>
                        Extracting document text & structure...
                      </p>
                      <p className='text-[11px] text-slate-400'>
                        Reading pages, paragraphs, and formatting
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className='w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2'>
                        <UploadCloud className='w-5 h-5' />
                      </div>
                      <p className='text-xs font-semibold text-slate-800'>
                        Click to browse or drop your file here
                      </p>
                      <p className='text-[11px] text-slate-400 mt-1'>
                        Supports PDF research papers, eBooks, TXT, and Markdown files
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* URL / YouTube Ingestion Box */}
          {(sourceType === 'url' || sourceType === 'youtube') && (
            <form onSubmit={handleExtractSource} className='p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5'>
              <div className='flex items-center justify-between'>
                <label className='text-xs font-semibold text-slate-700 flex items-center gap-1.5'>
                  {sourceType === 'youtube' ? (
                    <>
                      <Youtube className='w-4 h-4 text-rose-600' /> YouTube Video Link
                    </>
                  ) : (
                    <>
                      <Globe className='w-4 h-4 text-cyan-600' /> Web Article URL
                    </>
                  )}
                </label>
                <span className='text-[10px] text-slate-400'>Auto-extracted</span>
              </div>

              <div className='flex items-center gap-2'>
                <input
                  type='url'
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder={
                    sourceType === 'youtube'
                      ? 'https://www.youtube.com/watch?v=...'
                      : 'https://techcrunch.com/article-slug...'
                  }
                  required
                  className='flex-1 p-2.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10'
                />
                <button
                  type='submit'
                  disabled={isExtracting || !sourceUrl.trim()}
                  className='py-2.5 px-3.5 text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 shrink-0'
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className='w-3.5 h-3.5 animate-spin' />
                      <span>Scraping...</span>
                    </>
                  ) : (
                    <>
                      <Zap className='w-3.5 h-3.5 text-amber-400' />
                      <span>Ingest</span>
                    </>
                  )}
                </button>
              </div>

              {extractedMeta && (
                <div className='flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg'>
                  <span className='font-medium truncate max-w-[280px]'>
                    ✓ Loaded: {extractedMeta.title}
                  </span>
                  <span className='font-mono font-bold'>{extractedMeta.wordCount} words</span>
                </div>
              )}
            </form>
          )}

          {/* Form Content */}
          <form onSubmit={onSubmitHandler} className='space-y-4'>
            {/* Header Row with Actions */}
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-slate-800' htmlFor='inputText'>
                Document Content
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
                    onClick={() => {
                      setInputText('')
                      setExtractedMeta(null)
                    }}
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
              rows={sourceType !== 'text' ? 7 : 9}
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
                className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 hover:opacity-95 shadow-md shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
              >
                {loading ? (
                  <>
                    <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                    <span>Connecting to AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className='w-4 h-4' />
                    <span>Summarize Content</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Right Column: Output Workbench (Summary & Visual Mindmap Tabs) */}
        <div className='lg:col-span-6 flex flex-col space-y-4'>
          {/* Main Output Box */}
          <div className='bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[520px] max-h-[750px] overflow-hidden'>
            {/* Header Tabs Bar */}
            <div className='p-3 px-4 sm:px-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70'>
              {/* Tab Switcher */}
              <div className='flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl'>
                <button
                  type='button'
                  onClick={() => setOutputTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    outputTab === 'summary'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className='w-3.5 h-3.5 text-cyan-600' />
                  <span>Executive Summary</span>
                </button>

                <button
                  type='button'
                  onClick={() => {
                    setOutputTab('mindmap')
                    if (!mermaidCode && (summary || inputText)) {
                      handleGenerateMindmap()
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    outputTab === 'mindmap'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className='w-3.5 h-3.5 text-cyan-600' />
                  <span>Visual Concept Map</span>
                  {!mermaidCode && (summary || inputText) && (
                    <span className='w-2 h-2 rounded-full bg-cyan-500 animate-pulse' />
                  )}
                </button>
              </div>

              {/* Action Controls for Active Tab */}
              <div className='flex items-center gap-2'>
                {outputTab === 'summary' && summary && (
                  <>
                    <span className='hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium'>
                      <TrendingDown className='w-3 h-3' /> -{actualPercentSaved}%
                    </span>

                    {/* Extract PDF Button */}
                    <button
                      type='button'
                      onClick={() => setShowPdfModal(true)}
                      title='Extract as Content-Aware High-DPI PDF'
                      className='px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-95 shadow-xs transition flex items-center gap-1.5 cursor-pointer'
                    >
                      <FileDown className='w-3.5 h-3.5' />
                      <span className='hidden sm:inline'>Extract PDF</span>
                    </button>

                    <button
                      onClick={handleGenerateMindmap}
                      disabled={isGeneratingMindmap}
                      title='Generate Visual Concept Mindmap'
                      className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 transition flex items-center gap-1 cursor-pointer'
                    >
                      <Layers className='w-3.5 h-3.5' />
                      <span className='hidden sm:inline'>
                        {isGeneratingMindmap ? 'Synthesizing...' : 'Map Concepts'}
                      </span>
                    </button>

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
                      title='Download summary markdown'
                      className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-cyan-600 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
                    >
                      <Download className='w-3.5 h-3.5' />
                      <span className='hidden sm:inline'>Export</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tab Body */}
            <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
              {outputTab === 'summary' ? (
                loading && !summary ? (
                  <div className='space-y-4 py-16 max-w-sm mx-auto text-center'>
                    <div className='w-12 h-12 mx-auto rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center animate-bounce'>
                      <Sparkles className='w-6 h-6' />
                    </div>
                    <h3 className='text-sm font-semibold text-slate-800'>
                      Distilling core insights...
                    </h3>
                    <p className='text-xs text-slate-500'>
                      Extracting arguments, statistics, and eliminating redundant padding.
                    </p>
                    <div className='space-y-2 pt-4'>
                      <div className='h-3 bg-slate-100 rounded-full animate-pulse w-3/4 mx-auto' />
                      <div className='h-3 bg-slate-100 rounded-full animate-pulse w-5/6 mx-auto' />
                      <div className='h-3 bg-slate-100 rounded-full animate-pulse w-2/3 mx-auto' />
                    </div>
                  </div>
                ) : !summary ? (
                  <div className='h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3'>
                    <div className='w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400'>
                      <FileSearch className='w-7 h-7' />
                    </div>
                    <div className='max-w-xs'>
                      <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                        Ready to summarize
                      </h3>
                      <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                        Choose direct text, web URL, or YouTube video to begin.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='relative space-y-4'>
                    {/* Audio Studio Player Bar */}
                    <div className='pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2'>
                      <AudioBriefingPlayer text={summary} title={extractedMeta?.title || 'Executive Briefing'} />
                    </div>
                    <MarkdownRenderer content={summary} />
                    {isStreaming && (
                      <div className='flex items-center gap-2 mt-4 text-xs font-mono text-cyan-600 animate-pulse'>
                        <span className='w-2 h-4 bg-cyan-600 inline-block rounded-xs' />
                        <span>Streaming summary live...</span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Mindmap Tab View */
                <VisualMindmapViewer
                  mermaidCode={mermaidCode}
                  isLoading={isGeneratingMindmap}
                  onRegenerate={handleGenerateMindmap}
                  title={extractedMeta?.title || 'Concept Knowledge Map'}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grounded Follow-up Q&A Drawer */}
      {(summary || inputText) && (
        <SummaryChatDrawer
          summary={summary}
          sourceContent={inputText}
          isOpenDefault={Boolean(summary && !isStreaming)}
        />
      )}

      {/* Smart Content-Aware PDF Exporter Modal */}
      <SmartPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        title={extractedMeta?.title || 'Executive Summary & Intelligence Briefing'}
        content={summary}
        meta={{
          type: 'summary',
          sourceUrl: sourceUrl || undefined,
          reduction: `${actualPercentSaved}% reduction`,
        }}
      />
    </div>
  )
}

export default SummarizeArticle
