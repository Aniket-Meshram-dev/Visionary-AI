import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mermaid from 'mermaid'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Copy,
  Check,
  Code2,
  RefreshCw,
  Sparkles,
  Layers,
  Maximize2,
  Minimize2,
  X,
  Move,
  Focus
} from 'lucide-react'
import toast from 'react-hot-toast'

const VisualMindmapViewer = ({
  mermaidCode,
  isLoading,
  onRegenerate,
  title = 'Visual Concept Mindmap'
}) => {
  const containerRef = useRef(null)
  const [svgContent, setSvgContent] = useState('')
  const [zoom, setZoom] = useState(1.3)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenZoom, setFullscreenZoom] = useState(1.8) // Default to large, clear scale
  const [fullscreenPan, setFullscreenPan] = useState({ x: 0, y: 0 })
  const [isFullscreenDragging, setIsFullscreenDragging] = useState(false)
  const [fullscreenDragStart, setFullscreenDragStart] = useState({ x: 0, y: 0 })

  const [showRawCode, setShowRawCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [renderError, setRenderError] = useState(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#06b6d4',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#0891b2',
        lineColor: '#38bdf8',
        secondaryColor: '#0f172a',
        tertiaryColor: '#1e293b',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '15px',
        nodeBorder: '#0284c7',
        edgeLabelBackground: '#0f172a',
      },
      securityLevel: 'strict',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: false,
        nodeSpacing: 45,
        rankSpacing: 55,
      },
    })
  }, [])

  useEffect(() => {
    if (!mermaidCode) {
      setSvgContent('')
      return
    }

    let isMounted = true
    const renderDiagram = async () => {
      setRenderError(null)
      try {
        const uniqueId = `mermaid-chart-${Date.now()}`
        const { svg } = await mermaid.render(uniqueId, mermaidCode)
        if (isMounted) {
          setSvgContent(svg)
          setPan({ x: 0, y: 0 })
          setFullscreenPan({ x: 0, y: 0 })
          setZoom(1.3)
          setFullscreenZoom(1.8)
        }
      } catch (err) {
        console.warn('Mermaid rendering error:', err)
        if (isMounted) {
          setRenderError('Could not render diagram visually. You can inspect the Mermaid syntax below.')
        }
      }
    }

    renderDiagram()

    return () => {
      isMounted = false
    }
  }, [mermaidCode])

  // ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Drag and Pan Handlers (Inline canvas)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Drag and Pan Handlers (Fullscreen canvas)
  const handleFullscreenMouseDown = (e) => {
    if (e.button !== 0) return
    setIsFullscreenDragging(true)
    setFullscreenDragStart({ x: e.clientX - fullscreenPan.x, y: e.clientY - fullscreenPan.y })
  }

  const handleFullscreenMouseMove = (e) => {
    if (!isFullscreenDragging) return
    setFullscreenPan({
      x: e.clientX - fullscreenDragStart.x,
      y: e.clientY - fullscreenDragStart.y,
    })
  }

  const handleFullscreenMouseUp = () => setIsFullscreenDragging(false)

  // Mouse Wheel Zoom Handlers (Google Maps / Figma style)
  const handleFullscreenWheel = (e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.15 : 0.85
    setFullscreenZoom(prev => Math.min(Math.max(Number((prev * factor).toFixed(2)), 0.3), 6.0))
  }

  const handleInlineWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 0.85
      setZoom(prev => Math.min(Math.max(Number((prev * factor).toFixed(2)), 0.4), 4.0))
    }
  }

  // Zoom controls (Inline)
  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + 0.25).toFixed(2)), 4.0))
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - 0.25).toFixed(2)), 0.4))
  const handleResetZoom = () => {
    setZoom(1.3)
    setPan({ x: 0, y: 0 })
  }

  // Zoom controls (Fullscreen)
  const handleFullscreenZoomIn = () => setFullscreenZoom(prev => Math.min(Number((prev + 0.25).toFixed(2)), 6.0))
  const handleFullscreenZoomOut = () => setFullscreenZoom(prev => Math.max(Number((prev - 0.25).toFixed(2)), 0.3))
  const handleFullscreenResetZoom = () => {
    setFullscreenZoom(1.8)
    setFullscreenPan({ x: 0, y: 0 })
  }

  const handleCopyCode = () => {
    if (!mermaidCode) return
    navigator.clipboard.writeText(mermaidCode).then(() => {
      setCopied(true)
      toast.success('Mermaid code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownloadSvg = () => {
    if (!svgContent) return
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mindmap-${Date.now()}.svg`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Mindmap SVG downloaded!')
  }

  return (
    <div className='bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full min-h-[500px]'>
      {/* Dynamic CSS for SVG Crisp Text & Unconstrained Width */}
      <style>{`
        .mermaid-svg-wrapper svg,
        .mermaid-svg-fullscreen svg {
          max-width: none !important;
          height: auto !important;
          overflow: visible !important;
        }
        .mermaid-svg-fullscreen svg text,
        .mermaid-svg-wrapper svg text {
          font-size: 15px !important;
          font-weight: 600 !important;
          fill: #ffffff !important;
          font-family: Inter, system-ui, sans-serif !important;
        }
        .mermaid-svg-fullscreen svg .node rect,
        .mermaid-svg-wrapper svg .node rect {
          rx: 8px !important;
          ry: 8px !important;
          stroke-width: 2px !important;
        }
      `}</style>

      {/* Header Controls Bar */}
      <div className='p-3 px-4 sm:px-5 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5'>
        <div className='flex items-center gap-2 min-w-0'>
          <div className='w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400'>
            <Layers className='w-4 h-4' />
          </div>
          <div>
            <h3 className='text-xs sm:text-sm font-semibold text-white tracking-wide truncate'>
              {title}
            </h3>
            <p className='text-[10px] text-slate-400'>Hierarchical concept flow • Drag to navigate</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className='flex items-center gap-1.5 flex-wrap'>
          {/* Zoom Controls */}
          <div className='flex items-center bg-slate-800/90 border border-slate-700/70 rounded-lg p-0.5 text-xs text-slate-300'>
            <button
              type='button'
              onClick={handleZoomOut}
              title='Zoom Out'
              className='p-1.5 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer'
            >
              <ZoomOut className='w-3.5 h-3.5' />
            </button>
            <button
              type='button'
              onClick={handleResetZoom}
              title='Reset Zoom'
              className='px-2 py-1 text-[11px] font-mono hover:text-white hover:bg-slate-700 rounded transition cursor-pointer'
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type='button'
              onClick={handleZoomIn}
              title='Zoom In'
              className='p-1.5 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer'
            >
              <ZoomIn className='w-3.5 h-3.5' />
            </button>
          </div>

          {/* Fullscreen Expand Button (PROMINENT) */}
          <button
            type='button'
            onClick={() => setIsFullscreen(true)}
            disabled={!svgContent}
            className='p-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 hover:opacity-95 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40'
            title='Open in Fullscreen Studio'
          >
            <Maximize2 className='w-3.5 h-3.5' />
            <span>Full Window</span>
          </button>

          {/* Toggle Raw Code */}
          <button
            type='button'
            onClick={() => setShowRawCode(!showRawCode)}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
              showRawCode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
            title='View Mermaid Source'
          >
            <Code2 className='w-3.5 h-3.5' />
            <span className='hidden sm:inline'>{showRawCode ? 'Diagram' : 'Code'}</span>
          </button>

          {/* Copy Code */}
          <button
            type='button'
            onClick={handleCopyCode}
            className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer'
            title='Copy Mermaid Code'
          >
            {copied ? (
              <Check className='w-3.5 h-3.5 text-emerald-400' />
            ) : (
              <Copy className='w-3.5 h-3.5' />
            )}
            <span className='hidden sm:inline'>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download SVG */}
          <button
            type='button'
            onClick={handleDownloadSvg}
            disabled={!svgContent}
            className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50'
            title='Download Vector SVG'
          >
            <Download className='w-3.5 h-3.5' />
            <span className='hidden sm:inline'>SVG</span>
          </button>

          {/* Regenerate */}
          {onRegenerate && (
            <button
              type='button'
              onClick={onRegenerate}
              disabled={isLoading}
              className='p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer'
              title='Regenerate Concept Map'
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Canvas Area (Supports Drag + Ctrl/Wheel Zoom) */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleInlineWheel}
        className='flex-1 overflow-hidden p-4 sm:p-6 bg-[#080d1a] flex items-center justify-center relative select-none cursor-grab active:cursor-grabbing'
        style={{
          backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {isLoading ? (
          <div className='text-center py-16 space-y-3 pointer-events-none'>
            <div className='w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center animate-bounce'>
              <Sparkles className='w-6 h-6' />
            </div>
            <p className='text-sm font-semibold text-slate-200'>Synthesizing Concept Mindmap...</p>
            <p className='text-xs text-slate-400 max-w-xs'>
              Mapping relationships, core entities, and sub-arguments into a clean tree structure.
            </p>
          </div>
        ) : showRawCode ? (
          <div className='w-full h-full p-4 font-mono text-xs text-emerald-400 bg-slate-950 rounded-xl overflow-auto border border-slate-800 leading-relaxed cursor-text'>
            <pre className='whitespace-pre-wrap'>{mermaidCode || '// No Mermaid code generated'}</pre>
          </div>
        ) : renderError ? (
          <div className='text-center py-12 px-4 max-w-md space-y-3 bg-slate-900/80 rounded-2xl border border-rose-900/50 p-6'>
            <p className='text-sm font-semibold text-rose-400'>{renderError}</p>
            <button
              type='button'
              onClick={() => setShowRawCode(true)}
              className='px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:bg-slate-700 transition cursor-pointer'
            >
              View Raw Mermaid Code
            </button>
          </div>
        ) : svgContent ? (
          <div
            ref={containerRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            }}
            className='mermaid-svg-wrapper flex items-center justify-center min-w-max pointer-events-none'
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className='text-center py-16 text-slate-400 space-y-3 max-w-xs mx-auto pointer-events-auto'>
            <div className='w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400'>
              <Layers className='w-6 h-6' />
            </div>
            <p className='text-xs font-medium text-slate-300'>Visualize core concepts, hierarchies & insights in an interactive tree</p>
            {onRegenerate && (
              <button
                type='button'
                onClick={onRegenerate}
                disabled={isLoading}
                className='px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:opacity-95 shadow-md shadow-cyan-500/20 transition flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50'
              >
                <Sparkles className='w-3.5 h-3.5' />
                <span>Synthesize Concept Mindmap</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className='px-4 py-2 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between'>
        <span className='flex items-center gap-1.5'>
          <Move className='w-3 h-3 text-cyan-400' /> Click & drag canvas to pan • Use + / - to zoom
        </span>
        <button
          type='button'
          onClick={() => setIsFullscreen(true)}
          disabled={!svgContent}
          className='text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40'
        >
          <Maximize2 className='w-3 h-3' /> Open Fullscreen Canvas
        </button>
      </div>

      {/* 🚀 FULLSCREEN MODAL STUDIO */}
      {isFullscreen &&
        createPortal(
          <div className='fixed inset-0 z-[300] bg-[#070b14] flex flex-col animate-in fade-in duration-150 select-none'>
            {/* Fullscreen Header with Zoom Presets & Floating Controls */}
            <div className='p-3.5 px-6 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-4 z-10'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400'>
                  <Layers className='w-5 h-5' />
                </div>
                <div>
                  <h2 className='text-sm sm:text-base font-bold text-white'>{title}</h2>
                  <p className='text-xs text-slate-400'>Interactive Canvas Studio • Scroll wheel to zoom • Drag to pan</p>
                </div>
              </div>

              {/* Fullscreen Floating Controls */}
              <div className='flex items-center gap-2'>
                {/* Quick Zoom Presets */}
                <div className='hidden md:flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5 text-xs text-slate-300'>
                  {[1.0, 1.5, 2.0, 3.0].map((preset) => (
                    <button
                      key={preset}
                      type='button'
                      onClick={() => setFullscreenZoom(preset)}
                      className={`px-2 py-1 rounded-lg font-mono font-medium transition cursor-pointer ${
                        Math.round(fullscreenZoom * 10) === Math.round(preset * 10)
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {Math.round(preset * 100)}%
                    </button>
                  ))}
                </div>

                {/* Zoom Box */}
                <div className='flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs text-slate-200'>
                  <button
                    type='button'
                    onClick={handleFullscreenZoomOut}
                    title='Zoom Out'
                    className='p-1.5 hover:bg-slate-800 rounded-lg transition cursor-pointer'
                  >
                    <ZoomOut className='w-4 h-4' />
                  </button>
                  <button
                    type='button'
                    onClick={handleFullscreenResetZoom}
                    title='Reset Zoom'
                    className='px-2.5 py-1 font-mono font-bold hover:bg-slate-800 rounded-lg transition cursor-pointer'
                  >
                    {Math.round(fullscreenZoom * 100)}%
                  </button>
                  <button
                    type='button'
                    onClick={handleFullscreenZoomIn}
                    title='Zoom In'
                    className='p-1.5 hover:bg-slate-800 rounded-lg transition cursor-pointer'
                  >
                    <ZoomIn className='w-4 h-4' />
                  </button>
                </div>

                {/* Reset Position */}
                <button
                  type='button'
                  onClick={handleFullscreenResetZoom}
                  className='p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer'
                  title='Center & Reset View'
                >
                  <Focus className='w-4 h-4 text-cyan-400' />
                  <span className='hidden sm:inline'>Center</span>
                </button>

                {/* Export SVG */}
                <button
                  type='button'
                  onClick={handleDownloadSvg}
                  className='p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs'
                  title='Download SVG'
                >
                  <Download className='w-4 h-4' />
                  <span className='hidden sm:inline'>Export SVG</span>
                </button>

                {/* Close Fullscreen */}
                <button
                  type='button'
                  onClick={() => setIsFullscreen(false)}
                  className='p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer'
                  title='Exit Fullscreen (Esc)'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>
            </div>

            {/* Fullscreen Drag Canvas (with Mouse Wheel Zoom) */}
            <div
              onMouseDown={handleFullscreenMouseDown}
              onMouseMove={handleFullscreenMouseMove}
              onMouseUp={handleFullscreenMouseUp}
              onMouseLeave={handleFullscreenMouseUp}
              onWheel={handleFullscreenWheel}
              className='flex-1 overflow-hidden relative flex items-center justify-center cursor-grab active:cursor-grabbing'
              style={{
                backgroundImage: 'radial-gradient(#1e293b 1.5px, transparent 1.5px)',
                backgroundSize: '32px 32px',
              }}
            >
              <div
                style={{
                  transform: `translate(${fullscreenPan.x}px, ${fullscreenPan.y}px) scale(${fullscreenZoom})`,
                  transformOrigin: 'center center',
                  transition: isFullscreenDragging ? 'none' : 'transform 0.12s ease-out',
                }}
                className='mermaid-svg-fullscreen min-w-max flex items-center justify-center pointer-events-none'
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>

            {/* Fullscreen Bottom Helper Pill */}
            <div className='absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-2xl backdrop-blur-md text-xs text-slate-300 flex items-center gap-3 z-10'>
              <span className='flex items-center gap-1.5 text-cyan-400 font-medium'>
                <Move className='w-3.5 h-3.5' /> Left-click & drag anywhere to pan
              </span>
              <span className='text-slate-600'>•</span>
              <span>Scroll mouse wheel to zoom in/out</span>
              <span className='text-slate-600'>•</span>
              <span className='text-slate-400'>Press Esc to exit</span>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default VisualMindmapViewer
