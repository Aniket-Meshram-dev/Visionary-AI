import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles,
  Scissors,
  Lightbulb,
  Target,
  Languages,
  Maximize2,
  Check,
  X,
  Copy,
  RotateCcw,
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

axios.defaults.baseURL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

const InlineCopilotToolbar = ({
  selectionInfo,
  onReplaceText,
  onClose,
  getToken,
}) => {
  const [loadingAction, setLoadingAction] = useState(null)
  const [previewResult, setPreviewResult] = useState(null)

  if (!selectionInfo || !selectionInfo.text) return null

  const { text, position } = selectionInfo

  const handleAction = async (actionKey) => {
    try {
      setLoadingAction(actionKey)
      setPreviewResult(null)

      const token = await getToken?.()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.post(
        '/api/ai/copilot-rewrite',
        {
          selectedText: text,
          action: actionKey,
        },
        { headers }
      )

      if (response.data?.success && response.data?.result) {
        setPreviewResult(response.data.result)
      } else {
        toast.error(response.data?.message || 'Transformation failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Copilot error')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleApply = () => {
    if (!previewResult) return
    onReplaceText(text, previewResult)
    toast.success('Text updated!')
    onClose()
  }

  const handleCopyPreview = () => {
    if (!previewResult) return
    navigator.clipboard.writeText(previewResult).then(() => {
      toast.success('Copied replacement!')
    })
  }

  // Calculate position constrained within window bounds
  const style = {
    top: Math.max(10, position.top - (previewResult ? 160 : 50)),
    left: Math.max(10, Math.min(window.innerWidth - 380, position.left - 50)),
  }

  return createPortal(
    <div
      style={style}
      className='fixed z-[100] bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-2 animate-in fade-in zoom-in-95 duration-150 max-w-sm w-max'
    >
      {previewResult ? (
        /* Preview / Confirm Replacement Box */
        <div className='p-2 space-y-2 max-w-xs'>
          <div className='flex items-center justify-between text-[11px] font-semibold text-slate-400'>
            <span className='flex items-center gap-1 text-blue-400'>
              <Sparkles className='w-3 h-3' /> Copilot Suggestion
            </span>
            <button
              onClick={() => setPreviewResult(null)}
              className='text-slate-400 hover:text-white p-0.5'
            >
              <X className='w-3 h-3' />
            </button>
          </div>

          <div className='p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 max-h-36 overflow-y-auto leading-relaxed'>
            {previewResult}
          </div>

          <div className='flex items-center gap-1.5 pt-1'>
            <button
              type='button'
              onClick={handleApply}
              className='flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1 transition cursor-pointer shadow-xs'
            >
              <Check className='w-3.5 h-3.5' />
              <span>Replace Selection</span>
            </button>

            <button
              type='button'
              onClick={handleCopyPreview}
              title='Copy replacement'
              className='p-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer'
            >
              <Copy className='w-3.5 h-3.5' />
            </button>
          </div>
        </div>
      ) : (
        /* Quick Action Pills */
        <div className='flex items-center gap-1 text-xs font-medium'>
          <span className='text-[10px] text-blue-400 font-bold px-1.5 flex items-center gap-1 shrink-0'>
            <Sparkles className='w-3 h-3' /> AI Copilot:
          </span>

          <button
            type='button'
            onClick={() => handleAction('shorten')}
            disabled={!!loadingAction}
            className='px-2 py-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50'
          >
            {loadingAction === 'shorten' ? (
              <span className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <Scissors className='w-3 h-3 text-emerald-400' />
            )}
            <span>Shorten</span>
          </button>

          <button
            type='button'
            onClick={() => handleAction('analogy')}
            disabled={!!loadingAction}
            className='px-2 py-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50'
          >
            {loadingAction === 'analogy' ? (
              <span className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <Lightbulb className='w-3 h-3 text-amber-400' />
            )}
            <span>Analogy</span>
          </button>

          <button
            type='button'
            onClick={() => handleAction('persuasive')}
            disabled={!!loadingAction}
            className='px-2 py-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50'
          >
            {loadingAction === 'persuasive' ? (
              <span className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <Target className='w-3 h-3 text-rose-400' />
            )}
            <span>Persuasive</span>
          </button>

          <button
            type='button'
            onClick={() => handleAction('hindi')}
            disabled={!!loadingAction}
            className='px-2 py-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50'
          >
            {loadingAction === 'hindi' ? (
              <span className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <Languages className='w-3 h-3 text-sky-400' />
            )}
            <span>Hindi</span>
          </button>

          <button
            type='button'
            onClick={onClose}
            className='p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}

export default InlineCopilotToolbar
