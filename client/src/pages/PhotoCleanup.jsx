import React, { useState } from 'react'
import {
  Wand2,
  Eraser,
  Scissors,
  Sparkles,
  UploadCloud,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Tag,
  ArrowRight,
  Layers,
  RefreshCw,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import VoiceInputButton from '../components/VoiceInputButton'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const objectSuggestions = [
  'person in background',
  'watermark or logo',
  'power lines',
  'trash can',
  'car in background',
  'coffee cup',
]

const PhotoCleanup = ({ initialMode }) => {
  // Query param mode or prop fallback
  const getInitialMode = () => {
    if (initialMode) return initialMode
    const urlMode = new URLSearchParams(window.location.search).get('mode')
    if (urlMode === 'object' || urlMode === 'erase') return 'object'
    return 'background'
  }

  const [activeMode, setActiveMode] = useState(getInitialMode) // 'background' | 'object'
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [object, setObject] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [processedMode, setProcessedMode] = useState('')

  const { getToken, user } = useAuth()

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP)')
      return
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      toast.error('Image size must be under 15MB')
      return
    }
    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setContent('')
    setProcessedMode('')
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
      toast.error('Please upload an image first')
      return
    }

    if (activeMode === 'object' && !object.trim()) {
      toast.error('Please specify which object or text to remove')
      return
    }

    try {
      setLoading(true)
      const token = await getToken()
      const formData = new FormData()
      formData.append('image', file)

      if (activeMode === 'background') {
        const { data } = await axios.post('/api/ai/remove-image-background', formData, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (data.success) {
          setContent(data.content)
          setProcessedMode('background')
          toast.success('Background removed cleanly!')
          if (user?.reload) user.reload()
        } else {
          toast.error(data.message || 'Failed to remove background')
        }
      } else {
        formData.append('object', object.trim())
        const { data } = await axios.post('/api/ai/remove-image-object', formData, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (data.success) {
          setContent(data.content)
          setProcessedMode('object')
          toast.success(`Removed "${object}" successfully!`)
          if (user?.reload) user.reload()
        } else {
          toast.error(data.message || 'Failed to erase object')
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Processing error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!content) return
    try {
      const response = await fetch(content, { mode: 'cors' })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const originalName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'photo'
      const suffix = processedMode === 'background' ? 'cutout' : 'cleaned'

      const a = document.createElement('a')
      a.href = url
      a.download = `${originalName}-${suffix}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Image downloaded!')
    } catch (err) {
      toast.error('Failed to download image')
    }
  }

  // Convert processed image back into a File to allow chained operations
  const handleUseResultAsInput = async () => {
    if (!content) return
    try {
      toast.loading('Loading result as new input...')
      const response = await fetch(content)
      const blob = await response.blob()
      const newFile = new File([blob], `cleaned-${file?.name || 'photo.png'}`, { type: blob.type })
      handleFileChange(newFile)
      toast.dismiss()
      toast.success('Result loaded as input! You can now apply another tool.')
    } catch (err) {
      toast.dismiss()
      toast.error('Could not load result as input: ' + err.message)
    }
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 text-rose-600 font-semibold text-xs tracking-wider uppercase'>
          <Wand2 className='w-4 h-4' /> AI Photo Cleanup & Magic Studio
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Photo Cleanup & Magic Eraser
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          1-click transparent background cutout and smart AI object & watermark eraser in one unified studio.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Form */}
        <form
          onSubmit={onSubmitHandler}
          className='lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5'
        >
          {/* Unified Mode Switcher Pill */}
          <div className='flex items-center p-1 bg-slate-100 rounded-xl w-full'>
            <button
              type='button'
              onClick={() => setActiveMode('background')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'background'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eraser className='w-3.5 h-3.5 text-rose-500' />
              <span>Remove Background</span>
            </button>

            <button
              type='button'
              onClick={() => setActiveMode('object')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'object'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scissors className='w-3.5 h-3.5 text-indigo-500' />
              <span>Erase Object</span>
            </button>
          </div>

          {/* Unified Drag & Drop Upload */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center transition-all ${
              dragActive
                ? 'border-rose-500 bg-rose-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <input
              id='fileInput'
              type='file'
              accept='image/png,image/jpeg,image/webp,image/jpg'
              onChange={(e) => handleFileChange(e.target.files[0])}
              className='absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10'
            />

            {previewUrl ? (
              <div className='space-y-3'>
                <div className='relative max-w-[220px] mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white'>
                  <img
                    src={previewUrl}
                    alt='Preview'
                    className='w-full h-36 object-contain'
                  />
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setPreviewUrl('')
                      setContent('')
                      setProcessedMode('')
                    }}
                    className='absolute top-2 right-2 p-1 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white z-20 transition cursor-pointer'
                    title='Remove image'
                  >
                    <X className='w-3.5 h-3.5' />
                  </button>
                </div>
                <div>
                  <p className='text-xs font-semibold text-slate-800 truncate'>{file?.name}</p>
                  <p className='text-[10px] text-slate-500'>
                    {(file?.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to change
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-3 py-4'>
                <div
                  className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
                    activeMode === 'background'
                      ? 'bg-rose-50 text-rose-500'
                      : 'bg-indigo-50 text-indigo-500'
                  }`}
                >
                  <UploadCloud className='w-6 h-6' />
                </div>
                <div>
                  <p className='text-xs sm:text-sm font-semibold text-slate-800'>
                    Drop your image here, or{' '}
                    <span
                      className={
                        activeMode === 'background'
                          ? 'text-rose-600 underline'
                          : 'text-indigo-600 underline'
                      }
                    >
                      browse
                    </span>
                  </p>
                  <p className='text-[11px] text-slate-400 mt-0.5'>
                    Supports PNG, JPG, WebP up to 15MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Inputs based on activeMode */}
          {activeMode === 'background' ? (
            /* Background Mode Guidelines */
            <div className='p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-600'>
              <p className='font-semibold text-slate-800 flex items-center gap-1.5'>
                <Sparkles className='w-3.5 h-3.5 text-rose-500' />
                <span>Background Cutout Engine</span>
              </p>
              <ul className='list-disc pl-4 space-y-0.5 text-[11px] text-slate-500'>
                <li>Isolates portraits, ecommerce products, pets, and cars with pixel precision.</li>
                <li>Outputs a clean 32-bit transparent alpha PNG ready for design or web use.</li>
              </ul>
            </div>
          ) : (
            /* Object Mode Inputs */
            <div className='space-y-3'>
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <label className='text-xs font-semibold text-slate-800' htmlFor='targetObject'>
                    What object or text should be removed?
                  </label>
                  <VoiceInputButton
                    onTranscript={(voiceText) =>
                      setObject((prev) => (prev ? `${prev} ${voiceText}` : voiceText))
                    }
                  />
                </div>
                <input
                  id='targetObject'
                  type='text'
                  value={object}
                  onChange={(e) => setObject(e.target.value)}
                  placeholder='e.g., watermark, person in background, trash can, text...'
                  className='w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition'
                  required={activeMode === 'object'}
                />
              </div>

              {/* Quick Suggestion Pills */}
              <div className='space-y-1.5'>
                <p className='text-[11px] font-medium text-slate-400 flex items-center gap-1'>
                  <Tag className='w-3 h-3' /> Common items:
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  {objectSuggestions.map((item) => (
                    <button
                      key={item}
                      type='button'
                      onClick={() => setObject(item)}
                      className='text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-md transition cursor-pointer'
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type='submit'
            disabled={loading || !file}
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
              activeMode === 'background'
                ? 'bg-gradient-to-r from-rose-500 via-orange-500 to-rose-600 hover:opacity-95 shadow-rose-500/20'
                : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:opacity-95 shadow-indigo-500/20'
            }`}
          >
            {loading ? (
              <>
                <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                <span>
                  {activeMode === 'background' ? 'Isolating Subject...' : 'Inpainting Pixels...'}
                </span>
              </>
            ) : activeMode === 'background' ? (
              <>
                <Eraser className='w-4 h-4' />
                <span>Remove Background (Cutout)</span>
              </>
            ) : (
              <>
                <Scissors className='w-4 h-4' />
                <span>Erase {object ? `"${object}"` : 'Object'} with AI</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Canvas Viewer */}
        <div className='lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[520px] max-h-[760px] overflow-hidden'>
          {/* Header Bar */}
          <div className='p-4 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50 flex-wrap'>
            <div className='flex items-center gap-2 min-w-0'>
              <ImageIcon className='w-4 h-4 text-rose-500 shrink-0' />
              <h2 className='text-xs sm:text-sm font-semibold text-slate-800 truncate'>
                {processedMode === 'background'
                  ? 'Transparent Cutout Canvas'
                  : processedMode === 'object'
                  ? 'Inpainted Photo Canvas'
                  : 'Processed Photo Canvas'}
              </h2>
            </div>

            {content && (
              <div className='flex items-center gap-2'>
                {/* Chain edit button */}
                <button
                  type='button'
                  onClick={handleUseResultAsInput}
                  title='Load this result back as input to apply another cleanup tool'
                  className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer'
                >
                  <RefreshCw className='w-3.5 h-3.5 text-slate-500' />
                  <span className='hidden sm:inline'>Edit This Result</span>
                </button>

                <button
                  onClick={handleDownload}
                  title='Download cleaned image'
                  className='p-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs'
                >
                  <Download className='w-3.5 h-3.5' />
                  <span>Download {processedMode === 'background' ? 'PNG' : 'Image'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Canvas Body */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center'>
            {loading ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-7 h-7' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  {activeMode === 'background'
                    ? 'Detecting subject contours...'
                    : `Inpainting & erasing "${object}"...`}
                </h3>
                <p className='text-xs text-slate-500'>
                  {activeMode === 'background'
                    ? 'Extracting alpha channels and isolating foreground.'
                    : 'Synthesizing background textures to fill erased area.'}
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
                  <Wand2 className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                    Ready for Cleanup
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                    Upload your picture on the left and select either "Remove Background" or "Erase Object".
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-4 w-full max-w-lg'>
                {/* Result Viewer: Checkerboard for cutout, solid container for inpaint */}
                <div
                  className='relative rounded-2xl overflow-hidden border border-slate-200 shadow-md p-3'
                  style={
                    processedMode === 'background'
                      ? {
                          backgroundImage: `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)`,
                          backgroundSize: `20px 20px`,
                          backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`,
                        }
                      : { backgroundColor: '#0f172a' }
                  }
                >
                  <img
                    src={content}
                    alt='Cleaned result'
                    className='w-full h-auto object-contain max-h-[460px] mx-auto rounded-xl'
                  />
                </div>

                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600'>
                  <div className='flex items-center gap-1.5 text-emerald-700 font-medium'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                    <span>
                      {processedMode === 'background'
                        ? 'Transparent cutout ready'
                        : `Object removed cleanly`}
                    </span>
                  </div>
                  <button
                    onClick={handleDownload}
                    className='text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer'
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

export default PhotoCleanup
