import React, { useState } from 'react'
import {
  Eraser,
  Sparkles,
  UploadCloud,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const RemoveBackground = () => {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const { getToken, user } = useAuth()

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP)')
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
      toast.error('Please select an image first')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('image', file)

      const { data } = await axios.post('/api/ai/remove-image-background', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })

      if (data.success) {
        setContent(data.content)
        toast.success('Background removed cleanly!')
        if (user?.reload) user.reload()
      } else {
        toast.error(data.message || 'Failed to remove background')
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

      const originalName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'subject'

      const a = document.createElement('a')
      a.href = url
      a.download = `${originalName}-cutout.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Cutout downloaded!')
    } catch (err) {
      toast.error('Failed to download cutout image')
    }
  }

  return (
    <div className='h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto'>
      {/* Page Title */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 text-rose-500 font-semibold text-xs tracking-wider uppercase'>
          <Eraser className='w-4 h-4' /> AI Isolation Studio
        </div>
        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-1'>
          Remove Image Background
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 mt-1'>
          Precision cutout engine that isolates portraits, ecommerce products, and objects with pixel accuracy.
        </p>
      </div>

      {/* Split Workbench */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Column: Upload Dropzone */}
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
                ? 'border-rose-500 bg-rose-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <input
              id='fileInput'
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
                <div className='w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center'>
                  <UploadCloud className='w-6 h-6' />
                </div>
                <div>
                  <p className='text-xs sm:text-sm font-semibold text-slate-800'>
                    Drop your image here, or <span className='text-rose-500 underline'>browse</span>
                  </p>
                  <p className='text-[11px] text-slate-400 mt-0.5'>
                    Supports PNG, JPG, WebP up to 15MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className='p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-600'>
            <p className='font-semibold text-slate-800 flex items-center gap-1'>
              <Sparkles className='w-3.5 h-3.5 text-rose-500' /> Best Practices
            </p>
            <ul className='list-disc pl-4 space-y-0.5 text-[11px] text-slate-500'>
              <li>High-contrast subjects produce the sharpest cutouts</li>
              <li>Supports humans, pets, cars, furniture, and eCommerce items</li>
              <li>Output is delivered as a 32-bit transparent PNG</li>
            </ul>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={loading || !file}
            className='w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-rose-500 via-orange-500 to-rose-600 hover:opacity-95 shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
          >
            {loading ? (
              <>
                <span className='w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin' />
                <span>Isolating Subject...</span>
              </>
            ) : (
              <>
                <Eraser className='w-4 h-4' />
                <span>Remove Background</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Processed Cutout Viewer */}
        <div className='lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[500px] max-h-[750px] overflow-hidden'>
          {/* Header Bar */}
          <div className='p-4 px-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50'>
            <div className='flex items-center gap-2 min-w-0'>
              <ImageIcon className='w-4 h-4 text-rose-500 shrink-0' />
              <h2 className='text-xs sm:text-sm font-semibold text-slate-800 truncate'>
                Transparent Cutout
              </h2>
            </div>

            {content && (
              <button
                onClick={handleDownload}
                title='Download transparent cutout'
                className='p-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 transition flex items-center gap-1.5 cursor-pointer shadow-xs'
              >
                <Download className='w-3.5 h-3.5' />
                <span>Download PNG</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center'>
            {loading ? (
              <div className='py-16 text-center space-y-4 max-w-sm mx-auto'>
                <div className='w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center animate-bounce'>
                  <Sparkles className='w-7 h-7' />
                </div>
                <h3 className='text-sm font-semibold text-slate-800'>
                  Detecting subject outlines...
                </h3>
                <p className='text-xs text-slate-500'>
                  Separating foreground elements and removing background alpha channels.
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
                  <Eraser className='w-7 h-7' />
                </div>
                <div className='max-w-xs'>
                  <h3 className='text-xs sm:text-sm font-semibold text-slate-700'>
                    Ready to isolate
                  </h3>
                  <p className='text-[11px] sm:text-xs text-slate-400 mt-1'>
                    Upload your picture on the left and click "Remove Background" to see the transparent cutout.
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-4 w-full max-w-lg'>
                {/* Checkerboard Transparent Pattern */}
                <div
                  className='relative rounded-2xl overflow-hidden border border-slate-200 shadow-md p-4'
                  style={{
                    backgroundImage: `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)`,
                    backgroundSize: `20px 20px`,
                    backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`,
                  }}
                >
                  <img
                    src={content}
                    alt='Cutout result'
                    className='w-full h-auto object-contain max-h-[460px] mx-auto'
                  />
                </div>

                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600'>
                  <div className='flex items-center gap-1.5 text-emerald-700 font-medium'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-600' /> Alpha channel cutout ready
                  </div>
                  <button
                    onClick={handleDownload}
                    className='text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer'
                  >
                    <Download className='w-3.5 h-3.5' /> Save transparent PNG
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

export default RemoveBackground
