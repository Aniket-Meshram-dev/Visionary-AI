import React, { useState } from 'react'
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  ExternalLink,
  Clipboard,
  Check,
  Globe,
  Lock,
  Maximize2,
  RefreshCw,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

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

const samplePrompts = [
  'Futuristic cyberpunk city at night with flying cars and holographic neon signs',
  'Surreal floating island with crystal waterfalls and blooming cherry blossoms',
  'Cute 3D Pixar-style baby dragon reading an ancient book',
  'Hyper-detailed cosmic astronaut looking at a kaleidoscope galaxy',
]

const GenerateImages = () => {
  const [selectedStyle, setSelectedStyle] = useState(imageStyles[0])
  const [input, setInput] = useState('')
  const [publish, setPublish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)

  const { getToken, user } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input.trim()) {
      toast.error('Please describe your image')
      return
    }

    try {
      setLoading(true)
      const prompt = `Generate an image of ${input} in ${selectedStyle.name} style`

      const { data } = await axios.post(
        '/api/ai/generate-image',
        { prompt, publish },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        setContent(data.content)
        toast.success('Image rendered successfully!')
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Image generation failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Generation error')
    }
    setLoading(false)
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
          <ImageIcon className='w-4 h-4' /> AI Image Canvas
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Text-to-Image Generation
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Transform creative prompts into vivid, high-resolution artwork across multiple curated visual styles.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Form */}
        <form
          onSubmit={onSubmitHandler}
          className='lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5'
        >
          {/* Prompt description */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-slate-800' htmlFor='imagePrompt'>
              Describe Your Vision
            </label>
            <textarea
              id='imagePrompt'
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Describe scene, lighting, mood, colors, camera perspective...'
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
                  {p.slice(0, 42)}...
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
                <span>Diffusing Canvas...</span>
              </>
            ) : (
              <>
                <Sparkles className='w-4 h-4' />
                <span>Generate {selectedStyle.name} Image</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Image Canvas Viewer */}
        <div className='lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[500px] max-h-[750px] overflow-hidden'>
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

          {/* Body */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/2'>
            {loading ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-7 h-7' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  Synthesizing pixels in {selectedStyle.name}...
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
                    Enter a creative description and pick a style on the left to render your image.
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-4 w-full max-w-lg'>
                <div className='relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md'>
                  <img
                    src={content}
                    alt={input}
                    className='w-full h-auto object-contain max-h-[480px] mx-auto rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4'>
                    <p className='text-xs text-white line-clamp-2 font-medium'>{input}</p>
                  </div>
                </div>

                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600'>
                  <div className='flex items-center gap-2'>
                    <span className='px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium text-[11px]'>
                      {selectedStyle.name}
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
        </div>
      </div>
    </div>
  )
}

export default GenerateImages
