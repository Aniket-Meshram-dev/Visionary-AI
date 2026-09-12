import React, { useState, useRef } from 'react'
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  ExternalLink,
  Clipboard,
  Check,
  Globe,
  Lock,
  RefreshCw,
  UploadCloud,
  X,
  Layers,
  Wand2,
  Shuffle,
  Film,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import VoiceInputButton from '../components/VoiceInputButton'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const imageStyles = [
  { name: 'Photorealistic', desc: 'Ultra-real 8k detail' },
  { name: '3D Render', desc: 'Octane / Cinema4D style' },
  { name: 'Anime Studio', desc: 'Vibrant Japanese animation' },
  { name: 'Ghibli Style', desc: 'Whimsical painted aesthetics' },
  { name: 'Cyberpunk Neon', desc: 'Dark future & glowing colors' },
  { name: 'Fantasy Concept', desc: 'Epic mythical landscapes' },
  { name: 'Cinematic Film', desc: '35mm film grain & lighting' },
  { name: 'Minimalist Vector', desc: 'Clean geometric shapes' },
]

const aspectRatios = [
  { id: '1:1', name: 'Square 1:1', dim: '1024×1024' },
  { id: '16:9', name: 'Landscape 16:9', dim: '1280×720' },
  { id: '9:16', name: 'Portrait 9:16', dim: '720×1280' },
]

const samplePrompts = [
  'Futuristic cyberpunk city at night with flying cars and holographic neon signs',
  'Surreal floating island with crystal waterfalls and blooming cherry blossoms',
  'Cute 3D Pixar-style baby dragon reading an ancient book',
  'Hyper-detailed cosmic astronaut looking at a kaleidoscope galaxy',
]

const GenerateImages = () => {
  const [input, setInput] = useState('')
  const [selectedStyle, setSelectedStyle] = useState(imageStyles[0])
  const [selectedRatio, setSelectedRatio] = useState(aspectRatios[0])
  const [publish, setPublish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)

  // Feature 1: Reference Photo (Image-to-Image / Remix)
  const [referenceFile, setReferenceFile] = useState(null)
  const [referencePreview, setReferencePreview] = useState(null)
  const [isTransformed, setIsTransformed] = useState(false)
  const fileInputRef = useRef(null)

  // Feature 2: AI Prompt Magic Co-Pilot
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Feature 3: 1-Click Remix & Variations
  const [isRemixing, setIsRemixing] = useState(false)

  // Feature 4: Live Session Filmstrip History
  const [sessionHistory, setSessionHistory] = useState([])

  const { getToken, user } = useAuth()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image (JPG, PNG, WebP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB')
      return
    }
    setReferenceFile(file)
    const reader = new FileReader()
    reader.onload = () => setReferencePreview(reader.result)
    reader.readAsDataURL(file)
    toast.success('Photo attached! Describe the changes or style you want.')
  }

  const handleRemoveReference = () => {
    setReferenceFile(null)
    setReferencePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 🪄 AI Prompt Magic: Enhance short prompt with cinematic lighting, camera lens & textures
  const handleEnhancePrompt = async () => {
    if (!input.trim()) {
      toast.error('Please enter a prompt idea first')
      return
    }
    try {
      setIsEnhancing(true)
      const token = await getToken()
      const { data } = await axios.post(
        '/api/ai/enhance-image-prompt',
        { prompt: input, style: selectedStyle.name },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (data.success && data.enhancedPrompt) {
        setInput(data.enhancedPrompt)
        toast.success('Prompt enhanced with cinematic detail!')
      } else {
        toast.error(data.message || 'Could not enhance prompt')
      }
    } catch (err) {
      toast.error('Enhancement error: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsEnhancing(false)
    }
  }

  // Submit Generation (Text-to-Image OR Image-to-Image)
  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input.trim()) {
      toast.error('Please describe your image')
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('prompt', input)
      formData.append('style', selectedStyle.name)
      formData.append('aspectRatio', selectedRatio.id)
      formData.append('publish', publish)
      if (referenceFile) {
        formData.append('image', referenceFile)
      }

      const { data } = await axios.post(
        '/api/ai/generate-image',
        formData,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (data.success) {
        setContent(data.content)
        setIsTransformed(Boolean(data.isTransformed))

        // Record in Live Session Filmstrip
        const newEntry = {
          id: Date.now(),
          url: data.content,
          prompt: input,
          style: selectedStyle.name,
          ratio: selectedRatio.name,
          isTransformed: Boolean(data.isTransformed),
        }
        setSessionHistory((prev) => [newEntry, ...prev.filter((i) => i.url !== data.content)])

        toast.success(
          data.isTransformed
            ? 'Photo transformed successfully!'
            : 'Image rendered successfully!'
        )
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Image generation failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Generation error')
    }
    setLoading(false)
  }

  // 🔄 1-Click Variations / Remix Mode
  const handleRemixVariation = async () => {
    if (!content || loading || isRemixing) return
    setIsRemixing(true)
    try {
      const formData = new FormData()
      formData.append('prompt', `${input}, alternative variation, different perspective`)
      formData.append('style', selectedStyle.name)
      formData.append('aspectRatio', selectedRatio.id)
      formData.append('publish', publish)
      if (referenceFile) {
        formData.append('image', referenceFile)
      }

      const { data } = await axios.post('/api/ai/generate-image', formData, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      if (data.success) {
        setContent(data.content)
        setIsTransformed(Boolean(data.isTransformed))

        const newEntry = {
          id: Date.now(),
          url: data.content,
          prompt: input,
          style: selectedStyle.name,
          ratio: selectedRatio.name,
          isTransformed: Boolean(data.isTransformed),
        }
        setSessionHistory((prev) => [newEntry, ...prev.filter((i) => i.url !== data.content)])
        toast.success('New remix variation generated!')
      } else {
        toast.error(data.message || 'Remix failed')
      }
    } catch (err) {
      toast.error('Remix error: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsRemixing(false)
    }
  }

  const handleDownload = async () => {
    if (!content) return
    try {
      const response = await fetch(content, { mode: 'cors' })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const safeName =
        input
          .replace(/[^a-z0-9]/gi, '-')
          .trim()
          .toLowerCase()
          .substring(0, 40) || 'visionary-render'

      const a = document.createElement('a')
      a.href = url
      a.download = `${safeName}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Image download started!')
    } catch (err) {
      toast.error('Failed to download image')
    }
  }

  const handleCopyPrompt = () => {
    if (!input) return
    navigator.clipboard.writeText(input).then(() => {
      setCopied(true)
      toast.success('Prompt copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase'>
          <ImageIcon className='w-4 h-4' /> AI Image Canvas • FLUX.1 & Z-Image-Turbo Engine
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Text-to-Image & Photo Remix Studio
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Generate photorealistic 4K art from scratch or upload your photo to remix and transform with AI guidance.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Form */}
        <form
          onSubmit={onSubmitHandler}
          className='lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5'
        >
          {/* Optional Reference Image Upload Box */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-slate-800 flex items-center gap-1.5'>
                <UploadCloud className='w-3.5 h-3.5 text-emerald-600' />
                <span>Reference Photo</span>
                <span className='text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded'>Optional</span>
              </label>
              {referencePreview && (
                <button
                  type='button'
                  onClick={handleRemoveReference}
                  className='text-[11px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer'
                >
                  <X className='w-3 h-3' /> Remove Photo
                </button>
              )}
            </div>

            <input
              type='file'
              ref={fileInputRef}
              onChange={handleFileChange}
              accept='image/png,image/jpeg,image/webp,image/jpg'
              className='hidden'
            />

            {!referencePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className='border-2 border-dashed border-slate-200 hover:border-emerald-500/60 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/20 flex items-center justify-center gap-2.5 text-slate-500 hover:text-emerald-700'
              >
                <UploadCloud className='w-4 h-4 text-emerald-600 shrink-0' />
                <span className='text-xs font-medium'>
                  Upload photo to remix & transform (or leave empty for text-to-image)
                </span>
              </div>
            ) : (
              <div className='relative flex items-center gap-3 p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl'>
                <img
                  src={referencePreview}
                  alt='Reference upload preview'
                  className='w-14 h-14 rounded-lg object-cover border border-emerald-300 shadow-xs shrink-0'
                />
                <div className='flex-1 min-w-0 text-xs'>
                  <p className='font-semibold text-emerald-900 truncate'>{referenceFile?.name}</p>
                  <p className='text-[11px] text-emerald-700 mt-0.5'>
                    {(referenceFile.size / (1024 * 1024)).toFixed(2)} MB • AI will apply your prompt to this photo
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Prompt + AI Magic Co-Pilot */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <label className='text-xs font-semibold text-slate-800' htmlFor='imagePrompt'>
                {referencePreview ? 'Describe Desired Changes' : 'Describe Your Vision'}
              </label>

              <div className='flex items-center gap-2'>
                {/* 🪄 AI Prompt Magic Button */}
                <button
                  type='button'
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !input.trim()}
                  className='text-[11px] font-semibold px-2 py-0.5 rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1 cursor-pointer disabled:opacity-50'
                  title='AI Prompt Magic: Expands prompt with cinematic lighting, camera lens and textures'
                >
                  <Wand2 className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
                  <span>{isEnhancing ? 'Enhancing...' : '✨ Magic Enhance'}</span>
                </button>

                <VoiceInputButton
                  onTranscript={(voiceText) =>
                    setInput((prev) => (prev ? `${prev} ${voiceText}` : voiceText))
                  }
                />
              </div>
            </div>

            <textarea
              id='imagePrompt'
              rows={referencePreview ? 3 : 4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                referencePreview
                  ? 'E.g., "Transform into anime cyberpunk warrior with neon katana", "Change background to Paris at sunset"...'
                  : 'Describe scene, lighting, mood, colors, camera perspective...'
              }
              className='w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition resize-none leading-relaxed'
              required
            />
          </div>

          {/* Quick inspiration chips */}
          <div className='space-y-1.5'>
            <p className='text-[11px] font-medium text-slate-400'>Prompt ideas:</p>
            <div className='flex flex-wrap gap-1.5'>
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  type='button'
                  onClick={() => setInput(p)}
                  className='text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-md transition text-left cursor-pointer'
                >
                  {p.slice(0, 38)}...
                </button>
              ))}
            </div>
          </div>

          {/* Visual Style Selection */}
          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-800'>Aesthetic Preset</label>
            <div className='grid grid-cols-2 gap-2'>
              {imageStyles.map((style) => {
                const isSelected = selectedStyle.name === style.name
                return (
                  <button
                    key={style.name}
                    type='button'
                    onClick={() => setSelectedStyle(style)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? 'text-emerald-800' : 'text-slate-700'
                      }`}
                    >
                      {style.name}
                    </p>
                    <p className='text-[10px] text-slate-500 mt-0.5'>{style.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Canvas Aspect Ratio */}
          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-800'>Canvas Ratio</label>
            <div className='grid grid-cols-3 gap-2'>
              {aspectRatios.map((ratio) => {
                const isSelected = selectedRatio.id === ratio.id
                return (
                  <button
                    key={ratio.id}
                    type='button'
                    onClick={() => setSelectedRatio(ratio)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? 'text-emerald-800' : 'text-slate-700'
                      }`}
                    >
                      {ratio.name}
                    </p>
                    <p className='text-[10px] text-slate-500 mt-0.5'>{ratio.dim}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Public Sharing Toggle */}
          <div className='p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  publish ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {publish ? <Globe className='w-4 h-4' /> : <Lock className='w-4 h-4' />}
              </div>
              <div>
                <p className='text-xs font-semibold text-slate-800'>Publish to Community Feed</p>
                <p className='text-[10px] text-slate-500'>
                  {publish ? 'Visible to other creators' : 'Only visible in your dashboard'}
                </p>
              </div>
            </div>

            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
                className='sr-only peer'
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
          >
            {loading ? (
              <>
                <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                <span>
                  {referencePreview
                    ? 'Transforming photo with AI...'
                    : 'Synthesizing via FLUX.1...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className='w-4 h-4' />
                <span>
                  {referencePreview
                    ? `Transform Photo (${selectedStyle.name})`
                    : `Generate ${selectedStyle.name} Image`}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Image Canvas Viewer + Session Filmstrip */}
        <div className='lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[520px] max-h-[780px] overflow-hidden'>
          {/* Header Bar */}
          <div className='p-4 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50'>
            <div className='flex items-center gap-2 min-w-0'>
              <ImageIcon className='w-4 h-4 text-emerald-600 shrink-0' />
              <h2 className='text-xs sm:text-sm font-semibold text-slate-800 truncate'>
                Rendered Canvas
              </h2>
            </div>

            {content && (
              <div className='flex items-center gap-2'>
                {/* 🔄 1-Click Variations / Remix Button */}
                <button
                  type='button'
                  onClick={handleRemixVariation}
                  disabled={loading || isRemixing}
                  title='Generate a creative remix variation'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50'
                >
                  <Shuffle className={`w-3.5 h-3.5 ${isRemixing ? 'animate-spin' : ''}`} />
                  <span className='hidden sm:inline'>{isRemixing ? 'Remixing...' : 'Remix Variation'}</span>
                </button>

                <a
                  href={content}
                  target='_blank'
                  rel='noreferrer'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer'
                >
                  <ExternalLink className='w-3.5 h-3.5' />
                  <span className='hidden sm:inline'>Open High-Res</span>
                </a>

                <button
                  onClick={handleDownload}
                  title='Download image'
                  className='p-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs'
                >
                  <Download className='w-3.5 h-3.5' />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>

          {/* Main Canvas Body */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/2'>
            {loading ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-7 h-7' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  {referencePreview ? 'Remixing & Transforming photo...' : `Synthesizing pixels in ${selectedStyle.name}...`}
                </h3>
                <p className='text-xs text-slate-500'>
                  Simulating volumetric lighting, color harmony, and fine textures.
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
                  <ImageIcon className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                    Empty canvas
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                    Enter a creative description or upload a photo on the left to render your image.
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-4 w-full max-w-lg'>
                <div className='relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md'>
                  <img
                    src={content}
                    alt={input}
                    className='w-full h-auto object-contain max-h-[440px] mx-auto rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4'>
                    <p className='text-xs text-white line-clamp-2 font-medium'>{input}</p>
                  </div>
                </div>

                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600'>
                  <div className='flex items-center gap-2'>
                    {isTransformed && (
                      <span className='px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-medium text-[11px] flex items-center gap-1'>
                        <Layers className='w-3 h-3' /> Photo Remix
                      </span>
                    )}
                    <span className='px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium text-[11px]'>
                      {selectedStyle.name}
                    </span>
                    <span className='px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-medium text-[11px]'>
                      {selectedRatio.name}
                    </span>
                    {publish && (
                      <span className='px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-medium text-[11px]'>
                        Public
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleDownload}
                    className='text-emerald-600 hover:text-emerald-700 font-semibold text-xs flex items-center gap-1 cursor-pointer'
                  >
                    <Download className='w-3.5 h-3.5' /> Save to device
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 🎞️ Live Session Filmstrip Gallery */}
          {sessionHistory.length > 0 && (
            <div className='p-3 sm:p-4 bg-slate-50/90 border-t border-slate-200/80'>
              <div className='flex items-center justify-between mb-2 text-xs'>
                <span className='font-semibold text-slate-700 flex items-center gap-1.5'>
                  <Film className='w-3.5 h-3.5 text-emerald-600' />
                  <span>Session Creations ({sessionHistory.length})</span>
                </span>
                <span className='text-[10px] text-slate-400'>Click any render to view & download</span>
              </div>
              <div className='flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin'>
                {sessionHistory.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => {
                      setContent(item.url)
                      setInput(item.prompt)
                      setIsTransformed(item.isTransformed)
                    }}
                    className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer group ${
                      content === item.url ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={item.url} alt={item.prompt} className='w-full h-full object-cover group-hover:scale-105 transition duration-200' />
                    {item.isTransformed && (
                      <span className='absolute bottom-1 right-1 bg-purple-900/80 text-[8px] text-purple-200 px-1 py-0.2 rounded font-bold backdrop-blur-xs'>
                        Remix
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerateImages
