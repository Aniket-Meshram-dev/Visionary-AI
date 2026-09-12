import React, { useState, useRef, useEffect } from 'react'
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
  Square,
  Wand2,
  Share2,
  Image as ImageIcon,
  ListOrdered,
  Gauge,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Zap,
  FileDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { streamAiCompletion } from '../services/streamService'
import VoiceInputButton from '../components/VoiceInputButton'
import ArticleOutlineBuilder from '../components/ArticleOutlineBuilder'
import ContentRepurposerModal from '../components/ContentRepurposerModal'
import InlineCopilotToolbar from '../components/InlineCopilotToolbar'
import SeoHealthWidget from '../components/SeoHealthWidget'
import SmartPdfExportModal from '../components/SmartPdfExportModal'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

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

export const coverImageStyles = [
  { name: 'Cinematic Film', desc: '35mm film grain & lighting' },
  { name: 'Photorealistic', desc: 'Ultra-real 8k photography' },
  { name: '3D Render', desc: 'Octane / Pixar 3D style' },
  { name: 'Cyberpunk Neon', desc: 'Dark future & neon glow' },
  { name: 'Minimalist Vector', desc: 'Clean geometric editorial' },
  { name: 'Anime Studio', desc: 'Vibrant modern animation' },
  { name: 'Fantasy Concept', desc: 'Epic mythical landscapes' },
  { name: 'Ghibli Style', desc: 'Painted watercolor aesthetic' },
]

const samplePrompts = [
  'The Rise of Autonomous AI Agents in 2026',
  'Next.js 15 Full-Stack Best Practices',
  'Designing High-Conversion SaaS Onboarding',
]

const WriteArticle = () => {
  // Workflow Mode: 'agentic' (3-Stage Pipeline) vs 'direct' (One-Click Direct Stream)
  const [pipelineMode, setPipelineMode] = useState('agentic')
  const [currentStage, setCurrentStage] = useState(1) // 1: Outline | 2: Drafting | 3: Finished & Cover Art

  // Input States
  const [selectedLength, setSelectedLength] = useState(articleLengths[1])
  const [selectedTone, setSelectedTone] = useState(toneOptions[0])
  const [selectedCoverStyle, setSelectedCoverStyle] = useState(coverImageStyles[0])
  const [input, setInput] = useState(() => new URLSearchParams(window.location.search).get('prompt') || '')

  // Generation & Streaming States
  const [loadingOutline, setLoadingOutline] = useState(false)
  const [outlineData, setOutlineData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)

  // Stage 3: Cover Image states
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [generatingCover, setGeneratingCover] = useState(false)

  // Feature 2: Content Repurposer states
  const [repurposerModalOpen, setRepurposerModalOpen] = useState(false)
  const [repurposedData, setRepurposedData] = useState(null)
  const [repurposingLoading, setRepurposingLoading] = useState(false)

  // Feature 5: Smart Content-Aware PDF Exporter
  const [showPdfModal, setShowPdfModal] = useState(false)

  // Feature 4: Inline Copilot states
  const [selectionInfo, setSelectionInfo] = useState(null)
  const articleContentRef = useRef(null)

  const abortControllerRef = useRef(null)
  const { getToken, user } = useAuth()

  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Stop streaming
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      setLoading(false)
      toast.success('Generation stopped. Content preserved.')
    }
  }

  // --- STAGE 1: Generate Outline ---
  const handleGenerateOutline = async () => {
    if (!input.trim()) {
      toast.error('Please specify an article topic')
      return
    }

    try {
      setLoadingOutline(true)
      setOutlineData(null)
      setContent('')
      setCoverImageUrl('')
      setRepurposedData(null)

      const token = await getToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.post(
        '/api/ai/generate-outline',
        {
          topic: input,
          tone: selectedTone,
          length: selectedLength.length,
        },
        { headers }
      )

      if (response.data?.success && response.data?.sections) {
        setOutlineData(response.data)
        setCurrentStage(1)
        toast.success('Outline architected! Review & customize below.')
      } else {
        toast.error(response.data?.message || 'Failed to generate outline')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error generating outline')
    } finally {
      setLoadingOutline(false)
    }
  }

  // --- STAGE 2: Draft full article based on approved outline or direct prompt ---
  const handleStartDrafting = async (approvedOutline = null) => {
    try {
      setLoading(true)
      setIsStreaming(true)
      setContent('')
      setCurrentStage(2)

      const controller = new AbortController()
      abortControllerRef.current = controller

      const topicTitle = approvedOutline?.title || input
      const prompt = `Write a ${selectedTone.toLowerCase()} article about: "${topicTitle}". Length target: ${
        selectedLength.words
      }. Include a captivating headline, structured subheadings, clear takeaways, and conclusion.`

      const token = await getToken()

      await streamAiCompletion({
        endpoint: '/api/ai/stream-article',
        body: {
          prompt,
          length: selectedLength.length,
          outline: approvedOutline?.sections || null,
        },
        token,
        signal: controller.signal,
        onChunk: (chunk, accumulated) => {
          setContent(accumulated)
          setLoading(false)
        },
        onComplete: () => {
          setIsStreaming(false)
          setLoading(false)
          abortControllerRef.current = null
          setCurrentStage(3)
          toast.success('Article completed! Generating cover art...')
          if (user?.reload) user.reload()
          // Automatically trigger Stage 3: Cover art generation
          handleAutoGenerateCover(topicTitle)
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
        toast.error(error.message || 'Generation error')
      }
      setIsStreaming(false)
      setLoading(false)
    }
  }

  // Unified Form Submit Handler
  const onSubmitHandler = (e) => {
    if (e) e.preventDefault()
    if (pipelineMode === 'agentic') {
      handleGenerateOutline()
    } else {
      handleStartDrafting()
    }
  }

  // --- STAGE 3: Auto Cover Banner Generator ---
  const handleAutoGenerateCover = async (headline, styleOverride = null) => {
    const styleToUse = styleOverride || selectedCoverStyle.name
    try {
      setGeneratingCover(true)
      const token = await getToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.post(
        '/api/ai/generate-article-cover',
        {
          title: headline || outlineData?.title || input,
          topic: input,
          style: styleToUse,
        },
        { headers }
      )

      if (response.data?.success && response.data?.imageUrl) {
        setCoverImageUrl(response.data.imageUrl)
        toast.success(`Featured ${styleToUse} 16:9 banner created via Cloudinary!`)
      } else {
        toast.error('Could not generate cover image')
      }
    } catch (err) {
      console.warn('Cover generation notice:', err.message)
      toast.error('Cover generation error')
    } finally {
      setGeneratingCover(false)
    }
  }

  // --- FEATURE 2: 1-Click Content Repurposer ---
  const handleOpenRepurposer = async (forceRefresh = false) => {
    setRepurposerModalOpen(true)
    if (repurposedData && !forceRefresh) return

    try {
      setRepurposingLoading(true)
      const token = await getToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.post(
        '/api/ai/repurpose-article',
        {
          content,
          title: outlineData?.title || input,
        },
        { headers }
      )

      if (response.data?.success && response.data?.repurposed) {
        setRepurposedData(response.data.repurposed)
        toast.success('Twitter, LinkedIn & Newsletter formats ready!')
      } else {
        toast.error(response.data?.message || 'Repurposing failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Repurposing error')
    } finally {
      setRepurposingLoading(false)
    }
  }

  // --- FEATURE 4: Inline Text Selection Listener ---
  const handleMouseUp = () => {
    if (isStreaming) return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectionInfo(null)
      return
    }

    const selectedStr = selection.toString().trim()
    if (selectedStr.length < 5 || selectedStr.length > 500) {
      setSelectionInfo(null)
      return
    }

    try {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setSelectionInfo({
        text: selectedStr,
        position: {
          top: rect.top,
          left: rect.left + rect.width / 2,
        },
      })
    } catch {
      setSelectionInfo(null)
    }
  }

  // In-place text replacement from Inline Copilot
  const handleReplaceSelectedText = (originalText, newText) => {
    setContent((prev) => prev.replace(originalText, newText))
  }

  // In-place Refinement toolbar
  const handleRefine = async (actionText) => {
    if (!content || isStreaming) return
    const refinedPrompt = `Here is an article I drafted:\n\n${content}\n\nTask: ${actionText}. Maintain markdown formatting.`
    try {
      setLoading(true)
      setIsStreaming(true)

      const controller = new AbortController()
      abortControllerRef.current = controller
      const token = await getToken()

      await streamAiCompletion({
        endpoint: '/api/ai/stream-article',
        body: { prompt: refinedPrompt, length: selectedLength.length },
        token,
        signal: controller.signal,
        onChunk: (chunk, accumulated) => {
          setContent(accumulated)
          setLoading(false)
        },
        onComplete: () => {
          setIsStreaming(false)
          setLoading(false)
          abortControllerRef.current = null
          toast.success('Article updated!')
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
    let finalExport = content
    if (coverImageUrl) {
      finalExport = `![Featured Cover Banner](${coverImageUrl})\n\n${finalExport}`
    }
    const blob = new Blob([finalExport], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${input.slice(0, 30).trim().replace(/\s+/g, '-') || 'article'}.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown with cover banner downloaded')
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title & Pipeline Badge */}
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase'>
            <SquarePen className='w-4 h-4' /> AI Writer Studio & Creation Pipeline
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
            Autonomous Article Engine
          </h1>
          <p className='text-xs sm:text-sm text-slate-500 mt-1'>
            3-Stage Agentic Workflow: Outline Architect ➔ Section-by-Section Draft ➔ Auto Cover Art & Social Repurposing.
          </p>
        </div>

        {/* Workflow Mode Switcher */}
        <div className='bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80 text-xs font-semibold'>
          <button
            type='button'
            onClick={() => setPipelineMode('agentic')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              pipelineMode === 'agentic'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className='w-3.5 h-3.5 text-blue-600' />
            <span>3-Stage Agentic Mode</span>
          </button>

          <button
            type='button'
            onClick={() => setPipelineMode('direct')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              pipelineMode === 'direct'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className='w-3.5 h-3.5 text-amber-500' />
            <span>Direct Stream Mode</span>
          </button>
        </div>
      </div>

      {/* Stage Progress Indicator (when Agentic mode active) */}
      {pipelineMode === 'agentic' && (
        <div className='mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-3 gap-2 text-center text-xs'>
          <div
            className={`p-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition ${
              currentStage === 1
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : currentStage > 1
                ? 'text-emerald-700 bg-emerald-50/60'
                : 'text-slate-400'
            }`}
          >
            <span className='w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-white border border-current font-bold'>
              1
            </span>
            <span>Outline Architect</span>
          </div>

          <div
            className={`p-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition ${
              currentStage === 2
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : currentStage > 2
                ? 'text-emerald-700 bg-emerald-50/60'
                : 'text-slate-400'
            }`}
          >
            <span className='w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-white border border-current font-bold'>
              2
            </span>
            <span>Section-by-Section Draft</span>
          </div>

          <div
            className={`p-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition ${
              currentStage === 3
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-400'
            }`}
          >
            <span className='w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-white border border-current font-bold'>
              3
            </span>
            <span>Cover Art & Repurpose</span>
          </div>
        </div>
      )}

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
              <div className='flex items-center gap-1.5'>
                <label className='text-xs font-semibold text-slate-800' htmlFor='topic'>
                  Article Topic or Headline
                </label>
                <VoiceInputButton
                  onTranscript={(voiceText) =>
                    setInput((prev) => (prev ? `${prev} ${voiceText}` : voiceText))
                  }
                />
              </div>
              <span className='text-[10px] text-slate-400'>{input.length}/250</span>
            </div>
            <textarea
              id='topic'
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g., Why Autonomous AI Agents are replacing simple prompt wrappers in 2026...'
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

          {/* Cover Banner Aesthetic (Matches GenerateImages) */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-slate-800 flex items-center gap-1.5'>
                <ImageIcon className='w-3.5 h-3.5 text-blue-600' />
                Cover Banner Aesthetic
              </label>
              <span className='text-[10px] text-slate-400 font-medium'>16:9 Ultra-HD</span>
            </div>
            <div className='grid grid-cols-2 gap-1.5'>
              {coverImageStyles.map((styleItem) => {
                const isSelected = selectedCoverStyle.name === styleItem.name
                return (
                  <button
                    key={styleItem.name}
                    type='button'
                    onClick={() => setSelectedCoverStyle(styleItem)}
                    className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <p
                      className={`text-[11px] font-bold truncate ${
                        isSelected ? 'text-blue-700' : 'text-slate-800'
                      }`}
                    >
                      {styleItem.name}
                    </p>
                    <p className='text-[9px] text-slate-400 truncate'>{styleItem.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit / Action Button */}
          {isStreaming ? (
            <button
              type='button'
              onClick={handleStopGeneration}
              className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer'
            >
              <Square className='w-3.5 h-3.5 fill-white' />
              <span>Stop Streaming</span>
            </button>
          ) : pipelineMode === 'agentic' ? (
            <button
              type='submit'
              disabled={loadingOutline || loading}
              className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:opacity-95 shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
            >
              {loadingOutline ? (
                <>
                  <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                  <span>Designing Outline Blueprint...</span>
                </>
              ) : (
                <>
                  <ListOrdered className='w-4 h-4' />
                  <span>Stage 1: Generate Outline Blueprint</span>
                </>
              )}
            </button>
          ) : (
            <button
              type='submit'
              disabled={loading}
              className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:opacity-95 shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
            >
              {loading ? (
                <>
                  <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                  <span>Connecting to AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className='w-4 h-4' />
                  <span>Direct Write Article</span>
                </>
              )}
            </button>
          )}
        </form>

        {/* Right Column: Output Viewer / Outline Builder / Post-Gen Tools */}
        <div className='lg:col-span-7 space-y-4'>
          {/* Stage 1: Outline Builder (When outline data present and not yet drafting) */}
          {pipelineMode === 'agentic' && outlineData && !content && !loading && (
            <ArticleOutlineBuilder
              outlineData={outlineData}
              onApprove={(approvedOutline) => handleStartDrafting(approvedOutline)}
              onRegenerate={handleGenerateOutline}
              isLoadingDraft={loading}
            />
          )}

          {/* Article Viewer Container */}
          {(!outlineData || content || loading || pipelineMode === 'direct') && (
            <div className='bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[520px] max-h-[750px] overflow-hidden'>
              {/* Header Bar */}
              <div className='p-4 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50'>
                <div className='flex items-center gap-2 min-w-0'>
                  <BookOpen className='w-4 h-4 text-blue-600 shrink-0' />
                  <h2 className='text-xs sm:text-sm font-semibold text-slate-800 truncate'>
                    {outlineData?.title || 'Generated Article'}
                  </h2>
                </div>

                <div className='flex items-center gap-2'>
                  {isStreaming && (
                    <div className='flex items-center gap-2'>
                      <span className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-medium'>
                        <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping' />
                        Live Stream
                      </span>
                      <button
                        type='button'
                        onClick={handleStopGeneration}
                        className='p-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer'
                      >
                        <Square className='w-3 h-3 fill-rose-600' />
                        <span>Stop</span>
                      </button>
                    </div>
                  )}

                  {content && (
                    <>
                      {/* Smart PDF Export Button */}
                      <button
                        type='button'
                        onClick={() => setShowPdfModal(true)}
                        title='Extract as Intelligent High-DPI PDF'
                        className='px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 shadow-xs transition flex items-center gap-1.5 cursor-pointer'
                      >
                        <FileDown className='w-3.5 h-3.5' />
                        <span className='hidden sm:inline'>Extract PDF</span>
                      </button>

                      {/* Repurpose Button */}
                      <button
                        type='button'
                        onClick={handleOpenRepurposer}
                        title='Repurpose into Twitter, LinkedIn & Newsletter'
                        className='px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-xs transition flex items-center gap-1.5 cursor-pointer'
                      >
                        <Share2 className='w-3.5 h-3.5' />
                        <span className='hidden sm:inline'>Repurpose</span>
                      </button>

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
                    </>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div
                ref={articleContentRef}
                onMouseUp={handleMouseUp}
                className='flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 relative'
              >
                {loading && !content ? (
                  <div className='space-y-4 py-12 max-w-lg mx-auto text-center'>
                    <div className='w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-bounce'>
                      <Sparkles className='w-6 h-6' />
                    </div>
                    <h3 className='text-sm font-semibold text-slate-800'>
                      Visionary AI is orchestrating your draft...
                    </h3>
                    <p className='text-xs text-slate-500'>
                      Streaming comprehensive sections with low latency.
                    </p>
                    <div className='space-y-2 pt-4'>
                      <div className='h-3 bg-slate-100 rounded-full animate-pulse w-3/4 mx-auto' />
                      <div className='h-3 bg-slate-100 rounded-full animate-pulse w-5/6 mx-auto' />
                      <div className='h-3 bg-slate-100 rounded-full animate-pulse w-2/3 mx-auto' />
                    </div>
                  </div>
                ) : !content ? (
                  <div className='h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 space-y-3'>
                    <div className='w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400'>
                      <SquarePen className='w-7 h-7' />
                    </div>
                    <div className='max-w-xs'>
                      <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                        Ready to orchestrate your next article
                      </h3>
                      <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                        Enter your topic on the left and click "Stage 1: Generate Outline".
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-6'>
                    {/* Stage 3: Cover Banner Display (Generated via FLUX/Cloudinary Pipeline) */}
                    {coverImageUrl && (
                      <div className='rounded-2xl overflow-hidden border border-slate-200 shadow-md relative group bg-slate-950'>
                        <img
                          src={coverImageUrl}
                          alt='Featured Editorial Cover Banner'
                          className='w-full h-48 sm:h-64 object-cover'
                        />
                        {/* Style & CDN Tag */}
                        <div className='absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10 shadow-xs'>
                          <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                          <span>16:9 Ultra-HD • Cloudinary CDN • {selectedCoverStyle.name}</span>
                        </div>

                        {/* Banner Quick Actions */}
                        <div className='absolute bottom-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition'>
                          <button
                            type='button'
                            onClick={() => handleAutoGenerateCover(outlineData?.title || input)}
                            disabled={generatingCover}
                            className='px-2.5 py-1 text-[11px] font-semibold bg-slate-900/80 text-white rounded-lg hover:bg-black transition flex items-center gap-1 backdrop-blur-xs cursor-pointer disabled:opacity-50'
                            title='Regenerate cover with current aesthetic'
                          >
                            <RotateCcw className={`w-3 h-3 ${generatingCover ? 'animate-spin' : ''}`} />
                            <span>{generatingCover ? 'Regenerating...' : 'Regenerate'}</span>
                          </button>

                          <a
                            href={coverImageUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='px-2.5 py-1 text-[11px] font-semibold bg-slate-900/80 text-white rounded-lg hover:bg-black transition flex items-center gap-1 backdrop-blur-xs'
                            title='Open full resolution image'
                          >
                            <ExternalLink className='w-3 h-3' />
                            <span>View HD</span>
                          </a>

                          <button
                            type='button'
                            onClick={() => {
                              navigator.clipboard.writeText(`![Cover Banner](${coverImageUrl})`)
                              toast.success('Cover Markdown embed code copied!')
                            }}
                            className='px-2.5 py-1 text-[11px] font-semibold bg-blue-600/90 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1 backdrop-blur-xs cursor-pointer'
                            title='Copy Markdown tag'
                          >
                            <Clipboard className='w-3 h-3' />
                            <span>Copy Tag</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Article Markdown Renderer */}
                    <div className='relative'>
                      <MarkdownRenderer content={content} />
                      {isStreaming && (
                        <div className='flex items-center gap-2 mt-4 text-xs font-mono text-blue-600 animate-pulse'>
                          <span className='w-2 h-4 bg-blue-600 inline-block rounded-xs' />
                          <span>Streaming tokens in real-time...</span>
                        </div>
                      )}
                    </div>

                    {/* Quick AI Refine Toolbar */}
                    {!isStreaming && content && (
                      <div className='pt-6 border-t border-slate-100'>
                        <div className='flex items-center justify-between mb-2.5'>
                          <div className='flex items-center gap-1.5 text-xs font-semibold text-slate-700'>
                            <Wand2 className='w-3.5 h-3.5 text-blue-600' />
                            <span>Refine Full Article:</span>
                          </div>

                          {!coverImageUrl && (
                            <button
                              type='button'
                              onClick={() => handleAutoGenerateCover(outlineData?.title || input)}
                              disabled={generatingCover}
                              className='text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50'
                            >
                              <ImageIcon className='w-3.5 h-3.5' />
                              <span>
                                {generatingCover
                                  ? 'Generating Cloudinary Banner...'
                                  : `Generate ${selectedCoverStyle.name} Cover`}
                              </span>
                            </button>
                          )}
                        </div>

                        <div className='flex flex-wrap gap-2'>
                          {[
                            {
                              label: '✨ Make it punchier',
                              action: 'Make this article punchier, more concise, and cut any fluff',
                            },
                            {
                              label: '📊 Add actionable takeaways',
                              action: 'Add a bulleted summary of key actionable takeaways and insights at the end',
                            },
                            {
                              label: '🔍 Optimize for SEO',
                              action: 'Enhance SEO headings, keyword density, and compelling subheaders',
                            },
                            {
                              label: '📝 Polish executive tone',
                              action: 'Proofread and polish tone to sound highly authoritative and executive',
                            },
                          ].map((refineItem) => (
                            <button
                              key={refineItem.label}
                              type='button'
                              onClick={() => handleRefine(refineItem.action)}
                              className='text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-slate-600 transition cursor-pointer font-medium'
                            >
                              {refineItem.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feature 3: Live SEO & Readability Health Score Widget */}
          {content && <SeoHealthWidget content={content} />}
        </div>
      </div>

      {/* Feature 4: Interactive Inline AI Copilot Toolbar */}
      <InlineCopilotToolbar
        selectionInfo={selectionInfo}
        onReplaceText={handleReplaceSelectedText}
        onClose={() => setSelectionInfo(null)}
        getToken={getToken}
      />

      {/* Feature 2: Omni-Channel Content Repurposer Modal */}
      <ContentRepurposerModal
        isOpen={repurposerModalOpen}
        onClose={() => setRepurposerModalOpen(false)}
        repurposedData={repurposedData}
        isLoading={repurposingLoading}
        onRegenerate={() => handleOpenRepurposer(true)}
      />

      {/* Feature 5: Smart Content-Aware PDF Exporter Modal */}
      <SmartPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        title={outlineData?.title || input || 'Editorial Article Publication'}
        content={content}
        coverImageUrl={coverImageUrl}
        meta={{
          type: 'article',
          tone: selectedTone,
          length: selectedLength?.label,
        }}
      />
    </div>
  )
}

export default WriteArticle
