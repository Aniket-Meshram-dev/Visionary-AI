import React, { useState, useMemo } from 'react'
import {
  FileDown,
  Printer,
  Sparkles,
  Check,
  X,
  Sliders,
  Eye,
  Layers,
  Image as ImageIcon,
  Clock,
  FileText,
  FileCode,
  Share2,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  analyzeContentForPdf,
  generatePrintableHtml,
  printDocumentToPdf,
} from '../utils/pdfFormatter'

const SmartPdfExportModal = ({
  isOpen,
  onClose,
  title = 'Executive Intelligence Document',
  content = '',
  coverImageUrl = '',
  meta = {},
}) => {
  const [theme, setTheme] = useState('executive') // 'executive' | 'modern' | 'minimalist'
  const [includeCover, setIncludeCover] = useState(Boolean(coverImageUrl))
  const [includeTakeaways, setIncludeTakeaways] = useState(true)
  const [includeMetaGrid, setIncludeMetaGrid] = useState(true)
  const [includeWatermark, setIncludeWatermark] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Run content-aware intelligence analysis
  const analysis = useMemo(() => {
    return analyzeContentForPdf(content, meta)
  }, [content, meta])

  // Generate printable HTML based on current user options
  const printableHtml = useMemo(() => {
    return generatePrintableHtml({
      title,
      content,
      coverImageUrl,
      meta,
      theme,
      options: {
        includeCover,
        includeTakeaways,
        includeMetaGrid,
        includeWatermark,
      },
    })
  }, [title, content, coverImageUrl, meta, theme, includeCover, includeTakeaways, includeMetaGrid, includeWatermark])

  if (!isOpen) return null

  // Trigger high-DPI vector PDF printing
  const handlePrintPdf = async () => {
    try {
      setIsExporting(true)
      toast.loading('Preparing high-DPI vector PDF...', { id: 'pdf-export' })
      await printDocumentToPdf(printableHtml)
      toast.success('Print / Save PDF dialog opened!', { id: 'pdf-export' })
    } catch (err) {
      console.error('PDF export error:', err)
      toast.error('Failed to open PDF print dialog: ' + err.message, { id: 'pdf-export' })
    } finally {
      setIsExporting(false)
    }
  }

  // Download standalone HTML report
  const handleDownloadHtml = () => {
    try {
      const blob = new Blob([printableHtml], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Document report downloaded!')
    } catch (err) {
      toast.error('Failed to download report: ' + err.message)
    }
  }

  return (
    <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[300] p-3 sm:p-5 animate-in fade-in duration-150'>
      <div className='bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]'>
        {/* Header */}
        <div className='p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center shadow-xs'>
              <FileDown className='w-5 h-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-sm sm:text-base font-bold text-slate-900'>
                  Smart Content-Aware PDF Exporter
                </h2>
                <span className='text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full'>
                  {analysis.badge}
                </span>
              </div>
              <p className='text-xs text-slate-500'>
                Auto-aligned typography, margins, and section breaks tailored to your content
              </p>
            </div>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Intelligence Detection Banner */}
        <div className='bg-slate-900 text-white p-3 px-6 flex flex-wrap items-center justify-between gap-3 text-xs'>
          <div className='flex items-center gap-2'>
            <Sparkles className='w-4 h-4 text-cyan-400 shrink-0' />
            <span>
              <strong>AI Analysis:</strong> Formatted as a{' '}
              <span className='text-cyan-300 font-semibold'>{analysis.label}</span> ({analysis.wordCount} words, ~{analysis.readTime} min read).
            </span>
          </div>

          <div className='flex items-center gap-4 text-[11px] text-slate-300'>
            {analysis.hasTables && <span className='bg-slate-800 px-2 py-0.5 rounded'>📊 Formatted Tables</span>}
            {analysis.hasCodeBlocks && <span className='bg-slate-800 px-2 py-0.5 rounded'>💻 Syntax Containers</span>}
            {analysis.isHindi && <span className='bg-slate-800 px-2 py-0.5 rounded'>🇮🇳 Noto Devanagari Font</span>}
          </div>
        </div>

        {/* Modal Body: Split Layout (Options + Live Scaled Preview) */}
        <div className='flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12'>
          {/* Left Settings Sidebar */}
          <div className='lg:col-span-4 p-5 border-r border-slate-200/80 bg-slate-50/50 overflow-y-auto space-y-5 text-xs'>
            {/* Formatting Options */}
            <div className='space-y-3'>
              <h3 className='text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5'>
                <Sliders className='w-3.5 h-3.5 text-cyan-600' /> Layout & Inclusions
              </h3>

              <div className='space-y-2 bg-white p-3 rounded-xl border border-slate-200'>
                {coverImageUrl && (
                  <label className='flex items-center justify-between cursor-pointer'>
                    <div className='flex items-center gap-2 text-slate-700 font-medium'>
                      <ImageIcon className='w-3.5 h-3.5 text-cyan-600' />
                      <span>Include Cover Banner</span>
                    </div>
                    <input
                      type='checkbox'
                      checked={includeCover}
                      onChange={(e) => setIncludeCover(e.target.checked)}
                      className='w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer'
                    />
                  </label>
                )}

                <label className='flex items-center justify-between cursor-pointer'>
                  <div className='flex items-center gap-2 text-slate-700 font-medium'>
                    <Clock className='w-3.5 h-3.5 text-cyan-600' />
                    <span>Document Metadata Grid</span>
                  </div>
                  <input
                    type='checkbox'
                    checked={includeMetaGrid}
                    onChange={(e) => setIncludeMetaGrid(e.target.checked)}
                    className='w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer'
                  />
                </label>

                {analysis.takeaways.length > 0 && (
                  <label className='flex items-center justify-between cursor-pointer'>
                    <div className='flex items-center gap-2 text-slate-700 font-medium'>
                      <Sparkles className='w-3.5 h-3.5 text-amber-500' />
                      <span>Key Strategic Insights Box</span>
                    </div>
                    <input
                      type='checkbox'
                      checked={includeTakeaways}
                      onChange={(e) => setIncludeTakeaways(e.target.checked)}
                      className='w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer'
                    />
                  </label>
                )}

                <label className='flex items-center justify-between cursor-pointer'>
                  <div className='flex items-center gap-2 text-slate-700 font-medium'>
                    <Info className='w-3.5 h-3.5 text-slate-400' />
                    <span>Institutional Watermark & Footer</span>
                  </div>
                  <input
                    type='checkbox'
                    checked={includeWatermark}
                    onChange={(e) => setIncludeWatermark(e.target.checked)}
                    className='w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer'
                  />
                </label>
              </div>
            </div>

            {/* Document Specs Card */}
            <div className='bg-white p-3.5 rounded-xl border border-slate-200 space-y-2'>
              <h4 className='font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-500'>
                Print & Export Specifications
              </h4>
              <div className='space-y-1 text-slate-600 text-[11px]'>
                <div className='flex justify-between py-0.5 border-b border-slate-100'>
                  <span>Paper Standard:</span>
                  <strong className='text-slate-800'>A4 (Vector 300 DPI)</strong>
                </div>
                <div className='flex justify-between py-0.5 border-b border-slate-100'>
                  <span>Margin Alignment:</span>
                  <strong className='text-slate-800'>Balanced (16mm)</strong>
                </div>
                <div className='flex justify-between py-0.5 border-b border-slate-100'>
                  <span>Page Break Handling:</span>
                  <strong className='text-emerald-700 font-semibold'>Anti-Splitting</strong>
                </div>
                <div className='flex justify-between py-0.5'>
                  <span>Text Vectorization:</span>
                  <strong className='text-emerald-700 font-semibold'>Selectable & Sharp</strong>
                </div>
              </div>
            </div>

            {/* Print Help Tip */}
            <div className='p-3 rounded-xl bg-cyan-50/70 border border-cyan-200/80 text-[11px] text-cyan-900 space-y-1'>
              <p className='font-semibold flex items-center gap-1.5'>
                <Sparkles className='w-3.5 h-3.5 text-cyan-600' /> Vector PDF Output
              </p>
              <p className='text-cyan-800 leading-relaxed'>
                In the print window, select <strong>"Save as PDF"</strong> as destination. All fonts, headings, and tables will render in 100% vector sharpness.
              </p>
            </div>
          </div>

          {/* Right Live Preview Canvas */}
          <div className='lg:col-span-8 bg-slate-100 p-4 sm:p-6 overflow-y-auto flex justify-center items-start'>
            {/* Scaled A4 Document Paper Mockup */}
            <div className='w-full max-w-[620px] bg-white rounded-lg shadow-xl border border-slate-300/80 overflow-hidden text-slate-800'>
              {/* Scaled iframe preview */}
              <iframe
                title='PDF Live Preview'
                srcDoc={printableHtml}
                className='w-full h-[520px] border-none'
                sandbox='allow-same-origin'
              />
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className='p-4 px-6 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3'>
          <div className='text-xs text-slate-500 flex items-center gap-1.5'>
            <Check className='w-4 h-4 text-emerald-600' />
            <span>Format optimized for Executive, Academic & Business distribution</span>
          </div>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleDownloadHtml}
              className='px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer'
              title='Download HTML Report'
            >
              Download HTML
            </button>

            <button
              type='button'
              onClick={handlePrintPdf}
              disabled={isExporting}
              className='px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 hover:opacity-95 shadow-md shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50'
            >
              <Printer className='w-4 h-4' />
              <span>Save / Export as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartPdfExportModal
