import React, { useState } from 'react'
import {
  Scissors,
  Sparkles,
  UploadCloud,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Tag,
  ArrowRight,
} from 'lucide-react'
import axios from 'axios'
import { useAuth, useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const objectSuggestions = [
  'person in background',
  'watermark or logo',
  'power lines',
  'trash can',
  'car in background',
  'coffee cup',
]

const RemoveObject = () => {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [object, setObject] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const { getToken } = useAuth()
  const { user } = useUser()

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please upload a valid image file')
      return
    }
    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
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
      toast.error('Please upload an image first')
      return
    }
    if (!object.trim()) {
      toast.error('Please specify which object to remove')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('image', file)
      formData.append('object', object.trim())

      const { data } = await axios.post('/api/ai/remove-image-object', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })

      if (data.success) {
        setContent(data.content)
        toast.success(`Removed "${object}" successfully!`)
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Failed to remove object')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Processing error')
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
        object
          .replace(/[^a-z0-9]/gi, '-')
          .trim()
          .toLowerCase()
          .substring(0, 30) || 'inpainted'

      const a = document.createElement('a')
      a.href = url
      a.download = `${safeName}-erased.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Inpainted image downloaded!')
    } catch (err) {
      toast.error('Failed to download image')
    }
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase'>
          <Scissors className='w-4 h-4' /> AI Magic Inpainting
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Remove Objects & Blemishes
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Erase photobombers, power lines, watermarks, or unwanted items with natural context-aware infilling.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Form */}
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
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <input
              id='objectFileInput'
              type='file'
              accept='image/*'
              onChange={(e) => handleFileChange(e.target.files[0])}
              className='absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10'
            />

            {previewUrl ? (
              <div className='space-y-3'>
                <div className='relative max-w-[200px] mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-sm'>
                  <img
                    src={previewUrl}
                    alt='Preview'
                    className='w-full h-36 object-contain bg-white'
                  />
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setPreviewUrl('')
                      setContent('')
                    }}
                    className='absolute top-2 right-2 p-1 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white z-20 transition'
                  >
                    <X className='w-3.5 h-3.5' />
                  </button>
                </div>
                <div>
                  <p className='text-xs font-semibold text-slate-800 truncate'>{file?.name}</p>
                  <p className='text-[10px] text-slate-500'>
                    {(file?.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-3 py-4'>
                <div className='w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center'>
                  <UploadCloud className='w-6 h-6' />
                </div>
                <div>
                  <p className='text-xs sm:text-sm font-semibold text-slate-800'>
                    Drop your image here, or <span className='text-indigo-600 underline'>browse</span>
                  </p>
                  <p className='text-[11px] text-slate-400 mt-0.5'>
                    Supports PNG, JPG, WebP up to 15MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Object Name Input */}
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-slate-800' htmlFor='targetObject'>
              What object or text should be removed?
            </label>
            <input
              id='targetObject'
              type='text'
              value={object}
              onChange={(e) => setObject(e.target.value)}
              placeholder='e.g., red cup, unwanted person, electrical wires...'
              className='w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition'
              required
            />
          </div>

          {/* Quick Object Suggestions */}
          <div className='space-y-1.5'>
            <p className='text-[11px] font-medium text-slate-400 flex items-center gap-1'>
              <Tag className='w-3 h-3' /> Common items to erase:
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

          {/* Submit */}
          <button
            type='submit'
            disabled={loading || !file || !object.trim()}
            className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
          >
            {loading ? (
              <>
                <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                <span>Erasing & Infilling...</span>
              </>
            ) : (
              <>
                <Scissors className='w-4 h-4' />
                <span>Remove Object</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Inpainted Result Viewer */}
        <div className='lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[500px] max-h-[750px] overflow-hidden'>
          {/* Header Bar */}
          <div className='p-4 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50'>
            <div className='flex items-center gap-2 min-w-0'>
              <ImageIcon className='w-4 h-4 text-indigo-600 shrink-0' />
              <h2 className='text-xs sm:text-sm font-semibold text-slate-800 truncate'>
                Clean Inpainted Result
              </h2>
            </div>

            {content && (
              <button
                onClick={handleDownload}
                title='Download cleaned image'
                className='p-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs'
              >
                <Download className='w-3.5 h-3.5' />
                <span>Download Result</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/2'>
            {loading ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-7 h-7' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  Erasing "{object}" from scene...
                </h3>
                <p className='text-xs text-slate-500'>
                  Sampling neighboring textures, lighting shadows, and seamlessly filling background pixels.
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
                  <Scissors className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                    Ready to erase
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                    Upload an image, type what to remove, and click "Remove Object" to see seamless inpainting.
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-4 w-full max-w-lg'>
                <div className='relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md'>
                  <img
                    src={content}
                    alt='Cleaned result'
                    className='w-full h-auto object-contain max-h-[480px] mx-auto rounded-2xl'
                  />
                </div>

                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600'>
                  <div className='flex items-center gap-1.5 text-emerald-700 font-medium'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-600' /> Inpainted successfully
                  </div>
                  <button
                    onClick={handleDownload}
                    className='text-indigo-600 hover:text-indigo-700 font-semibold text-xs flex items-center gap-1 cursor-pointer'
                  >
                    <Download className='w-3.5 h-3.5' /> Save image
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

export default RemoveObject
