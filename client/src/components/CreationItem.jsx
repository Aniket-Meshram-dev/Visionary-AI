import React, { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import {
  Trash2,
  Download,
  Clipboard,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileText,
  Code,
  Hash,
  Sparkles,
  ExternalLink,
  Calendar,
  Wand2,
  FileDown,
  Briefcase,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import SmartPdfExportModal from './SmartPdfExportModal'

const getTypeConfig = (type, prompt = '') => {
  const lowerPrompt = (prompt || '').toLowerCase()

  switch (type) {
    case 'image':
      if (lowerPrompt.includes('remove background') || lowerPrompt.includes('removed ') || lowerPrompt.includes('cleanup')) {
        return {
          label: 'Photo Cleanup',
          icon: Wand2,
          badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-700',
          gradient: 'from-rose-500 to-pink-600',
        }
      }
      if (lowerPrompt.includes('cover art:')) {
        return {
          label: 'Cover Art',
          icon: ImageIcon,
          badgeBg: 'bg-indigo-50 border-indigo-200/80 text-indigo-700',
          gradient: 'from-indigo-500 to-purple-600',
        }
      }
      return {
        label: 'AI Image',
        icon: ImageIcon,
        badgeBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-700',
        gradient: 'from-emerald-500 to-teal-600',
      }
    case 'article':
      return {
        label: 'Article',
        icon: FileText,
        badgeBg: 'bg-blue-50 border-blue-200/80 text-blue-700',
        gradient: 'from-blue-500 to-indigo-600',
      }
    case 'quick-code':
      return {
        label: 'Code',
        icon: Code,
        badgeBg: 'bg-violet-50 border-violet-200/80 text-violet-700',
        gradient: 'from-violet-500 to-purple-600',
      }
    case 'summary':
      return {
        label: 'Summary',
        icon: Hash,
        badgeBg: 'bg-cyan-50 border-cyan-200/80 text-cyan-700',
        gradient: 'from-cyan-500 to-blue-600',
      }
    case 'resume-review':
      return {
        label: 'Resume Review',
        icon: Sparkles,
        badgeBg: 'bg-amber-50 border-amber-200/80 text-amber-700',
        gradient: 'from-amber-500 to-orange-600',
      }
    case 'resume-builder':
      return {
        label: 'ATS Resume',
        icon: Briefcase,
        badgeBg: 'bg-indigo-50 border-indigo-200/80 text-indigo-700',
        gradient: 'from-indigo-600 to-violet-600',
      }
    default:
      return {
        label: type || 'Creation',
        icon: Sparkles,
        badgeBg: 'bg-slate-50 border-slate-200/80 text-slate-700',
        gradient: 'from-slate-500 to-slate-700',
      }
  }
}

const formatPrompt = (text, maxLength = 100) => {
  if (!text) return 'Untitled Creation'
  const cleaned = text.trim().replace(/\s+/g, ' ')
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.slice(0, maxLength).trim() + '...'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CreationItem = ({ item, onDelete }) => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const config = getTypeConfig(item.type, item.prompt)
  const IconComponent = config.icon

  let resumeObj = null
  if (item.type === 'resume-builder') {
    try {
      resumeObj = typeof item.content === 'string' ? JSON.parse(item.content) : item.content
    } catch (e) {}
  }

  const handleDownload = async (e) => {
    e?.stopPropagation()
    try {
      if (item.type === 'image') {
        const response = await fetch(item.content, { mode: 'cors' })
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `visionary-${item.id}.png`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        toast.success('Image download started!')
      } else {
        const extension = item.type === 'quick-code' ? 'txt' : 'md'
        const blob = new Blob([item.content || ''], { type: 'text/plain;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `visionary-${item.type}-${item.id}.${extension}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        toast.success('File downloaded!')
      }
    } catch (error) {
      toast.error('Failed to download content.')
    }
  }

  const handleCopyContent = (e) => {
    e?.stopPropagation()
    if (!item.content) return
    navigator.clipboard.writeText(item.content).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDeletePrompt = (e) => {
    e?.stopPropagation()
    Swal.fire({
      title: 'Delete creation?',
      text: 'This creation will be permanently removed from your account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl font-medium px-4 py-2',
        cancelButton: 'rounded-xl font-medium px-4 py-2',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(item.id)
      }
    })
  }

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`p-4 sm:p-5 bg-white border rounded-2xl transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${expanded
          ? 'border-indigo-200 ring-2 ring-indigo-500/10'
          : 'border-slate-200/80 hover:border-slate-300'
        }`}
    >
      {/* Top Header Row */}
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='flex items-center gap-3 min-w-0 flex-1'>
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} text-white flex items-center justify-center shrink-0 shadow-xs`}
          >
            <IconComponent className='w-4.5 h-4.5' />
          </div>

          <div className='min-w-0 flex-1'>
            <h3 className='text-sm font-semibold text-slate-800 truncate'>
              {formatPrompt(item.prompt)}
            </h3>
            <div className='flex items-center gap-2 mt-0.5 text-xs text-slate-500'>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.badgeBg}`}
              >
                {config.label}
              </span>
              <span>•</span>
              <span className='flex items-center gap-1 text-[11px]'>
                <Calendar className='w-3 h-3 text-slate-400' />
                {formatDate(item.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-1.5' onClick={(e) => e.stopPropagation()}>
          {/* Copy Button */}
          {item.content && (
            <button
              onClick={handleCopyContent}
              title='Copy content'
              className='p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100 cursor-pointer'
              aria-label='Copy content'
            >
              {copied ? (
                <Check className='w-4 h-4 text-emerald-600' />
              ) : (
                <Clipboard className='w-4 h-4' />
              )}
            </button>
          )}

          {/* Smart Content-Aware PDF Export Button */}
          {item.type !== 'image' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowPdfModal(true)
              }}
              title='Extract as Intelligent PDF'
              className='p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100 cursor-pointer'
              aria-label='Extract as PDF'
            >
              <FileDown className='w-4 h-4' />
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            title='Download'
            className='p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100 cursor-pointer'
            aria-label='Download creation'
          >
            <Download className='w-4 h-4' />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDeletePrompt}
            title='Delete'
            className='p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100 cursor-pointer'
            aria-label='Delete creation'
          >
            <Trash2 className='w-4 h-4' />
          </button>

          {/* Toggle Expand */}
          <div className='p-1 text-slate-400'>
            {expanded ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
          </div>
        </div>
      </div>

      {/* Expanded Content View */}
      {expanded && (
        <div
          className='mt-4 pt-4 border-t border-slate-100'
          onClick={(e) => e.stopPropagation()}
        >
          {item.type === 'image' ? (
            <div className='flex flex-col sm:flex-row gap-4 items-start'>
              <div className='relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-950/5 max-w-md w-full'>
                <img
                  src={item.content}
                  alt={item.prompt || 'Generated content'}
                  className='w-full h-auto object-contain max-h-96 rounded-xl'
                  loading='lazy'
                />
                <a
                  href={item.content}
                  target='_blank'
                  rel='noreferrer'
                  className='absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5'
                >
                  <ExternalLink className='w-3.5 h-3.5' /> Full Size
                </a>
              </div>

              <div className='flex-1 text-xs text-slate-600 space-y-2'>
                <p className='font-semibold text-slate-800 text-sm'>Original Prompt</p>
                <div className='p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] leading-relaxed select-all text-slate-700'>
                  {item.prompt}
                </div>
                <div className='pt-2 flex items-center gap-2'>
                  <button
                    onClick={handleDownload}
                    className='px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer'
                  >
                    <Download className='w-3.5 h-3.5' /> Download Image
                  </button>
                </div>
              </div>
            </div>
          ) : item.type === 'quick-code' ? (
            <div className='space-y-3'>
              <div className='flex items-center justify-between text-xs text-slate-500'>
                <span className='font-mono font-medium text-slate-700'>Generated Snippet</span>
                <button
                  onClick={handleCopyContent}
                  className='flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer'
                >
                  {copied ? <Check className='w-3.5 h-3.5' /> : <Clipboard className='w-3.5 h-3.5' />}
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
              <pre className='p-4 bg-slate-900 text-indigo-100 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed shadow-inner max-h-96'>
                <code>{item.content}</code>
              </pre>
            </div>
          ) : item.type === 'resume-builder' && resumeObj ? (
            <div className='space-y-3'>
              <div className='flex items-center justify-between text-xs text-slate-500'>
                <span className='font-semibold text-slate-700'>ATS Resume Summary</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/ai/resume-builder')
                  }}
                  className='flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition cursor-pointer text-xs'
                >
                  <ExternalLink className='w-3.5 h-3.5' /> Open in Studio
                </button>
              </div>
              <div className='p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3'>
                <div className='flex items-start justify-between gap-4 flex-wrap'>
                  <div>
                    <h4 className='text-base font-bold text-slate-900'>
                      {resumeObj.personal?.fullName || 'Candidate Resume'}
                    </h4>
                    <p className='text-xs font-semibold text-indigo-600'>
                      {resumeObj.personal?.title || item.prompt}
                    </p>
                    {resumeObj.personal?.location && (
                      <p className='text-[11px] text-slate-500 mt-0.5'>{resumeObj.personal.location}</p>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold'>
                      {resumeObj.experience?.length || 0} Experiences
                    </span>
                    <span className='px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold'>
                      {resumeObj.projects?.length || 0} Projects
                    </span>
                  </div>
                </div>

                {resumeObj.summary && (
                  <p className='text-xs text-slate-600 italic border-l-2 border-indigo-400 pl-2.5 py-0.5'>
                    "{resumeObj.summary}"
                  </p>
                )}

                {/* Skills Chips */}
                {resumeObj.skills && (
                  <div className='pt-1'>
                    <span className='text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5'>
                      Technical Competencies
                    </span>
                    <div className='flex flex-wrap gap-1.5'>
                      {Object.values(resumeObj.skills)
                        .flat()
                        .filter(Boolean)
                        .slice(0, 12)
                        .map((sk, idx) => (
                          <span
                            key={idx}
                            className='px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium'
                          >
                            {sk}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='flex items-center justify-between text-xs text-slate-500'>
                <span className='font-medium text-slate-700'>Content Preview</span>
                <button
                  onClick={handleCopyContent}
                  className='flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer'
                >
                  {copied ? <Check className='w-3.5 h-3.5' /> : <Clipboard className='w-3.5 h-3.5' />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
              <div className='p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed max-h-96 overflow-y-auto'>
                <MarkdownRenderer content={item.content} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Content-Aware PDF Exporter Modal */}
      {item.type !== 'image' && (
        <SmartPdfExportModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          title={item.prompt || `Visionary ${config.label}`}
          content={item.content || ''}
          meta={{
            type: item.type,
          }}
        />
      )}
    </div>
  )
}

export default CreationItem
