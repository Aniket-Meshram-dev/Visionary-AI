import React, { useState, useRef, useCallback } from 'react'
import { Sparkles, MoveHorizontal, Scissors, Eraser, CheckCircle2 } from 'lucide-react'
import { assets } from '../assets/assets'

const ComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [activePreset, setActivePreset] = useState('bg-removal') // 'bg-removal' | 'object-removal'
  const isDragging = useRef(false)
  const containerRef = useRef(null)

  const presets = {
    'bg-removal': {
      title: '1-Click Precision Background Removal',
      description: 'Isolate complex edges, hair strands, and product contours onto transparent alpha in under a second.',
      badge: 'Background Isolation',
      icon: Eraser,
      beforeLabel: 'Original Photo',
      afterLabel: 'Transparent Cutout',
      beforeImage: assets.slider_bg_before,
      afterImage: assets.slider_bg_after,
    },
    'object-removal': {
      title: 'Context-Aware AI Object & Inpainting',
      description: 'Erase photobombers, unwanted clutter, and blemishes with seamless neural context synthesis.',
      badge: 'Magic Inpainting',
      icon: Scissors,
      beforeLabel: 'Original (Unwanted Object)',
      afterLabel: 'AI Seamless Inpainted',
      beforeImage: assets.slider_obj_before,
      afterImage: assets.slider_obj_after,
    },
  }

  const current = presets[activePreset]

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.min(Math.max((x / rect.width) * 100, 2), 98)
    setSliderPosition(percent)
  }, [])

  const handlePointerDown = (e) => {
    isDragging.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (_) {}
    handleMove(e.clientX)
  }

  const handlePointerMove = (e) => {
    if (!isDragging.current) return
    handleMove(e.clientX)
  }

  const handlePointerUp = (e) => {
    isDragging.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  return (
    <section className='py-20 px-4 sm:px-8 max-w-6xl mx-auto'>
      {/* Header */}
      <div className='text-center max-w-3xl mx-auto mb-10'>
        <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4'>
          <Sparkles className='w-3.5 h-3.5 text-indigo-400' /> Interactive Visual Intelligence
        </div>
        <h2 className='text-3xl sm:text-5xl font-extrabold tracking-tight text-white'>
          See the AI Precision in <span className='text-gradient'>Real Time</span>
        </h2>
        <p className='mt-3 text-sm sm:text-base text-slate-400'>
          Drag the interactive slider below to inspect pixel-level edge preservation and neural inpainting.
        </p>

        {/* Preset Switcher Pills */}
        <div className='mt-6 inline-flex p-1 bg-slate-900/90 rounded-full border border-slate-800 text-xs font-semibold shadow-inner'>
          <button
            type='button'
            onClick={() => {
              setActivePreset('bg-removal')
              setSliderPosition(50)
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
              activePreset === 'bg-removal'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eraser className='w-3.5 h-3.5' /> Background Removal
          </button>
          <button
            type='button'
            onClick={() => {
              setActivePreset('object-removal')
              setSliderPosition(50)
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
              activePreset === 'object-removal'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className='w-3.5 h-3.5' /> Object Inpainting
          </button>
        </div>
      </div>

      {/* Interactive Slider Container */}
      <div className='relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/40 shadow-2xl backdrop-blur-md p-2 sm:p-4'>
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          className='relative w-full h-[320px] sm:h-[460px] md:h-[500px] rounded-2xl overflow-hidden select-none cursor-ew-resize bg-slate-950 border border-slate-800'
        >
          {/* Base Layer (After AI Processing) */}
          <div className='absolute inset-0 w-full h-full bg-slate-950'>
            <img
              src={current.afterImage}
              alt={current.afterLabel}
              draggable={false}
              className='w-full h-full object-cover select-none pointer-events-none'
            />
            {/* After Floating Tag */}
            <div className='absolute bottom-4 right-4 px-3.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-emerald-400 text-xs font-bold border border-emerald-500/30 shadow-lg flex items-center gap-1.5 pointer-events-none'>
              <CheckCircle2 className='w-3.5 h-3.5 text-emerald-400' /> {current.afterLabel}
            </div>
          </div>

          {/* Overlay Layer (Before Image clipped at sliderPosition) */}
          <div
            className='absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none will-change-[clip-path]'
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={current.beforeImage}
              alt={current.beforeLabel}
              draggable={false}
              className='w-full h-full object-cover select-none pointer-events-none'
            />
            {/* Before Floating Tag */}
            <div className='absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-slate-300 text-xs font-medium border border-slate-700/80 shadow-lg pointer-events-none'>
              {current.beforeLabel}
            </div>
          </div>

          {/* Vertical Divider Line with Center Knob */}
          <div
            className='absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_16px_rgba(255,255,255,0.9)] pointer-events-none'
            style={{ left: `${sliderPosition}%` }}
          >
            <div className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl border-2 border-indigo-600 transition-transform duration-100 hover:scale-110 active:scale-95'>
              <MoveHorizontal className='w-4 h-4 text-slate-900 stroke-[2.5]' />
            </div>
          </div>
        </div>

        {/* Footer info & quick jump buttons */}
        <div className='p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400'>
          <p className='font-medium text-slate-300 flex items-center gap-2'>
            <current.icon className='w-4 h-4 text-indigo-400 shrink-0' /> {current.title}
          </p>
          <div className='flex items-center gap-2 text-[11px] font-mono text-slate-500'>
            <span>Drag handle left or right</span>
            <span className='hidden sm:inline text-slate-700'>•</span>
            <div className='hidden sm:flex items-center gap-1'>
              <button
                type='button'
                onClick={() => setSliderPosition(25)}
                className='px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer transition'
              >
                25%
              </button>
              <button
                type='button'
                onClick={() => setSliderPosition(50)}
                className='px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer transition'
              >
                50%
              </button>
              <button
                type='button'
                onClick={() => setSliderPosition(75)}
                className='px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer transition'
              >
                75%
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ComparisonSlider
